import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import discoBall from '@/assets/disco-ball.gif';
import { supabase } from '@/integrations/supabase/client';

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
  { id: 'alloy', name: 'Alloy - Neutral & Professional' },
  { id: 'echo', name: 'Echo - Warm & Friendly' },
  { id: 'fable', name: 'Fable - Expressive & Engaging' },
  { id: 'onyx', name: 'Onyx - Deep & Authoritative' },
  { id: 'nova', name: 'Nova - Bright & Energetic' },
  { id: 'shimmer', name: 'Shimmer - Soft & Calming' }
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

  const startRecording = async () => {
    if (!currentAgent) {
      toast.error('Please select an agent profile first');
      return;
    }

    try {
      setIsRecording(true);
      // Here you would implement actual recording logic
      toast.success('Started recording...');
      
      // Simulate recording for demo
      setTimeout(() => {
        setIsRecording(false);
        processVoiceInput("I want to plan a birthday party for 20 people");
      }, 3000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success('Recording stopped');
  };

  const processVoiceInput = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // For demo, simulate AI response
    const responses = [
      "That sounds like an amazing party! How many people are you expecting?",
      "Great! What's your budget range for drinks?",
      "I love helping with parties! What kind of drinks do you usually enjoy?",
      "Let me help you plan the perfect drink selection. What's the occasion?",
      "Wonderful! Tell me more about your event - is it indoors or outdoors?"
    ];

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Convert to speech (simulate for demo)
      speakText(assistantMessage.content);
    }, 1000);
  };

  const speakText = async (text: string) => {
    if (!currentAgent) return;

    try {
      setIsPlaying(true);
      
      // For demo, just simulate speech duration
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
      
      toast.success('AI is speaking...');
    } catch (error) {
      console.error('Error converting text to speech:', error);
      setIsPlaying(false);
      toast.error('Failed to generate speech');
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
          {/* Agent Selection */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Choose Your Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedProfiles.length > 0 && (
                <div className="space-y-2 mb-4">
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
                {messages.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    Press and hold the disco ball to start talking!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500/30 ml-8'
                          : 'bg-purple-500/30 mr-8'
                      }`}
                    >
                      <div className="text-white">{message.content}</div>
                      <div className="text-xs text-white/60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Disco Ball Control */}
              <div className="text-center">
                <Button
                  size="lg"
                  className={`w-32 h-32 rounded-full p-2 transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 scale-110' 
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
                      className={`w-16 h-16 mb-2 ${isRecording ? '' : 'animate-spin'}`}
                      style={{ 
                        animationDuration: isRecording ? '0s' : '2s',
                        filter: 'brightness(1.2) drop-shadow(0 0 12px rgba(255,255,255,0.8))'
                      }}
                    />
                    <span className="text-xs font-bold text-white">
                      {isRecording ? 'Recording...' : 'Hold to Speak'}
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