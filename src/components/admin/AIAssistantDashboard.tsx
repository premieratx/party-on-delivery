import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Play, Save, Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  id: string;
  name: string;
  description: string;
}

interface BranchingLogic {
  id: string;
  condition: string;
  nextQuestionId?: string;
  response?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'open' | 'choice' | 'yes_no';
  choices?: string[];
  branching: BranchingLogic[];
  clientTypes?: string[];
}

interface AssistantConfig {
  id?: string;
  name: string;
  voice: string;
  systemPrompt: string;
  questions: Question[];
  clientType: string;
}

export const AIAssistantDashboard = () => {
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [configs, setConfigs] = useState<AssistantConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<AssistantConfig>({
    name: '',
    voice: '',
    systemPrompt: 'You are a helpful party planning assistant.',
    questions: [],
    clientType: 'all'
  });
  const [testingMode, setTestingMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    loadVoices();
    loadConfigs();
    loadDefaultQuestions();
  }, []);

  const loadVoices = async () => {
    try {
      const { data } = await supabase.functions.invoke('ai-voice-assistant', {
        body: { action: 'get_voices' }
      });
      setVoices(data.voices);
    } catch (error) {
      toast({ title: 'Error loading voices', variant: 'destructive' });
    }
  };

  const loadConfigs = async () => {
    try {
      const { data } = await supabase.functions.invoke('ai-voice-assistant', {
        body: { action: 'get_configs' }
      });
      setConfigs(data.configs);
    } catch (error) {
      toast({ title: 'Error loading configurations', variant: 'destructive' });
    }
  };

  const loadDefaultQuestions = async () => {
    try {
      const { data } = await supabase.functions.invoke('ai-voice-assistant', {
        body: { action: 'get_default_questions' }
      });
      if (currentConfig.questions.length === 0) {
        setCurrentConfig(prev => ({ ...prev, questions: data.questions }));
      }
    } catch (error) {
      toast({ title: 'Error loading default questions', variant: 'destructive' });
    }
  };

  const saveConfig = async () => {
    if (!currentConfig.name || !currentConfig.voice) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const { data } = await supabase.functions.invoke('ai-voice-assistant', {
        body: {
          action: 'save_config',
          data: currentConfig
        }
      });
      
      toast({ title: 'Configuration saved successfully!' });
      loadConfigs();
    } catch (error) {
      toast({ title: 'Error saving configuration', variant: 'destructive' });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'open',
      branching: [],
      clientTypes: ['all']
    };
    
    setCurrentConfig(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setCurrentConfig(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addBranch = (questionId: string) => {
    const newBranch: BranchingLogic = {
      id: `b_${Date.now()}`,
      condition: '',
      nextQuestionId: ''
    };
    
    updateQuestion(questionId, {
      branching: [...currentConfig.questions.find(q => q.id === questionId)?.branching || [], newBranch]
    });
  };

  const testConversation = async () => {
    if (!testMessage.trim() || !currentConfig.id) return;

    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('ai-voice-assistant', {
        body: {
          action: 'test_conversation',
          data: {
            message: testMessage,
            configId: currentConfig.id,
            conversationHistory
          }
        }
      });

      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: testMessage },
        { role: 'assistant', content: data.message }
      ];
      
      setConversationHistory(newHistory);
      setTestMessage('');

      // Play audio response
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        setAudioPlaying(true);
        audio.onended = () => setAudioPlaying(false);
        audio.play();
      }

    } catch (error) {
      toast({ title: 'Error testing conversation', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Voice Assistant Dashboard</h1>
        <Button onClick={saveConfig} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="saved">Saved Configs</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    value={currentConfig.name}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Birthday Party Assistant"
                  />
                </div>

                <div>
                  <Label htmlFor="voice-select">Voice Character</Label>
                  <Select 
                    value={currentConfig.voice} 
                    onValueChange={(value) => setCurrentConfig(prev => ({ ...prev, voice: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an iconic voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <div className="font-semibold">{voice.name}</div>
                            <div className="text-sm text-muted-foreground">{voice.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="client-type">Client Type</Label>
                  <Select 
                    value={currentConfig.clientType} 
                    onValueChange={(value) => setCurrentConfig(prev => ({ ...prev, clientType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="premium">Premium Clients</SelectItem>
                      <SelectItem value="corporate">Corporate Events</SelectItem>
                      <SelectItem value="wedding">Wedding Planners</SelectItem>
                      <SelectItem value="casual">Casual Parties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={currentConfig.systemPrompt}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="Define the assistant's personality and behavior..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Conversation Questions
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {currentConfig.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Button 
                        onClick={() => removeQuestion(question.id)} 
                        size="sm" 
                        variant="ghost"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Input
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      placeholder="Enter question text..."
                    />
                    
                    <Select 
                      value={question.type} 
                      onValueChange={(value: any) => updateQuestion(question.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open Text</SelectItem>
                        <SelectItem value="choice">Multiple Choice</SelectItem>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>

                    {question.type === 'choice' && (
                      <div>
                        <Label>Choices (comma-separated)</Label>
                        <Input
                          value={question.choices?.join(', ') || ''}
                          onChange={(e) => updateQuestion(question.id, { 
                            choices: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">Branching Logic</Label>
                        <Button onClick={() => addBranch(question.id)} size="sm" variant="outline">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Branch
                        </Button>
                      </div>
                      {question.branching.map((branch, branchIndex) => (
                        <div key={branch.id} className="text-sm space-y-2 mb-2 p-2 bg-muted rounded">
                          <Input
                            value={branch.condition}
                            onChange={(e) => {
                              const updatedBranches = question.branching.map(b => 
                                b.id === branch.id ? { ...b, condition: e.target.value } : b
                              );
                              updateQuestion(question.id, { branching: updatedBranches });
                            }}
                            placeholder="If answer contains..."
                          />
                          <Input
                            value={branch.nextQuestionId || ''}
                            onChange={(e) => {
                              const updatedBranches = question.branching.map(b => 
                                b.id === branch.id ? { ...b, nextQuestionId: e.target.value } : b
                              );
                              updateQuestion(question.id, { branching: updatedBranches });
                            }}
                            placeholder="Next question ID (optional)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Your Assistant
                {audioPlaying && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Playing
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentConfig.id && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">Save your configuration first to enable testing.</p>
                </div>
              )}
              
              <div className="border rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-muted/30">
                {conversationHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center">Start a conversation to test your assistant...</p>
                ) : (
                  <div className="space-y-3">
                    {conversationHistory.map((msg, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground ml-12' 
                          : 'bg-background mr-12'
                      }`}>
                        <div className="font-semibold text-sm mb-1">
                          {msg.role === 'user' ? 'You' : currentConfig.voice || 'Assistant'}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type your message here..."
                  onKeyPress={(e) => e.key === 'Enter' && testConversation()}
                  disabled={!currentConfig.id || isLoading}
                />
                <Button 
                  onClick={testConversation} 
                  disabled={!currentConfig.id || isLoading || !testMessage.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
                <Button 
                  onClick={() => setConversationHistory([])} 
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map((config) => (
              <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{config.voice}</Badge>
                    <Badge variant="outline">{config.clientType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {config.questions.length} questions configured
                  </p>
                  <Button 
                    onClick={() => setCurrentConfig(config)}
                    className="w-full"
                    variant="outline"
                  >
                    Load Configuration
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};