import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Save, X, Palette, Type, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StartScreenConfig {
  enabled: boolean;
  app_name: string;
  custom_title?: string;
  custom_subtitle?: string;
  start_button_text?: string;
  search_button_text?: string;
  home_button_text?: string;
  background_color: string;
  primary_color: string;
  text_color: string;
  logo_url?: string;
  custom_styles?: string;
}

interface CustomStartScreenEditorProps {
  appId: string;
  appName: string;
  currentConfig?: StartScreenConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: (appId: string, config: StartScreenConfig) => void;
}

export function CustomStartScreenEditor({ 
  appId, 
  appName,
  currentConfig, 
  isOpen, 
  onClose, 
  onConfigUpdated 
}: CustomStartScreenEditorProps) {
  const [config, setConfig] = useState<StartScreenConfig>({
    enabled: false,
    app_name: appName,
    custom_title: '',
    custom_subtitle: 'Powered by Party On Delivery',
    start_button_text: 'Start Order Now',
    search_button_text: 'Search All Products',
    home_button_text: 'Back to Main App',
    background_color: '#ffffff',
    primary_color: '#3b82f6',
    text_color: '#1f2937',
    logo_url: '',
    custom_styles: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setConfig(prev => ({ ...prev, ...currentConfig, app_name: appName }));
    } else {
      setConfig(prev => ({ ...prev, app_name: appName }));
    }
  }, [currentConfig, appName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Note: This will store the config in JSON column, but TypeScript doesn't know about it
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .update({
          custom_post_checkout_config: config // Using existing column name for now
        } as any)
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;

      onConfigUpdated(appId, config);
      toast.success('Start screen configuration saved successfully!');
      onClose();

    } catch (error: any) {
      console.error('Error saving start screen config:', error);
      toast.error(error.message || 'Failed to save start screen configuration');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      enabled: false,
      app_name: appName,
      custom_title: '',
      custom_subtitle: 'Powered by Party On Delivery',
      start_button_text: 'Start Order Now',
      search_button_text: 'Search All Products',
      home_button_text: 'Back to Main App',
      background_color: '#ffffff',
      primary_color: '#3b82f6',
      text_color: '#1f2937',
      logo_url: '',
      custom_styles: ''
    });
  };

  const getPreviewStyles = () => ({
    backgroundColor: config.background_color,
    color: config.text_color,
    '--primary-color': config.primary_color
  } as React.CSSProperties);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Start Screen - {appName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="enabled" 
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="enabled">Enable custom start screen</Label>
                </div>

                <div>
                  <Label htmlFor="custom-title">Custom Title (optional)</Label>
                  <Input
                    id="custom-title"
                    value={config.custom_title || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, custom_title: e.target.value }))}
                    placeholder="Leave empty to use app name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If empty, will use app name: "{appName}"
                  </p>
                </div>

                <div>
                  <Label htmlFor="custom-subtitle">Subtitle</Label>
                  <Input
                    id="custom-subtitle"
                    value={config.custom_subtitle || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, custom_subtitle: e.target.value }))}
                    placeholder="Powered by Party On Delivery"
                  />
                </div>

                <div>
                  <Label htmlFor="start-button">Start Button Text</Label>
                  <Input
                    id="start-button"
                    value={config.start_button_text || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, start_button_text: e.target.value }))}
                    placeholder="Start Order Now"
                  />
                </div>

                <div>
                  <Label htmlFor="search-button">Search Button Text</Label>
                  <Input
                    id="search-button"
                    value={config.search_button_text || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, search_button_text: e.target.value }))}
                    placeholder="Search All Products"
                  />
                </div>

                <div>
                  <Label htmlFor="home-button">Home Button Text</Label>
                  <Input
                    id="home-button"
                    value={config.home_button_text || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, home_button_text: e.target.value }))}
                    placeholder="Back to Main App"
                  />
                </div>

                <div>
                  <Label htmlFor="logo-url">Logo URL (optional)</Label>
                  <Input
                    id="logo-url"
                    value={config.logo_url || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.background_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={config.background_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Primary Color (Buttons)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={config.primary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={config.text_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={config.text_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-styles">Custom CSS (Advanced)</Label>
                  <Textarea
                    id="custom-styles"
                    value={config.custom_styles || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, custom_styles: e.target.value }))}
                    placeholder=".custom-button { border-radius: 20px; }"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Advanced CSS for custom styling
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" style={getPreviewStyles()}>
                  <div className="min-h-[400px] flex items-center justify-center p-4">
                    <div className="max-w-sm w-full">
                      <div className="text-center space-y-4">
                        {/* Logo */}
                        {config.logo_url ? (
                          <img 
                            src={config.logo_url} 
                            alt="Logo" 
                            className="w-24 h-24 mx-auto mb-4 object-contain"
                          />
                        ) : (
                          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">Logo</span>
                          </div>
                        )}
                        
                        {/* Title */}
                        <h1 className="text-lg font-bold" style={{ color: config.text_color }}>
                          {config.custom_title || config.app_name}
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="text-sm opacity-75">
                          {config.custom_subtitle}
                        </p>
                        
                        {/* Buttons */}
                        <div className="space-y-3">
                          <button 
                            className="w-full h-12 text-base rounded-lg text-white font-medium"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.start_button_text}
                          </button>
                          
                          <button 
                            className="w-full h-12 text-base rounded-lg border font-medium"
                            style={{ 
                              borderColor: config.primary_color,
                              color: config.primary_color,
                              backgroundColor: 'transparent'
                            }}
                          >
                            {config.search_button_text}
                          </button>
                          
                          <button 
                            className="w-full h-12 text-base rounded-lg border font-medium"
                            style={{ 
                              borderColor: config.text_color,
                              color: config.text_color,
                              backgroundColor: 'transparent'
                            }}
                          >
                            {config.home_button_text}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}