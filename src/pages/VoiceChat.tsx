import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, ArrowLeft, MessageCircle, Sparkles, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI assistant configuration
  useEffect(() => {
    const loadAiConfig = async () => {
      try {
        // For now, use a default config since the table might not exist yet
        const defaultConfig = {
          id: 'default',
          name: 'Party Assistant',
          prompt: 'You are a helpful AI assistant for Party On Delivery.',
          voice_settings: { tone: 'friendly', voice: 'alloy' },
          is_active: true
        };
        
        setAiConfig(defaultConfig);
        // Start with intro, don't add welcome message yet
      } catch (error) {
        console.error('Error loading AI config:', error);
      }
    };

    loadAiConfig();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // If this is the first message, start the conversation
    if (!conversationStarted) {
      setConversationStarted(true);
      setShowIntro(false);
      
      // Add AI's energetic welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `🎉 HELL YEAH! Welcome to Party On Delivery! I'm absolutely pumped to help you throw the most EPIC party EVER! 

Let's get this party planning started! Tell me - what's the vibe you're going for? Is this a birthday bash, graduation celebration, weekend hangout, or just because life's awesome?

And hey, if you're not sure what drinks you want, just say "surprise me" or "put together a good list" and I'll hook you up with some fantastic suggestions based on your crowd and budget! 🍻🥳`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Enhanced AI responses with party planning logic
    setTimeout(() => {
      const responses = [
        "Awesome! That sounds like it's going to be AMAZING! Tell me more - how many people are we talking about? I want to make sure we get the perfect amount of drinks to keep everyone happy! 🎊",
        "Oh man, I LOVE that kind of party! Let me guess the vibe and you tell me if I'm right - are we talking cocktails and fancy drinks, or more beer and chill vibes? And what's your budget looking like?",
        "YES! Now we're cooking with gas! 🔥 Quick question - what type of drinks are you and your crew usually into? Beer? Wine? Cocktails? Or are you wanting me to just put together a killer mix of everything?",
        "Perfect! I'm already getting excited about this party! So tell me, what's your budget range and how many hours are we talking? That way I can calculate about 2 drinks per person per hour - my go-to formula for epic parties! 🍹",
        "I can already tell this is going to be legendary! Let me ask - do you want specific stuff or should I just surprise you with some crowd-pleasers? And don't forget to tell me when you need this delivered!"
      ];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const startConversation = () => {
    setShowIntro(false);
    setConversationStarted(true);
    
    // Add the energetic welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🎉 HELL YEAH! Welcome to Party On Delivery! I'm absolutely pumped to help you throw the most EPIC party EVER! 

Let's get this party planning started! Tell me - what's the vibe you're going for? Is this a birthday bash, graduation celebration, weekend hangout, or just because life's awesome?

And hey, if you're not sure what drinks you want, just say "surprise me" or "put together a good list" and I'll hook you up with some fantastic suggestions based on your crowd and budget! 🍻🥳`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputText(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsRecording(false);
      // Auto-send the transcribed message
      if (inputText.trim()) {
        handleSendMessage(inputText);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setIsRecording(false);
      toast({
        title: "Speech recognition error",
        description: event.error,
        variant: "destructive",
      });
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

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
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Party Assistant
          </h1>
          <p className="text-sm opacity-90">Let's plan your perfect party! 🎉</p>
        </div>
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
                  Hold the mic button to speak or type your messages
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
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
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
                  🎤 Listening... Release to send your message!
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