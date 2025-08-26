// ⚠️ DEPRECATED COMPONENT - DO NOT USE ⚠️
// This component is deprecated and should not be used.
// Use UnifiedCoverPageEditor instead for all cover page functionality.
// Located at: src/components/admin/UnifiedCoverPageEditor.tsx
//
// If you see this component being used anywhere, please replace it
// with UnifiedCoverPageEditor to avoid inconsistency.

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CoverPagePreview } from './CoverPagePreview';
import { Loader2, Save, Settings, Palette, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { UNIFIED_THEMES, type ThemeConfig, migrateLegacyTheme } from '@/lib/themeSystem';

interface UnifiedCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const UnifiedCoverPageCreator: React.FC<UnifiedCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🎉');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState('');
  const [theme, setTheme] = useState<'original' | 'gold' | 'platinum'>('gold');
  const [features, setFeatures] = useState([
    { emoji: '⭐', title: 'Premium Quality', description: 'Top-tier products and service' },
    { emoji: '🚀', title: 'Fast Delivery', description: 'Quick and reliable shipping' },
    { emoji: '💎', title: 'Best Value', description: 'Unbeatable prices and deals' }
  ]);
  const [buttons, setButtons] = useState([
    { text: 'Order Now', type: 'primary' as const, url: '/delivery' },
    { text: 'Learn More', type: 'secondary' as const, url: '/about' }
  ]);
  const [isActive, setIsActive] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Load initial data
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setLogoUrl(initial.logo_url || '');
      setBackgroundImageUrl(initial.bg_image_url || '');
      setBackgroundVideoUrl(initial.bg_video_url || '');
      setTheme(initial.unified_theme || migrateLegacyTheme(initial.theme || 'gold'));
      setIsActive(initial.is_active ?? true);
      
      // Load features and buttons from existing data
      if (initial.checklist && Array.isArray(initial.checklist)) {
        setFeatures(initial.checklist.slice(0, 3).map((item: any, index: number) => ({
          emoji: ['⭐', '🚀', '💎'][index],
          title: item.title || item.text || `Feature ${index + 1}`,
          description: item.description || item.text || 'Description'
        })));
      }
      
      if (initial.buttons && Array.isArray(initial.buttons)) {
        setButtons(initial.buttons.slice(0, 2).map((btn: any, index: number) => {
          const buttonType: 'primary' | 'secondary' = index === 0 ? 'primary' : 'secondary';
          return {
            text: btn.text || btn.title || (index === 0 ? 'Order Now' : 'Learn More'),
            type: buttonType,
            url: btn.url || btn.link || (index === 0 ? '/delivery' : '/about')
          };
        }));
      }
    } else {
      // Reset for new cover page
      setTitle('');
      setSubtitle('');
      setLogoUrl('');
      setBackgroundImageUrl('');
      setBackgroundVideoUrl('');
      setTheme('gold');
      setFeatures([
        { emoji: '⭐', title: 'Premium Quality', description: 'Top-tier products and service' },
        { emoji: '🚀', title: 'Fast Delivery', description: 'Quick and reliable shipping' },
        { emoji: '💎', title: 'Best Value', description: 'Unbeatable prices and deals' }
      ]);
      setButtons([
        { text: 'Order Now', type: 'primary', url: '/delivery' },
        { text: 'Learn More', type: 'secondary', url: '/about' }
      ]);
      setIsActive(true);
    }
  }, [open, initial]);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cover-page';
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const slug = generateSlug(title);
      
      const coverData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: initial ? initial.slug : `${slug}-${Date.now()}`,
        logo_url: logoUrl || null,
        bg_image_url: backgroundImageUrl || null,
        bg_video_url: backgroundVideoUrl || null,
        unified_theme: theme,
        theme: theme, // Keep both for compatibility
        checklist: features.map(f => ({ 
          title: f.title, 
          description: f.description,
          emoji: f.emoji
        })) as any,
        buttons: buttons.map(b => ({ 
          text: b.text, 
          type: b.type, 
          url: b.url 
        })) as any,
        is_active: isActive,
        styles: {} as any
      };

      if (initial?.id) {
        const { error } = await supabase
          .from('cover_pages')
          .update(coverData)
          .eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'Cover page updated successfully!' });
      } else {
        const { error } = await supabase
          .from('cover_pages')
          .insert(coverData);
        if (error) throw error;
        toast({ title: 'Cover page created successfully!' });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {initial ? `Edit: ${initial.title}` : 'Create Cover Page'}
                </h2>
                <DialogDescription id="dialog-description" className="text-sm text-muted-foreground font-normal">
                  Pixel-perfect Figma-based design with cohesive theming
                </DialogDescription>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading || !title}
                size="sm"
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Cover'}
              </Button>
            </DialogTitle>
            <DialogDescription id="dialog-description">
              Build custom cover pages with theming, content management, and live preview.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => {
                            console.log('Title input changed:', e.target.value);
                            setTitle(e.target.value);
                          }}
                          placeholder="Premium Delivery Experience"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Textarea
                          id="subtitle"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="Experience luxury delivery service with premium quality products"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="logo-url">Logo URL</Label>
                        <Input
                          id="logo-url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bg-image">Background Image URL</Label>
                        <Input
                          id="bg-image"
                          value={backgroundImageUrl}
                          onChange={(e) => setBackgroundImageUrl(e.target.value)}
                          placeholder="https://example.com/background.jpg"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-active"
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="is-active">Active</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Features Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Features (Max 3)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {features.map((feature, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <Label>Emoji</Label>
                            <Input
                              value={feature.emoji}
                              onChange={(e) => {
                                const updated = [...features];
                                updated[index].emoji = e.target.value;
                                setFeatures(updated);
                              }}
                              placeholder="⭐"
                            />
                          </div>
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={feature.title}
                              onChange={(e) => {
                                const updated = [...features];
                                updated[index].title = e.target.value;
                                setFeatures(updated);
                              }}
                              placeholder="Feature Title"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Description</Label>
                            <Input
                              value={feature.description}
                              onChange={(e) => {
                                const updated = [...features];
                                updated[index].description = e.target.value;
                                setFeatures(updated);
                              }}
                              placeholder="Feature description"
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Buttons Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Buttons (Max 2)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {buttons.map((button, index) => (
                        <div key={index} className="grid grid-cols-3 gap-3 items-end">
                          <div>
                            <Label>Button Text</Label>
                            <Input
                              value={button.text}
                              onChange={(e) => {
                                const updated = [...buttons];
                                updated[index].text = e.target.value;
                                setButtons(updated);
                              }}
                              placeholder="Order Now"
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={button.type} 
                              onValueChange={(value: 'primary' | 'secondary') => {
                                const updated = [...buttons];
                                updated[index].type = value;
                                setButtons(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>URL</Label>
                            <Input
                              value={button.url}
                              onChange={(e) => {
                                const updated = [...buttons];
                                updated[index].url = e.target.value;
                                setButtons(updated);
                              }}
                              placeholder="/delivery"
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="theme" className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.values(UNIFIED_THEMES).map((themeConfig) => (
                          <div 
                            key={themeConfig.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              theme === themeConfig.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setTheme(themeConfig.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{themeConfig.name}</h3>
                              <Badge variant={theme === themeConfig.id ? 'default' : 'secondary'}>
                                {theme === themeConfig.id ? 'Selected' : 'Select'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {themeConfig.description}
                            </p>
                            <div className="flex gap-2">
                              {Object.entries(themeConfig.colors).slice(0, 5).map(([name, color]) => (
                                <div
                                  key={name}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={name}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden p-6">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden">
                    <CoverPagePreview
                      title={title || 'Premium Delivery Experience'}
                      subtitle={subtitle || 'Experience luxury delivery service'}
                      logoUrl={logoUrl}
                      backgroundImageUrl={backgroundImageUrl}
                      theme={theme}
                      features={features}
                      buttons={buttons}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};