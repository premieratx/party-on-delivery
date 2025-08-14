import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, Save, Trash2, Play, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAgent {
  id?: string;
  name: string;
  voice: string;
  collections: string[];
  questions: string[];
  instructions: string;
  isActive: boolean;
}

const ICONIC_VOICES = [
  { id: 'alloy', name: 'Alloy - Neutral & Professional' },
  { id: 'echo', name: 'Echo - Warm & Friendly' },
  { id: 'fable', name: 'Fable - Expressive & Engaging' },
  { id: 'onyx', name: 'Onyx - Deep & Authoritative' },
  { id: 'nova', name: 'Nova - Bright & Energetic' },
  { id: 'shimmer', name: 'Shimmer - Soft & Calming' }
];

const DEFAULT_QUESTIONS = [
  "What's the occasion you're celebrating?",
  "How many people will be attending?",
  "What's your budget range for drinks?",
  "Do you have any favorite spirits or brands?",
  "Are there any dietary restrictions or preferences?"
];

export const VoiceAgentCreator: React.FC = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<VoiceAgent>>({
    name: '',
    voice: 'alloy',
    collections: [],
    questions: [...DEFAULT_QUESTIONS],
    instructions: 'You are a helpful AI assistant for Party On Delivery. Help customers find the perfect drinks for their occasion.',
    isActive: true
  });

  React.useEffect(() => {
    loadAgents();
    loadCollections();
  }, []);

  const loadAgents = async () => {
    try {
      // For now, use local storage until voice_agents table is created
      const storedAgents = localStorage.getItem('voice_agents');
      if (storedAgents) {
        setAgents(JSON.parse(storedAgents));
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      if (error) throw error;
      
      const collectionNames = data.collections?.map((c: any) => c.title) || [];
      setCollections(collectionNames);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter a name for the voice agent.",
          variant: "destructive"
        });
        return;
      }

      const agentData = {
        ...formData,
        questions: formData.questions?.filter(q => q.trim()) || [],
        collections: formData.collections || []
      };

      // For now, use local storage until voice_agents table is created
      const storedAgents = JSON.parse(localStorage.getItem('voice_agents') || '[]');
      
      if (editingAgent?.id) {
        const index = storedAgents.findIndex((a: any) => a.id === editingAgent.id);
        if (index >= 0) {
          storedAgents[index] = { ...agentData, id: editingAgent.id };
        }
      } else {
        const newAgent = { ...agentData, id: Date.now().toString() };
        storedAgents.push(newAgent);
      }
      
      localStorage.setItem('voice_agents', JSON.stringify(storedAgents));

      toast({
        title: "Success",
        description: `Voice agent ${editingAgent ? 'updated' : 'created'} successfully!`
      });

      resetForm();
      loadAgents();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast({
        title: "Error",
        description: "Failed to save voice agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (agentId: string) => {
    try {
      // For now, use local storage until voice_agents table is created
      const storedAgents = JSON.parse(localStorage.getItem('voice_agents') || '[]');
      const filtered = storedAgents.filter((a: any) => a.id !== agentId);
      localStorage.setItem('voice_agents', JSON.stringify(filtered));

      toast({
        title: "Deleted",
        description: "Voice agent deleted successfully."
      });

      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete voice agent.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      voice: 'alloy',
      collections: [],
      questions: [...DEFAULT_QUESTIONS],
      instructions: 'You are a helpful AI assistant for Party On Delivery. Help customers find the perfect drinks for their occasion.',
      isActive: true
    });
    setEditingAgent(null);
    setIsCreating(false);
  };

  const startEdit = (agent: VoiceAgent) => {
    setFormData(agent);
    setEditingAgent(agent);
    setIsCreating(true);
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), '']
    }));
  };

  const updateQuestion = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.map((q, i) => i === index ? value : q) || []
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleCollection = (collection: string) => {
    setFormData(prev => ({
      ...prev,
      collections: prev.collections?.includes(collection)
        ? prev.collections.filter(c => c !== collection)
        : [...(prev.collections || []), collection]
    }));
  };

  const testVoice = (voiceId: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! I\'m your Party On Delivery assistant. How can I help you today?');
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.toLowerCase().includes(voiceId));
      if (voice) utterance.voice = voice;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Voice Agent Creator</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Mic className="w-4 h-4 mr-2" />
          Create New Agent
        </Button>
      </div>

      {/* Creation/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingAgent ? 'Edit Voice Agent' : 'Create New Voice Agent'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Birthday Party Assistant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice">Voice</Label>
                <Select
                  value={formData.voice}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, voice: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONIC_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{voice.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              testVoice(voice.id);
                            }}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Collections</Label>
              <div className="flex flex-wrap gap-2">
                {collections.map((collection) => (
                  <Badge
                    key={collection}
                    variant={formData.collections?.includes(collection) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCollection(collection)}
                  >
                    {collection}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Questions Flow</Label>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  Add Question
                </Button>
              </div>
              <div className="space-y-2">
                {formData.questions?.map((question, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Enter question..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">AI Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Provide detailed instructions for how the AI should behave..."
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingAgent ? 'Update' : 'Create'} Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className={agent.isActive ? 'border-primary' : 'border-muted'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testVoice(agent.voice)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(agent)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agent.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Voice: </span>
                  <span className="text-sm">{ICONIC_VOICES.find(v => v.id === agent.voice)?.name || agent.voice}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Collections: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.collections.map((collection, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {collection}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Questions: </span>
                  <span className="text-sm text-muted-foreground">{agent.questions.length} questions</span>
                </div>
                <div>
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
