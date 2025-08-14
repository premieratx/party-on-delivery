import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import discoBall from '@/assets/disco-ball.gif';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedVoiceRecorder, audioToBase64 } from '@/utils/voiceRecording';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentProfile {
  id: string;
  name: string;
  voice: string;
  tone: string;
  description: string;
  instructions: string;
}

const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy - Neutral & Professional', description: 'Clear, professional tone' },
  { id: 'echo', name: 'Echo - Warm & Friendly', description: 'Warm, approachable voice' },
  { id: 'fable', name: 'Fable - Expressive & Engaging', description: 'Expressive storytelling voice' },
  { id: 'onyx', name: 'Onyx - Deep & Authoritative', description: 'Deep, confident tone' },
  { id: 'nova', name: 'Nova - Bright & Energetic', description: 'Bright, enthusiastic voice' },
  { id: 'shimmer', name: 'Shimmer - Soft & Calming', description: 'Gentle, soothing tone' }
];

const TONE_PRESETS = [
  { id: 'enthusiastic', name: 'Enthusiastic Party Planner', description: 'High energy, fun, exciting' },
  { id: 'professional', name: 'Professional Event Coordinator', description: 'Organized, detailed, helpful' },
  { id: 'casual', name: 'Casual Friend Helper', description: 'Relaxed, friendly, approachable' },
  { id: 'luxury', name: 'Luxury Event Specialist', description: 'Sophisticated, premium, elegant' }
];

