import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomPostCheckoutEditorProps {
  appId: string;
  currentConfig: {
    enabled: boolean;
    title: string;
    message: string;
    cta_button_text: string;
    cta_button_url: string;
    background_color: string;
    text_color: string;
  };
  onConfigUpdated: (newConfig: any) => void;
}

export const CustomPostCheckoutEditor: React.FC<CustomPostCheckoutEditorProps> = ({
  appId,
  currentConfig,
  onConfigUpdated
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState(currentConfig);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({
          custom_post_checkout_config: config
        })
        .eq('id', appId);

      if (error) throw error;

      onConfigUpdated(config);
      
      toast({
        title: "Success",
        description: "Post-checkout configuration updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast({
        title: "Error", 
        description: "Failed to update configuration",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Post-Checkout Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
          />
          <Label htmlFor="enabled">Enable Custom Post-Checkout Screen</Label>
        </div>

        {config.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="e.g., Don't forget to schedule Airbnb delivery!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={config.message}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="e.g., Make sure your Airbnb is stocked when you arrive by scheduling a delivery!"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_button_text">Call-to-Action Button Text</Label>
              <Input
                id="cta_button_text"
                value={config.cta_button_text}
                onChange={(e) => handleConfigChange('cta_button_text', e.target.value)}
                placeholder="e.g., Schedule Airbnb Delivery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_button_url">Call-to-Action Button URL</Label>
              <Input
                id="cta_button_url"
                value={config.cta_button_url}
                onChange={(e) => handleConfigChange('cta_button_url', e.target.value)}
                placeholder="e.g., https://order.partyondelivery.com/airbnb"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={config.background_color}
                    onChange={(e) => handleConfigChange('background_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={config.background_color}
                    onChange={(e) => handleConfigChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={config.text_color}
                    onChange={(e) => handleConfigChange('text_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={config.text_color}
                    onChange={(e) => handleConfigChange('text_color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border rounded-lg" style={{ backgroundColor: config.background_color }}>
              <h4 className="font-semibold mb-2">Preview:</h4>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold" style={{ color: config.text_color }}>
                  {config.title || "Your Title Here"}
                </h3>
                <p style={{ color: config.text_color }}>
                  {config.message || "Your message here"}
                </p>
                {config.cta_button_text && (
                  <Button className="mt-2">
                    {config.cta_button_text}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
          {isUpdating ? "Updating..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
};