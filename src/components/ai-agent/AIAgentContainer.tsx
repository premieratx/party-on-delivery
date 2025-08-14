import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, X, ShoppingCart } from 'lucide-react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface AIAgentContainerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any) => void;
}

interface ConversationState {
  occasion?: string;
  guestCount?: number;
  preferences?: string[];
  budget?: string;
  eventDate?: string;
  additionalInfo?: string;
}

export const AIAgentContainer: React.FC<AIAgentContainerProps> = ({
  isOpen,
  onClose,
  onAddToCart
}) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<ConversationState>({});
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', content: string}>>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserInput(transcript);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Please try speaking again.",
          variant: "destructive"
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Start conversation when opened
    if (isOpen && messages.length === 0) {
      initializeAgent();
    }
  }, [isOpen]);

  const [agentConfig, setAgentConfig] = useState<any>(null);

  const initializeAgent = async () => {
    try {
      // Load default agent configuration
      const { data, error } = await supabase
        .from('ai_assistant_configs')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error || !data) {
        // Fallback to basic configuration
        const defaultConfig = {
          name: 'Party Assistant',
          voice: 'aria',
          model: 'eleven_multilingual_v2',
          systemPrompt: 'You are a helpful party planning assistant.',
          greeting: "Hi! I'm here to help you find the perfect drinks for your occasion. Tell me about your event!",
          isDefault: true
        };
        setAgentConfig(defaultConfig);
        setMessages([{ type: 'ai', content: defaultConfig.greeting }]);
        speakMessageWithVoice(defaultConfig.greeting, defaultConfig.voice, defaultConfig.model);
      } else {
        setAgentConfig(data);
        setMessages([{ type: 'ai', content: data.greeting }]);
        speakMessageWithVoice(data.greeting, data.voice, data.model);
      }
    } catch (error) {
      console.error('Error initializing agent:', error);
      // Fallback
      const welcomeMessage = "Hi! I'm here to help you find the perfect drinks for your occasion. Tell me about your event!";
      setMessages([{ type: 'ai', content: welcomeMessage }]);
      speakMessage(welcomeMessage);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Please type your response instead.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakMessage = (text: string) => {
    if (agentConfig?.voice && agentConfig?.model) {
      speakMessageWithVoice(text, agentConfig.voice, agentConfig.model);
    } else {
      // Fallback to browser speech synthesis
      if (synthRef.current) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
      }
    }
  };

  const speakMessageWithVoice = async (text: string, voice: string, model: string) => {
    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          voice: voice,
          model: model
        }
      });

      if (error) throw error;

      // Play the audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      // Fallback to browser speech synthesis
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
      }
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleUserInput = async (input: string) => {
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    
    // Process the input with AI
    const response = await processWithAI(input);
    setMessages(prev => [...prev, { type: 'ai', content: response }]);
    speakMessage(response);
    
    setQuestionCount(prev => prev + 1);
    
    // Check if we have enough info to generate suggestions
    if (questionCount >= 4 || hasEnoughInfo()) {
      generateSuggestions();
    }
  };

  const processWithAI = async (input: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: {
          message: input,
          conversation,
          questionCount,
          context: 'party_planning',
          systemPrompt: agentConfig?.systemPrompt || 'You are a helpful party planning assistant.',
          agentConfig: agentConfig
        }
      });

      if (error) throw error;

      // Update conversation state based on AI response
      if (data.updatedConversation) {
        setConversation(data.updatedConversation);
      }

      return data.response || "I'm sorry, I didn't catch that. Could you please repeat?";
    } catch (error) {
      console.error('AI processing error:', error);
      return "I'm having trouble understanding. Could you try rephrasing that?";
    }
  };

  const hasEnoughInfo = (): boolean => {
    return !!(conversation.occasion && conversation.guestCount && conversation.budget);
  };

  const generateSuggestions = async () => {
    setIsGeneratingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-party-suggestions', {
        body: {
          conversation,
          maxSuggestions: 8
        }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
      
      const suggestionMessage = `Based on your ${conversation.occasion} for ${conversation.guestCount} people, I've found some great options for you! Take a look at these suggestions.`;
      setMessages(prev => [...prev, { type: 'ai', content: suggestionMessage }]);
      speakMessage(suggestionMessage);

      // Generate formal quote and redirect
      setTimeout(() => {
        generateFormalQuote(data.suggestions);
      }, 2000);
      
    } catch (error) {
      console.error('Suggestion generation error:', error);
      toast({
        title: "Error Generating Suggestions",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const generateFormalQuote = (suggestions: any[]) => {
    const quoteData = {
      quoteNumber: `AI-${Date.now()}`,
      customerName: "AI Suggested Customer",
      customerEmail: "customer@example.com",
      customerPhone: "",
      eventType: conversation.occasion || "Party",
      guestCount: conversation.guestCount,
      items: suggestions.map((item, index) => ({
        id: item.id || `ai-${index}`,
        title: item.title,
        price: parseFloat(item.price) || 0,
        quantity: item.recommendedQuantity || 1,
        category: item.category || "Beverages",
        image: item.image,
        variant: item.variant
      })),
      subtotal: suggestions.reduce((total, item) => total + (parseFloat(item.price) || 0) * (item.recommendedQuantity || 1), 0),
      deliveryFee: 25,
      salesTax: 0,
      totalAmount: 0,
      notes: `AI-generated recommendations for ${conversation.occasion} with ${conversation.guestCount} guests.`,
      companyInfo: {
        name: "Party On Delivery",
        address: "Austin, TX",
        phone: "(512) 555-0123",
        email: "hello@partyondelivery.com"
      }
    };

    // Navigate to formal quote view
    const params = new URLSearchParams({
      quote: JSON.stringify(quoteData)
    });
    window.open(`/formal-quote?${params.toString()}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI Party Assistant
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex gap-4 overflow-hidden">
          {/* Conversation Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isGeneratingQuote && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="animate-pulse">Generating suggestions...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-2 p-4 border-t">
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
              >
                {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isListening ? "Stop Listening" : "Start Speaking"}
              </Button>
              
              <Button
                onClick={isSpeaking ? stopSpeaking : () => {}}
                variant="outline"
                disabled={!isSpeaking}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              {isListening && (
                <Badge variant="secondary" className="animate-pulse">
                  Listening...
                </Badge>
              )}
            </div>
          </div>

          {/* Suggestions Panel */}
          {suggestions.length > 0 && (
            <div className="w-1/3 border-l pl-4">
              <h3 className="font-medium mb-4">Suggested Products</h3>
              <div className="space-y-3 overflow-y-auto">
                {suggestions.map((product, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{product.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">${product.price}</span>
                        <Button
                          size="sm"
                          onClick={() => onAddToCart?.(product)}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};