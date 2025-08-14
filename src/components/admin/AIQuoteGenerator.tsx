import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Phone, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface AIRecommendation {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  totalEstimate: number;
  reasoning: string;
  eventType: string;
  guestCount: number;
}

interface AIQuoteGeneratorProps {
  onQuoteGenerated?: (quoteData: any) => void;
}

export const AIQuoteGenerator: React.FC<AIQuoteGeneratorProps> = ({ onQuoteGenerated }) => {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    eventLocation: ''
  });

  useEffect(() => {
    // Initialize conversation
    const initialMessage = {
      role: 'assistant' as const,
      content: "Hello! I'm here to help you plan the perfect party. Tell me about your event - what's the occasion, how many guests, and what kind of atmosphere are you going for?"
    };
    setConversation([initialMessage]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user' as const, content: userInput };
    setConversation(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: {
          message: userInput,
          conversation: conversation.map(msg => ({ role: msg.role, content: msg.content })),
          context: 'quote_generation'
        }
      });

      if (error) throw error;

      const aiResponse = { role: 'assistant' as const, content: data.reply };
      setConversation(prev => [...prev, aiResponse]);

      // Check if AI has generated a recommendation
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Voice input error",
        description: "There was an error with voice recognition. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const generateQuote = async () => {
    if (!recommendation || !customerInfo.name || !customerInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please provide customer information and complete the conversation first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const quoteData = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        eventType: recommendation.eventType,
        eventLocation: customerInfo.eventLocation,
        guestCount: recommendation.guestCount,
        items: recommendation.items,
        subtotal: recommendation.totalEstimate,
        deliveryFee: 25,
        salesTax: recommendation.totalEstimate * 0.0825,
        tipAmount: 0,
        totalAmount: recommendation.totalEstimate + 25 + (recommendation.totalEstimate * 0.0825),
        quoteNumber: `AI-${Date.now()}`,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `AI-generated recommendation: ${recommendation.reasoning}`,
        createdBy: 'ai_agent' as const
      };

      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteData }
      });

      if (error) throw error;

      toast({
        title: "Quote Generated",
        description: "AI-powered quote has been created successfully!",
      });

      if (onQuoteGenerated) {
        onQuoteGenerated(quoteData);
      }

    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Party Planning Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <Input
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Event Location</label>
              <Input
                value={customerInfo.eventLocation}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, eventLocation: e.target.value }))}
                placeholder="Event address or venue"
              />
            </div>
          </div>

          {/* Conversation */}
          <div className="space-y-4 mb-6">
            <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-white">
              {conversation.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="inline-block bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your event, guest count, preferences, budget, etc..."
                className="flex-1"
                rows={2}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleVoiceInput}
                  variant="outline"
                  size="icon"
                  className={isListening ? 'bg-red-100 border-red-300' : ''}
                  disabled={isLoading}
                >
                  {isListening ? <Mic className="w-4 h-4 text-red-600" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          {recommendation && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">AI Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Event Details:</h4>
                    <p><strong>Type:</strong> {recommendation.eventType}</p>
                    <p><strong>Guests:</strong> {recommendation.guestCount}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Items:</h4>
                    <ul className="space-y-1">
                      {recommendation.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.title} × {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Estimated Total:</span>
                        <span>${recommendation.totalEstimate.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Reasoning:</h4>
                    <p className="text-sm">{recommendation.reasoning}</p>
                  </div>

                  <Button 
                    onClick={generateQuote}
                    className="w-full"
                    disabled={!customerInfo.name || !customerInfo.email}
                  >
                    Generate Professional Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};