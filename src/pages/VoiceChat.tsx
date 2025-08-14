import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, ArrowLeft, MessageCircle, Sparkles, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
}

const VoiceChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Permission granted, stop the stream for now
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      
      toast({
        title: "Microphone Access Granted! 🎤",
        description: "You can now use voice input by holding the mic button.",
      });
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Play audio from base64
  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioEnabled) return;
    
    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      toast({
        title: "Audio Playback Error",
        description: "Unable to play audio response.",
        variant: "destructive",
      });
    }
  }, [audioEnabled, toast]);

  // Generate AI response with TTS
  const generateAIResponse = useCallback(async (userMessage: string) => {
    try {
      // Get AI response
      const { data, error } = await supabase.functions.invoke('ai-voice-assistant', {
        body: {
          message: userMessage,
          conversation: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: 'party_planning'
        }
      });

      if (error) throw error;

      const aiResponseText = data.reply || "I'm here to help with your party planning!";
      
      // Add AI message to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
        hasAudio: true
      };

      setMessages(prev => [...prev, aiMessage]);

      // Generate TTS if audio is enabled
      if (audioEnabled) {
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: aiResponseText,
            voice: 'nova'
          }
        });

        if (!ttsError && ttsData?.audioContent) {
          await playAudio(ttsData.audioContent);
        }
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble right now, but I'm still here to help you plan an amazing party! What can I help you with?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
  }, [messages, audioEnabled, playAudio]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    // If this is the first message, start the conversation
    if (!conversationStarted) {
      setConversationStarted(true);
      setShowIntro(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Generate AI response
    await generateAIResponse(messageText);
  }, [conversationStarted, generateAIResponse]);

  // Start conversation
  const startConversation = useCallback(async () => {
    setShowIntro(false);
    setConversationStarted(true);
    
    const welcomeText = `🎉 HELL YEAH! Welcome to Party On Delivery! I'm absolutely pumped to help you throw the most EPIC party EVER! 

Let's get this party planning started! Tell me - what's the vibe you're going for? Is this a birthday bash, graduation celebration, weekend hangout, or just because life's awesome?

And hey, if you're not sure what drinks you want, just say "surprise me" or "put together a good list" and I'll hook you up with some fantastic suggestions based on your crowd and budget! 🍻🥳`;

    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date(),
      hasAudio: true
    };
    
    setMessages([welcomeMessage]);

    // Play welcome audio if enabled
    if (audioEnabled) {
      try {
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: welcomeText,
            voice: 'nova'
          }
        });

        if (!ttsError && ttsData?.audioContent) {
          await playAudio(ttsData.audioContent);
        }
      } catch (error) {
        console.error('Error playing welcome audio:', error);
      }
    }
  }, [audioEnabled, playAudio]);

  // Enhanced voice recording with better error handling
  const startRecording = useCallback(async () => {
    if (!micPermissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsListening(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to start voice recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [micPermissionGranted, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  }, [isRecording]);

  // Process audio recording and transcribe
  const processAudioRecording = useCallback(async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to voice-to-text service
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        const transcribedText = data.text || '';
        
        if (transcribedText.trim()) {
          // Append to existing text instead of overwriting
          setInputText(prev => prev + (prev ? ' ' : '') + transcribedText);
          
          toast({
            title: "Voice Transcribed! 🎤",
            description: `"${transcribedText}"`,
          });
        } else {
          toast({
            title: "No Speech Detected",
            description: "Try speaking clearly and holding the button longer.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription Error",
        description: "Unable to convert speech to text.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    setAudioEnabled(!audioEnabled);
    
    // Stop any currently playing audio if disabling
    if (audioEnabled && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }

    toast({
      title: audioEnabled ? "Audio Disabled 🔇" : "Audio Enabled 🔊",
      description: audioEnabled ? "Voice responses are now muted" : "Voice responses are now enabled",
    });
  }, [audioEnabled, toast]);

  const handleHoldToSpeak = {
    onMouseDown: startRecording,
    onMouseUp: stopRecording,
    onTouchStart: startRecording,
    onTouchEnd: stopRecording,
    onMouseLeave: stopRecording,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Party Elements */}
        <div className="absolute top-10 left-10 animate-bounce">
          🎈
        </div>
        <div className="absolute top-20 right-20 animate-pulse">
          🎊
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce" style={{animationDelay: '1s'}}>
          🥳
        </div>
        <div className="absolute bottom-10 right-10 animate-pulse" style={{animationDelay: '2s'}}>
          🍻
        </div>
        <div className="absolute top-1/2 left-1/4 animate-spin" style={{animationDuration: '10s'}}>
          ✨
        </div>
        <div className="absolute top-1/3 right-1/3 animate-ping" style={{animationDelay: '1.5s'}}>
          🎉
        </div>
        
        {/* Disco Ball Effect */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-spin opacity-70" style={{animationDuration: '3s'}}></div>
      </div>

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm text-white p-4 flex items-center gap-3 shadow-xl relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PartyPopper className="w-8 h-8 text-yellow-400" />
        <div className="flex-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Party Assistant
          </h1>
          <p className="text-sm opacity-90">Let's plan your perfect party! 🎉</p>
        </div>
        
        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAudio}
          className={`text-white hover:bg-white/20 ${isSpeaking ? 'animate-pulse' : ''}`}
        >
          {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
      </div>

      {/* Intro Screen */}
      {showIntro && (
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                Let's Plan Your Party!
              </h2>
              <p className="text-lg opacity-90">
                Ready to throw the most epic party ever? I'm here to help you pick the perfect drinks and supplies!
              </p>
              <div className="space-y-4">
                <Button
                  onClick={startConversation}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 text-lg"
                  size="lg"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  Let's Get This Party Started!
                </Button>
                <p className="text-sm opacity-75">
                  I can both hear you speak and talk back to you! 🗣️🎤
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Interface */}
      {!showIntro && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50' 
                    : 'bg-white/90 backdrop-blur-sm text-gray-900 border-white/50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.hasAudio && message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // Replay audio for this message
                            supabase.functions.invoke('text-to-speech', {
                              body: { text: message.content, voice: 'nova' }
                            }).then(({ data }) => {
                              if (data?.audioContent) {
                                playAudio(data.audioContent);
                              }
                            });
                          }}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/20 bg-black/20 backdrop-blur-sm p-4 space-y-4 relative z-10">
            {/* Text Input */}
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message or hold the mic button to speak..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(inputText);
                  }
                }}
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/70"
              />
              <Button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
                size="icon"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Hold to Speak Button */}
            <div className="flex flex-col items-center space-y-2">
              <Button
                {...handleHoldToSpeak}
                className={`w-48 h-20 text-xl font-bold transition-all duration-300 ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 scale-110 shadow-2xl animate-pulse' 
                    : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-xl'
                }`}
                disabled={isListening && !isRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-8 h-8 mr-3" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 mr-3" />
                    Hold to Speak
                  </>
                )}
              </Button>
              
              {!isRecording && (
                <p className="text-center text-sm text-white/80 font-medium">
                  🎤 Press and hold to record your voice
                </p>
              )}
              
              {isRecording && (
                <p className="text-center text-sm text-yellow-300 animate-pulse font-bold">
                  🎤 Listening... Release to transcribe!
                </p>
              )}

              {isSpeaking && (
                <p className="text-center text-sm text-green-300 animate-pulse font-bold">
                  🔊 I'm speaking... 
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChat;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}