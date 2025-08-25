import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, Volume2, MessageSquare, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SpeechModeManager = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    enabled: true,
    buttonText: "Just Say It",
    buttonColor: "#8B5CF6",
    buttonSize: "large",
    position: "bottom-right",
    showOnPages: ["all"],
    aiInstructions: "You are a helpful AI assistant for Party On Delivery. Help customers find the perfect drinks and party supplies based on their occasion, guest count, budget, and preferences. Ask clarifying questions when needed.",
    welcomeMessage: "Hi! I'm here to help you find the perfect drinks for your occasion. Tell me about your event!",
    maxQuestions: 5,
    urgencyThreshold: 3 // days
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    try {
      // Save speech mode configuration locally for now
      localStorage.setItem('speech_mode_config', JSON.stringify(config));

      toast({
        title: "Configuration Saved",
        description: "Speech Mode settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save speech mode settings.",
        variant: "destructive"
      });
    }
  };

  const testSpeechMode = () => {
    toast({
      title: "Test Mode Activated",
      description: "Speech mode button is now visible on delivery apps for testing.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Speech Mode Configuration</h1>
            <p className="text-muted-foreground">Configure the AI-powered speech assistant for your delivery apps</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={testSpeechMode} variant="outline">
            <Volume2 className="w-4 h-4 mr-2" />
            Test Mode
          </Button>
          <Button onClick={saveConfig}>
            Save Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="ai-training">AI Training</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={config.buttonText}
                    onChange={(e) => handleConfigChange('buttonText', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="buttonColor">Button Color</Label>
                  <Input
                    id="buttonColor"
                    type="color"
                    value={config.buttonColor}
                    onChange={(e) => handleConfigChange('buttonColor', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buttonSize">Button Size</Label>
                  <select
                    id="buttonSize"
                    value={config.buttonSize}
                    onChange={(e) => handleConfigChange('buttonSize', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <select
                    id="position"
                    value={config.position}
                    onChange={(e) => handleConfigChange('position', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center-right">Center Right</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
                <Label htmlFor="enabled">Enable Speech Mode</Label>
              </div>
              
              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxQuestions">Max Questions Before Suggestions</Label>
                  <Input
                    id="maxQuestions"
                    type="number"
                    value={config.maxQuestions}
                    onChange={(e) => handleConfigChange('maxQuestions', parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="urgencyThreshold">Urgency Threshold (days)</Label>
                  <Input
                    id="urgencyThreshold"
                    type="number"
                    value={config.urgencyThreshold}
                    onChange={(e) => handleConfigChange('urgencyThreshold', parseInt(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Instructions & Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiInstructions">System Instructions</Label>
                <Textarea
                  id="aiInstructions"
                  value={config.aiInstructions}
                  onChange={(e) => handleConfigChange('aiInstructions', e.target.value)}
                  rows={6}
                  placeholder="Provide detailed instructions for how the AI should behave..."
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Questions the AI will ask:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• What's the occasion for your event?</li>
                  <li>• How many people will be attending?</li>
                  <li>• What types of drinks do you prefer?</li>
                  <li>• What's your budget range?</li>
                  <li>• When is your event? (to determine urgency)</li>
                  <li>• Do you need any specific brands or products?</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-lg border relative min-h-[400px]">
                <div className="text-center text-muted-foreground mb-4">
                  Delivery App Preview
                </div>
                
                {/* Floating Speech Button Preview */}
                <div
                  className={`fixed ${
                    config.position === 'bottom-right' ? 'bottom-4 right-4' :
                    config.position === 'bottom-left' ? 'bottom-4 left-4' :
                    config.position === 'top-right' ? 'top-4 right-4' :
                    config.position === 'top-left' ? 'top-4 left-4' :
                    'top-1/2 right-4'
                  } z-50`}
                  style={{ position: 'absolute' }}
                >
                  <Button
                    size={config.buttonSize as any}
                    style={{ backgroundColor: config.buttonColor }}
                    className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {config.buttonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};