export default function PartyPlanningAgent() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AgentProfile | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<AgentProfile[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    voice: 'nova',
    tone: 'enthusiastic',
    description: '',
    instructions: ''
  });
  const [conversation, setConversation] = useState({
    occasion: '',
    guestCount: 0,
    preferences: [],
    budget: '',
    eventDate: '',
    additionalInfo: ''
  });
  const [questionCount, setQuestionCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [voiceRecorder, setVoiceRecorder] = useState<EnhancedVoiceRecorder | null>(null);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved profiles on mount
  useEffect(() => {
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = () => {
    try {
      const saved = localStorage.getItem('party_planning_agents');
      if (saved) {
        const profiles = JSON.parse(saved);
        setSavedProfiles(profiles);
        
        // Set first profile as current if available
        if (profiles.length > 0) {
          setCurrentAgent(profiles[0]);
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const saveProfile = () => {
    if (!newProfile.name.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    try {
      const profile: AgentProfile = {
        id: Date.now().toString(),
        name: newProfile.name,
        voice: newProfile.voice,
        tone: newProfile.tone,
        description: newProfile.description,
        instructions: newProfile.instructions || getDefaultInstructions(newProfile.tone)
      };

      const updatedProfiles = [profile, ...savedProfiles];
      setSavedProfiles(updatedProfiles);
      setCurrentAgent(profile);
      setIsCreatingProfile(false);
      setNewProfile({ name: '', voice: 'nova', tone: 'enthusiastic', description: '', instructions: '' });
      
      // Save to localStorage
      localStorage.setItem('party_planning_agents', JSON.stringify(updatedProfiles));
      
      toast.success('Agent profile saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const getDefaultInstructions = (tone: string) => {
    const baseInstructions = `You are a ${TONE_PRESETS.find(t => t.id === tone)?.name || 'Party Planning'} AI assistant. Help users plan amazing parties and events. Ask about their occasion, guest count, budget, drink preferences, and delivery date. Keep responses fun and engaging while gathering the information needed to suggest the perfect drink selection.`;
    
    return baseInstructions;
  };

  // Initialize voice recorder
  useEffect(() => {
    const recorder = new EnhancedVoiceRecorder(
      async (audioBlob) => {
        console.log('Voice recording completed, processing...');
        try {
          // Convert audio to base64 and send to transcription
          const base64Audio = await audioToBase64(audioBlob);
          const { data: transcriptionResult } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });
          
          if (transcriptionResult?.text) {
            console.log('Transcription result:', transcriptionResult.text);
            await processVoiceInput(transcriptionResult.text);
          } else {
            toast.error('Could not understand speech. Please try again.');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Voice processing failed. Please try again.');
        }
        setIsRecording(false);
        setIsSpeechDetected(false);
      },
      (error) => {
        console.error('Recording error:', error);
        toast.error('Recording failed: ' + error.message);
        setIsRecording(false);
        setIsSpeechDetected(false);
      },
      () => {
        console.log('Speech started');
        setIsSpeechDetected(true);
      },
      () => {
        console.log('Speech ended');
        setIsSpeechDetected(false);
      }
    );
    
    setVoiceRecorder(recorder);
    
    return () => {
      recorder.stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (!currentAgent) {
      toast.error('Please select an agent profile first');
      return;
    }

    if (!voiceRecorder) {
      toast.error('Voice recorder not initialized');
      return;
    }

    try {
      setIsRecording(true);
      setIsSpeechDetected(false);
      toast.success('Listening... Start speaking!');
      await voiceRecorder.startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording: ' + (error as Error).message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (voiceRecorder) {
      voiceRecorder.stopRecording();
    }
  };

  const processVoiceInput = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestionCount(prev => prev + 1);

    try {
      // Call the AI chat assistant with conversation context
      const { data: aiResponse } = await supabase.functions.invoke('ai-chat-assistant', {
        body: {
          message: text,
          conversation,
          questionCount,
          adminMode,
          context: {
            agentTone: currentAgent?.tone || 'enthusiastic',
            agentInstructions: currentAgent?.instructions || ''
          }
        }
      });

      if (aiResponse?.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update conversation state with extracted information
        if (aiResponse.updatedConversation) {
          setConversation(aiResponse.updatedConversation);
        }
        
        // Handle admin mode activation
        if (aiResponse.adminMode) {
          setAdminMode(true);
        }
        
        // Convert to speech with selected voice
        await speakText(assistantMessage.content);

        // Check if we have enough info to generate suggestions (improved logic)
        const updatedConv = aiResponse.updatedConversation || conversation;
        const hasOccasion = updatedConv.occasion && updatedConv.occasion !== '';
        const hasGuestCount = updatedConv.guestCount && updatedConv.guestCount > 0;
        const hasPreferences = updatedConv.preferences && updatedConv.preferences.length > 0;
        const hasBudget = updatedConv.budget && updatedConv.budget !== '';

        // Generate suggestions if we have at least 3 of the 4 key pieces of info
        const infoCount = [hasOccasion, hasGuestCount, hasPreferences, hasBudget].filter(Boolean).length;
        const shouldGenerateSuggestions = infoCount >= 3 && !isGeneratingSuggestions && suggestions.length === 0;

        if (shouldGenerateSuggestions && !adminMode) {
          console.log('Auto-generating suggestions with info:', { hasOccasion, hasGuestCount, hasPreferences, hasBudget });
          setTimeout(() => generateSuggestions(updatedConv), 1500);
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble processing that. Could you tell me more about your party plans?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
    }
  };

  const generateSuggestions = async (conversationData: any) => {
    if (isGeneratingSuggestions) return; // Prevent duplicate calls
    
    try {
      setIsGeneratingSuggestions(true);
      console.log('Generating party suggestions with data:', conversationData);
      
      const { data: suggestionsData } = await supabase.functions.invoke('generate-party-suggestions', {
        body: {
          conversation: conversationData,
          maxSuggestions: 8
        }
      });

      if (suggestionsData?.suggestions) {
        setSuggestions(suggestionsData.suggestions);
        
        const suggestionMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Perfect! I've found some amazing recommendations for your ${conversationData.occasion} with ${conversationData.guestCount} people. Check out these suggestions below - you can adjust quantities and add them directly to your cart!`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, suggestionMessage]);
        await speakText(suggestionMessage.content);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const speakText = async (text: string) => {
    if (!text || text.trim() === '') return;

    try {
      setIsPlaying(true);
      console.log('Converting text to speech with voice:', selectedVoice);
      
      // Call our text-to-speech edge function
      const { data: speechData } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          voice: selectedVoice
        }
      });

      if (speechData?.audioContent) {
        // Create audio element and play
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        const audioBlob = new Blob([
          new Uint8Array(
            atob(speechData.audioContent)
              .split('')
              .map(c => c.charCodeAt(0))
          )
        ], { type: 'audio/mp3' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.onerror = (error) => {
          console.error('Audio playback error:', error);
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audioRef.current.play();
        console.log('Audio playback started successfully');
      } else {
        console.error('No audio content received');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      setIsPlaying(false);
      toast.error('Voice synthesis failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-pulse">
            <PartyPopper className="inline-block w-12 h-12 mr-4" />
            Let's Plan Your Party!
            <PartyPopper className="inline-block w-12 h-12 ml-4" />
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Your AI party planning assistant is ready to help create the perfect event
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent & Voice Selection */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Voice Selection */}
              <div className="mb-4">
                <label className="text-white text-sm font-medium mb-2 block">
                  Choose AI Voice
                </label>
                <select
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {AVAILABLE_VOICES.map(voice => (
                    <option key={voice.id} value={voice.id} className="text-black bg-white">
                      {voice.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-white/60 mt-1">
                  {AVAILABLE_VOICES.find(v => v.id === selectedVoice)?.description}
                </div>
                
                {/* Voice Test Button */}
                <Button
                  onClick={() => speakText("Hi! I'm your party planning assistant. How does my voice sound?")}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={isPlaying}
                >
                  {isPlaying ? 'Testing...' : 'Test Voice'}
                </Button>
              </div>

              {/* Agent Profiles */}
              {savedProfiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Agent Profiles
                  </label>
                  {savedProfiles.map((profile) => (
                    <Button
                      key={profile.id}
                      variant={currentAgent?.id === profile.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setCurrentAgent(profile)}
                    >
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs opacity-70">
                          {AVAILABLE_VOICES.find(v => v.id === profile.voice)?.name}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setIsCreatingProfile(true)}
                variant="secondary"
                className="w-full"
              >
                Create New Agent
              </Button>

              {isCreatingProfile && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Agent name"
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/60"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                  
                  <select
                    className="w-full p-2 rounded bg-white/20 text-white"
                    value={newProfile.voice}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, voice: e.target.value }))}
                  >
                    {AVAILABLE_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id} className="text-black">
                        {voice.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full p-2 rounded bg-white/20 text-white"
                    value={newProfile.tone}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, tone: e.target.value }))}
                  >
                    {TONE_PRESETS.map(tone => (
                      <option key={tone.id} value={tone.id} className="text-black">
                        {tone.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <Button onClick={saveProfile} size="sm">Save</Button>
                    <Button 
                      onClick={() => setIsCreatingProfile(false)} 
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Chat Interface */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {currentAgent ? `Chatting with ${currentAgent.name}` : 'Select an Agent to Start'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat messages */}
              <div className="h-64 overflow-y-auto mb-6 space-y-3">
                {adminMode && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="text-red-200 text-sm font-medium">🔒 ADMIN MODE ACTIVE</div>
                    <div className="text-red-100 text-xs">You can now query training data and product knowledge</div>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    {adminMode ? 
                      'Ask me about my training data, product knowledge, or how to improve responses!' :
                      'Press and hold the disco ball to start talking!'
                    }
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500/30 ml-8'
                          : adminMode ? 'bg-red-500/30 mr-8' : 'bg-purple-500/30 mr-8'
                      }`}
                    >
                      <div className="text-white whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs text-white/60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Text Input for Admin Mode or General Use */}
              {(adminMode || true) && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      ref={textInputRef}
                      type="text"
                      placeholder={adminMode ? "Type your question about training data..." : "Type your message or use voice..."}
                      className="flex-1 p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && textInput.trim()) {
                          processVoiceInput(textInput);
                          setTextInput('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (textInput.trim()) {
                          processVoiceInput(textInput);
                          setTextInput('');
                        }
                      }}
                      disabled={!textInput.trim()}
                      className={adminMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                    >
                      Send
                    </Button>
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    💡 Tip: Press Enter to send your message
                  </div>
                </div>
              )}

              {/* Voice Status Indicator */}
              {isRecording && (
                <div className="mb-4 text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    isSpeechDetected ? 'bg-green-500/30' : 'bg-yellow-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isSpeechDetected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
                    }`}></div>
                    <span className="text-white text-sm">
                      {isSpeechDetected ? '🗣️ Speaking detected...' : '👂 Listening...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Disco Ball Control */}
              <div className="text-center">
                <Button
                  size="lg"
                  className={`w-32 h-32 rounded-full p-2 transition-all duration-200 ${
                    isRecording 
                      ? isSpeechDetected
                        ? 'bg-green-500 hover:bg-green-600 scale-110 animate-pulse' 
                        : 'bg-yellow-500 hover:bg-yellow-600 scale-110'
                      : adminMode
                      ? 'bg-gradient-to-br from-red-600 to-red-500 hover:scale-105'
                      : 'bg-gradient-to-br from-gold to-yellow-500 hover:scale-105'
                  }`}
                  onMouseDown={!isRecording ? startRecording : undefined}
                  onMouseUp={isRecording ? stopRecording : undefined}
                  onTouchStart={!isRecording ? startRecording : undefined}
                  onTouchEnd={isRecording ? stopRecording : undefined}
                  disabled={!currentAgent}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <img 
                      src={discoBall} 
                      alt="Disco Ball" 
                      className={`w-16 h-16 mb-2 ${isRecording ? (isSpeechDetected ? 'animate-spin' : '') : 'animate-spin'}`}
                      style={{ 
                        animationDuration: isRecording ? (isSpeechDetected ? '1s' : '0s') : '2s',
                        filter: adminMode 
                          ? 'brightness(1.2) drop-shadow(0 0 12px rgba(255,0,0,0.8))'
                          : isRecording
                          ? isSpeechDetected
                            ? 'brightness(1.2) drop-shadow(0 0 12px rgba(0,255,0,0.8))'
                            : 'brightness(1.2) drop-shadow(0 0 12px rgba(255,255,0,0.8))'
                          : 'brightness(1.2) drop-shadow(0 0 12px rgba(255,255,255,0.8))'
                      }}
                    />
                    <span className="text-xs font-bold text-white">
                      {isRecording 
                        ? isSpeechDetected 
                          ? 'Speaking!' 
                          : 'Listening...'
                        : adminMode 
                        ? 'Admin Mode' 
                        : 'Hold to Speak'
                      }
                    </span>
                  </div>
                </Button>

                {isPlaying && (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-green-500/30 px-4 py-2 rounded-full">
                      <Volume2 className="w-4 h-4 text-white animate-pulse" />
                      <span className="text-white">AI is speaking...</span>
                    </div>
                  </div>
                )}
              </div>

              {!currentAgent && (
                <div className="text-center text-white/60 mt-4">
                  Create or select an agent profile to start planning your party!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🎉 Party Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="bg-white/10 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <img 
                          src={suggestion.image || '/placeholder.svg'} 
                          alt={suggestion.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{suggestion.title}</h4>
                          <p className="text-white/60 text-xs mt-1">{suggestion.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-green-400 font-bold">${suggestion.price}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-xs">Qty: {suggestion.recommendedQuantity}</span>
                              <Button size="sm" className="h-6 px-2 text-xs">
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                  <p className="text-white text-center">
                    <span className="font-bold">Estimated Total: ${suggestions.reduce((sum: number, item: any) => sum + parseFloat(item.estimatedTotal || 0), 0).toFixed(2)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Tips */}
        <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <h3 className="text-white font-bold mb-2">🎉 Tips for the best party planning experience:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/80 text-sm">
              <div>• Tell me about your occasion and guest count</div>
              <div>• Share your budget range for drinks</div>
              <div>• Mention any favorite spirits or brands</div>
              <div>• Let me know about dietary restrictions</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  .animate-blob {
    animation: blob 7s infinite;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);