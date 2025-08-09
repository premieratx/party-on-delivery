import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Save, X, Palette, Type, Link, Sparkles, Layout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StartScreenTemplateBuilder } from './StartScreenTemplateBuilder';

interface StartScreenConfig {
  enabled: boolean;
  app_name: string;
  custom_title?: string;
  custom_subtitle?: string;
  start_button_text?: string;
  search_button_text?: string;
  home_button_text?: string;
  checklist_item_1?: string;
  checklist_item_2?: string;
  checklist_item_3?: string;
  background_color: string;
  primary_color: string;
  text_color: string;
  logo_url?: string;
  custom_styles?: string;
  website_url?: string;
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
    start_button_text: 'Order Now',
    search_button_text: 'Search All Products',
    home_button_text: 'Back to Main App',
    checklist_item_1: 'Locally Owned',
    checklist_item_2: 'Same Day Delivery',
    checklist_item_3: 'Cocktail Kits on Demand',
    background_color: '#0b0b0b',
    primary_color: '#3b82f6',
    text_color: '#f8fafc',
    logo_url: '',
    custom_styles: '',
    website_url: ''
  });

  const [saving, setSaving] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [currentTab, setCurrentTab] = useState('templates');

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
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .update({
          start_screen_config: config,
          logo_url: config.logo_url || null
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

  const handleTemplateSelect = (template: any) => {
    const templateConfig = template.config;
    const newConfig = {
      ...config,
      enabled: true,
      background_color: typeof templateConfig.background === 'string' 
        ? templateConfig.background 
        : templateConfig.background.value,
      primary_color: templateConfig.colors.accent,
      text_color: templateConfig.colors.text,
    };
    
    setConfig(newConfig);
    setShowTemplateBuilder(false);
    setCurrentTab('editor');
    toast.success(`Template "${template.name}" applied successfully!`);
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `start-screen-${appId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-logos')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('delivery-app-logos').getPublicUrl(fileName);
      setConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
      toast.success('Logo uploaded');
    } catch (e: any) {
      console.error('Logo upload failed:', e);
      toast.error(e.message || 'Logo upload failed');
    }
  };

  const getPreviewStyles = () => ({
    backgroundColor: config.background_color,
    color: config.text_color,
    '--primary-color': config.primary_color as any
  } as React.CSSProperties);

  const handleAutoStyle = async () => {
    if (!config.website_url) {
      toast.error('Please enter a website URL first');
      return;
    }
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('extract-website-brand', {
        body: { url: config.website_url }
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Brand extraction failed');

      const title = data.title as string | undefined;
      const description = data.description as string | undefined;
      const colors = data.colors as { background: string; primary: string; text: string };

      setConfig(prev => ({
        ...prev,
        custom_title: prev.custom_title || title || prev.app_name,
        custom_subtitle: prev.custom_subtitle || (description ? description.slice(0, 90) : prev.custom_subtitle),
        background_color: colors.background || prev.background_color,
        primary_color: colors.primary || prev.primary_color,
        text_color: colors.text || prev.text_color,
      }));
      toast.success('Styles applied from website');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to extract brand styles. Make sure FIRECRAWL_API_KEY is configured.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Start Screen - {appName}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Template Library
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Custom Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Professional Template Library
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose from 60+ professionally designed templates based on top delivery app designs, 
                  featuring modern layouts, beautiful gradients, and optimized mobile/desktop experiences.
                </p>
                
                <Button 
                  onClick={() => setShowTemplateBuilder(true)} 
                  size="lg" 
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Browse Template Library
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    </div>

                    <div>
                      <Label htmlFor="custom-subtitle">Subtitle</Label>
                      <Input
                        id="custom-subtitle"
                        value={config.custom_subtitle || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, custom_subtitle: e.target.value }))}
                        placeholder="Austin's favorite alcohol delivery service"
                      />
                    </div>

                    <div>
                      <Label htmlFor="start-button">Start Button Text</Label>
                      <Input
                        id="start-button"
                        value={config.start_button_text || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, start_button_text: e.target.value }))}
                        placeholder="Order Now"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="check-1">Checklist Item 1</Label>
                        <Input
                          id="check-1"
                          value={config.checklist_item_1 || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, checklist_item_1: e.target.value }))}
                          placeholder="Locally Owned"
                        />
                      </div>
                      <div>
                        <Label htmlFor="check-2">Checklist Item 2</Label>
                        <Input
                          id="check-2"
                          value={config.checklist_item_2 || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, checklist_item_2: e.target.value }))}
                          placeholder="Same Day Delivery"
                        />
                      </div>
                      <div>
                        <Label htmlFor="check-3">Checklist Item 3</Label>
                        <Input
                          id="check-3"
                          value={config.checklist_item_3 || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, checklist_item_3: e.target.value }))}
                          placeholder="Cocktail Kits on Demand"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="brand-url" className="flex items-center gap-2">
                        <Link className="h-4 w-4" /> Brand Website URL (optional)
                      </Label>
                      <Input
                        id="brand-url"
                        type="url"
                        placeholder="https://example.com"
                        value={config.website_url || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, website_url: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">We’ll auto-style your start screen to match this site (no changes until you click the button).</p>
                      <div className="mt-2">
                        <Button type="button" variant="secondary" onClick={handleAutoStyle} disabled={saving || !config.website_url}>
                          <Sparkles className="h-4 w-4 mr-2" /> Auto-style from Website
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="logo-upload">Start Screen Logo</Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG/JPG/SVG. Optimized for mobile.</p>
                    </div>
                    {config.logo_url && (
                      <div className="mt-2">
                        <img src={config.logo_url} alt="Start screen logo preview" className="h-12 w-auto" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden" style={getPreviewStyles()}>
                      <div className="min-h-[400px] flex items-center justify-center p-4">
                        <div className="max-w-sm w-full text-center space-y-4">
                          <div className="mx-auto mb-2 h-10 w-auto flex items-center justify-center">
                            {config.logo_url && (
                              <img src={config.logo_url} alt="Logo" className="h-10 w-auto" />
                            )}
                          </div>
                          <h1 className=\"text-lg font-bold\" style={{ color: config.text_color }}>
                            {config.custom_title || config.app_name}
                          </h1>
                          <p className=\"text-sm opacity-80\">{config.custom_subtitle}</p>
                          <div className=\"mt-3 text-left space-y-1 text-sm\">
                            {[config.checklist_item_1, config.checklist_item_2, config.checklist_item_3].filter(Boolean).map((t, i) => (
                              <div key={i} className=\"flex items-center gap-2\">
                                <span className=\"inline-block h-3 w-3 rounded-full bg-[var(--primary-color)]\" />
                                <span>{t}</span>
                              </div>
                            ))}
                          </div>
                          <button 
                            className=\"w-full h-12 text-base rounded-full text-white font-medium mt-3\"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.start_button_text}
                          </button>
                          <button 
                            className=\"w-full h-11 text-base rounded-full border mt-2\"
                            style={{ color: config.text_color }}
                          >
                            Margaritas Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <StartScreenTemplateBuilder
          isOpen={showTemplateBuilder}
          onClose={() => setShowTemplateBuilder(false)}
          onTemplateSelect={handleTemplateSelect}
          currentAppName={appName}
        />
      </DialogContent>
    </Dialog>
  );
}