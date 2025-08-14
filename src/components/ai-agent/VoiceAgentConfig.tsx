import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Volume2, Save, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceConfig {
  id?: string;
  name: string;
  voice: string;
  model: string;
  systemPrompt: string;
  greeting: string;
  isDefault: boolean;
}

const AVAILABLE_VOICES = [
  { id: 'aria', name: 'Aria', description: 'Warm and professional' },
  { id: 'sarah', name: 'Sarah', description: 'Friendly and approachable' },
  { id: 'laura', name: 'Laura', description: 'Sophisticated and clear' },
  { id: 'charlotte', name: 'Charlotte', description: 'Energetic and vibrant' },
  { id: 'alice', name: 'Alice', description: 'Calm and reassuring' },
  { id: 'jessica', name: 'Jessica', description: 'Bright and engaging' },
  { id: 'charlie', name: 'Charlie', description: 'Confident and authoritative' },
  { id: 'george', name: 'George', description: 'Deep and trustworthy' },
  { id: 'brian', name: 'Brian', description: 'Professional and reliable' },
  { id: 'daniel', name: 'Daniel', description: 'Smooth and articulate' }
];

const TTS_MODELS = [
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2 (Recommended)', description: 'High quality, emotional' },
  { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5', description: 'Fast, multilingual' },
  { id: 'eleven_turbo_v2', name: 'Turbo v2', description: 'Fast, English only' }
];

interface VoiceAgentConfigProps {
  onConfigSaved?: (config: VoiceConfig) => void;
  editingConfig?: VoiceConfig | null;
}

export const VoiceAgentConfig: React.FC<VoiceAgentConfigProps> = ({ 
  onConfigSaved,
  editingConfig 
}) => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<VoiceConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<VoiceConfig>({
    name: '',
    voice: 'aria',
    model: 'eleven_multilingual_v2',
    systemPrompt: 'You are a helpful party planning assistant. Help customers find the perfect drinks and supplies for their events. Be friendly, knowledgeable, and enthusiastic about creating memorable celebrations.',
    greeting: "Hi! I'm here to help you plan the perfect party. Tell me about your event and I'll suggest some amazing options!",
    isDefault: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (editingConfig) {
      setCurrentConfig(editingConfig);
    }
  }, [editingConfig]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assistant_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: "Error",
        description: "Failed to load voice agent configurations",
        variant: "destructive"
      });
    }
  };

  const testVoice = async () => {
    if (!currentConfig.greeting) {
      toast({
        title: "No greeting text",
        description: "Please enter a greeting message to test the voice.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: currentConfig.greeting,
          voice: currentConfig.voice,
          model: currentConfig.model
        }
      });

      if (error) throw error;

      // Play the audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audio.play();

      toast({
        title: "Voice Test",
        description: `Playing greeting with ${currentConfig.voice} voice`,
      });
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed",
        description: error.message || "Failed to generate voice sample",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!currentConfig.name || !currentConfig.greeting) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the agent name and greeting message.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const configData = {
        ...currentConfig,
        updated_at: new Date().toISOString()
      };

      let result;
      if (currentConfig.id) {
        // Update existing config
        const { data, error } = await supabase
          .from('ai_assistant_configs')
          .update(configData)
          .eq('id', currentConfig.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new config
        const { data, error } = await supabase
          .from('ai_assistant_configs')
          .insert(configData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // If this is set as default, update others
      if (currentConfig.isDefault) {
        await supabase
          .from('ai_assistant_configs')
          .update({ is_default: false })
          .neq('id', result.id);
      }

      toast({
        title: "Configuration Saved",
        description: `Voice agent "${currentConfig.name}" has been saved successfully.`,
      });

      onConfigSaved?.(result);
      loadConfigs();

      // Reset form if creating new
      if (!editingConfig) {
        setCurrentConfig({
          name: '',
          voice: 'aria',
          model: 'eleven_multilingual_v2',
          systemPrompt: currentConfig.systemPrompt,
          greeting: '',
          isDefault: false
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setAsDefault = async (configId: string) => {
    try {
      // Set all to not default
      await supabase
        .from('ai_assistant_configs')
        .update({ is_default: false });

      // Set this one as default
      await supabase
        .from('ai_assistant_configs')
        .update({ is_default: true })
        .eq('id', configId);

      toast({
        title: "Default Updated",
        description: "Default voice agent has been updated.",
      });

      loadConfigs();
    } catch (error) {
      console.error('Default update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update default configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingConfig ? 'Edit Voice Agent' : 'Create Voice Agent Configuration'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={currentConfig.name}
                onChange={(e) => setCurrentConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Party Assistant Pro"
              />
            </div>

            <div>
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                value={currentConfig.voice}
                onValueChange={(value) => setCurrentConfig(prev => ({ ...prev, voice: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model-select">TTS Model</Label>
              <Select
                value={currentConfig.model}
                onValueChange={(value) => setCurrentConfig(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {TTS_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-default"
                checked={currentConfig.isDefault}
                onChange={(e) => setCurrentConfig(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is-default">Set as default agent</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="greeting">Greeting Message</Label>
            <Textarea
              id="greeting"
              value={currentConfig.greeting}
              onChange={(e) => setCurrentConfig(prev => ({ ...prev, greeting: e.target.value }))}
              placeholder="Enter the initial greeting message..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={currentConfig.systemPrompt}
              onChange={(e) => setCurrentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="Enter the system prompt that defines the agent's behavior..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testVoice} variant="outline" disabled={isTesting}>
              {isTesting ? (
                <>Testing...</>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Voice
                </>
              )}
            </Button>
            <Button onClick={saveConfig} disabled={isLoading}>
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Configurations */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Voice Agent Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{config.name}</h4>
                      {config.is_default && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Voice: {AVAILABLE_VOICES.find(v => v.id === config.voice)?.name || config.voice} • 
                      Model: {TTS_MODELS.find(m => m.id === config.model)?.name || config.model}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!config.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(config.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCurrentConfig(config)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
