// Haptic feedback and sound effects utility
export class HapticFeedback {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private async loadSounds() {
    const sounds = {
      tap: this.generateTapSound(),
      check: this.generateCheckSound(),
      success: this.generateSuccessSound()
    };

    for (const [name, soundPromise] of Object.entries(sounds)) {
      try {
        const buffer = await soundPromise;
        this.soundBuffers.set(name, buffer);
      } catch (error) {
        console.warn(`Failed to load ${name} sound:`, error);
      }
    }
  }

  private async generateTapSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // 100ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a quick tap sound (brief sine wave with envelope)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30); // Quick decay
      const frequency = 800; // 800Hz tap sound
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  private async generateCheckSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2; // 200ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a double-click check sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sound = 0;

      // First click at 0ms
      if (t < 0.05) {
        const envelope1 = Math.exp(-t * 50);
        sound += Math.sin(2 * Math.PI * 1000 * t) * envelope1 * 0.4;
      }

      // Second click at 80ms
      if (t > 0.08 && t < 0.13) {
        const t2 = t - 0.08;
        const envelope2 = Math.exp(-t2 * 50);
        sound += Math.sin(2 * Math.PI * 1200 * t2) * envelope2 * 0.4;
      }

      data[i] = sound;
    }

    return buffer;
  }

  private async generateSuccessSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a pleasant success sound (ascending notes)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sound = 0;

      notes.forEach((freq, index) => {
        const noteStart = index * 0.15;
        const noteEnd = noteStart + 0.2;
        
        if (t >= noteStart && t <= noteEnd) {
          const noteTime = t - noteStart;
          const envelope = Math.exp(-noteTime * 3) * Math.sin(Math.PI * noteTime / 0.2);
          sound += Math.sin(2 * Math.PI * freq * noteTime) * envelope * 0.2;
        }
      });

      data[i] = sound;
    }

    return buffer;
  }

  // Main haptic feedback method
  public vibrate(pattern: number | number[] = 50) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Play sound effect
  public playSound(soundName: 'tap' | 'check' | 'success') {
    if (!this.audioContext || !this.soundBuffers.has(soundName)) return;

    try {
      const buffer = this.soundBuffers.get(soundName);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Adjust volume based on sound type
      gainNode.gain.value = soundName === 'success' ? 0.7 : 0.5;
      
      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Combined haptic + sound for different actions
  public addToCart() {
    this.vibrate(50); // Short vibration
    this.playSound('tap');
  }

  public updateQuantity() {
    this.vibrate(30); // Shorter vibration
    this.playSound('tap');
  }

  public completeSection() {
    this.vibrate([50, 50, 50]); // Double vibration
    this.playSound('check');
  }

  public paymentSuccess() {
    this.vibrate([100, 50, 100]); // Success pattern
    this.playSound('success');
  }

  // Button press with haptic feedback
  public buttonPress() {
    this.vibrate(30);
    this.playSound('tap');
  }

  // Enable audio context (must be called after user interaction)
  public enableAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Global instance
export const haptic = new HapticFeedback();

// Utility function to enable haptics on first user interaction
export const enableHapticsOnFirstInteraction = () => {
  const enableOnInteraction = () => {
    haptic.enableAudio();
    document.removeEventListener('touchstart', enableOnInteraction);
    document.removeEventListener('click', enableOnInteraction);
  };

  document.addEventListener('touchstart', enableOnInteraction, { once: true });
  document.addEventListener('click', enableOnInteraction, { once: true });
};

// React hook for haptic feedback
export const useHapticFeedback = () => {
  return {
    addToCart: () => haptic.addToCart(),
    updateQuantity: () => haptic.updateQuantity(),
    completeSection: () => haptic.completeSection(),
    paymentSuccess: () => haptic.paymentSuccess(),
    buttonPress: () => haptic.buttonPress(),
    vibrate: (pattern: number | number[]) => haptic.vibrate(pattern),
    playSound: (sound: 'tap' | 'check' | 'success') => haptic.playSound(sound)
  };
};