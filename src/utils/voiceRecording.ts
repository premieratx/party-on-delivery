// Voice recording utilities with VAD and improved speech detection

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isMonitoring = false;
  private silenceStart = 0;
  private speechDetected = false;
  
  constructor(
    private onSpeechStart: () => void,
    private onSpeechEnd: () => void,
    private silenceThreshold = 1500, // 1.5 seconds of silence before stopping
    private volumeThreshold = 30 // Minimum volume to consider as speech
  ) {}

  async start(stream: MediaStream) {
    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isMonitoring = true;
      this.speechDetected = false;
      this.silenceStart = Date.now();
      
      this.monitor();
    } catch (error) {
      console.error('Error starting VAD:', error);
      throw error;
    }
  }

  private monitor() {
    if (!this.isMonitoring || !this.analyser || !this.dataArray) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    const average = this.dataArray.reduce((acc, val) => acc + val, 0) / this.dataArray.length;
    
    if (average > this.volumeThreshold) {
      // Speech detected
      if (!this.speechDetected) {
        this.speechDetected = true;
        this.onSpeechStart();
        console.log('Speech started, volume:', average);
      }
      this.silenceStart = Date.now();
    } else {
      // Silence detected
      if (this.speechDetected && Date.now() - this.silenceStart > this.silenceThreshold) {
        this.speechDetected = false;
        this.onSpeechEnd();
        console.log('Speech ended after silence');
        return; // Stop monitoring after speech ends
      }
    }

    requestAnimationFrame(() => this.monitor());
  }

  stop() {
    this.isMonitoring = false;
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class EnhancedVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private vad: VoiceActivityDetector | null = null;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private maxRecordingTime = 30000; // 30 seconds max
  private isRecording = false;

  constructor(
    private onRecordingComplete: (audioBlob: Blob) => void,
    private onError: (error: Error) => void,
    private onSpeechStart?: () => void,
    private onSpeechEnd?: () => void
  ) {}

  async startRecording(): Promise<void> {
    try {
      console.log('Starting enhanced voice recording...');
      
      // Request microphone with enhanced audio settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioChunks = [];
      this.isRecording = true;

      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.onRecordingComplete(audioBlob);
        }
        this.cleanup();
      };

      // Start VAD for speech detection
      this.vad = new VoiceActivityDetector(
        () => {
          console.log('VAD: Speech detected');
          this.onSpeechStart?.();
          // Clear any existing timeout and extend recording
          if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
          }
        },
        () => {
          console.log('VAD: Speech ended');
          this.onSpeechEnd?.();
          // Stop recording after speech ends
          setTimeout(() => {
            if (this.isRecording) {
              this.stopRecording();
            }
          }, 500); // Small delay to catch any final words
        },
        2000, // 2 seconds of silence before stopping (increased from 1.5)
        25    // Lower volume threshold for better sensitivity
      );

      await this.vad.start(this.stream);
      this.mediaRecorder.start(100); // Collect data every 100ms

      // Fallback timeout to prevent infinite recording
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          console.log('Recording timeout reached');
          this.stopRecording();
        }
      }, this.maxRecordingTime);

      console.log('Voice recording started with VAD');

    } catch (error) {
      console.error('Error starting recording:', error);
      this.onError(error as Error);
      this.cleanup();
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return;
    
    console.log('Stopping voice recording...');
    this.isRecording = false;

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.vad) {
      this.vad.stop();
      this.vad = null;
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.vad) {
      this.vad.stop();
      this.vad = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

// Utility function to convert audio blob to base64
export const audioToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};