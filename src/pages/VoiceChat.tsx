import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, ArrowLeft, MessageCircle } from 'lucide-react';
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
        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hey there! I'm your Party On Delivery assistant. I'm here to help you find the perfect drinks and party supplies! What kind of event are you planning?`,
          timestamp: new Date()
        }]);
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response (replace with actual AI call)
    setTimeout(() => {
      const responses = [
        "That sounds like a great party! Let me help you find some perfect drinks for that.",
        "Cool! Based on what you're telling me, I'd recommend checking out our cocktail mixers and party supplies.",
        "Awesome! I can definitely help you with that. What's your guest count looking like?",
        "Hell yeah! Let me show you some fantastic options that would be perfect for your event."
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <MessageCircle className="w-6 h-6" />
        <div>
          <h1 className="text-lg font-semibold">Party Assistant</h1>
          <p className="text-sm opacity-90">Let's plan your perfect party!</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card'
            }`}>
              <CardContent className="p-3">
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 opacity-70`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4 space-y-3">
        {/* Text Input */}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message or hold the mic button to speak..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Hold to Speak Button */}
        <div className="flex justify-center">
          <Button
            {...handleHoldToSpeak}
            className={`w-32 h-16 text-lg font-semibold transition-all duration-200 ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 scale-110 shadow-lg' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            disabled={isListening && !isRecording}
          >
            {isRecording ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                Recording...
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                Hold to Speak
              </>
            )}
          </Button>
        </div>

        {isRecording && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            🎤 Listening... Release to send
          </p>
        )}
      </div>
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