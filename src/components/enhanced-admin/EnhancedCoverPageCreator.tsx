import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Eye, Save, Copy, Settings2, Palette, Layout, Sparkles, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';

interface EnhancedCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
  logoEmoji: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  variant: 'original' | 'gold' | 'platinum';
  features: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;
  buttons: Array<{
    text: string;
    type: 'primary' | 'secondary' | 'tertiary';
    target: string;
    color?: string;
    textColor?: string;
  }>;
  is_active: boolean;
}

const VARIANT_TEMPLATES = [
  {
    id: 'original',
    name: 'Original',
    description: 'Clean, modern design with gradient accents',
    badge: '✨ Classic',
    preview: 'bg-gradient-to-r from-blue-100 to-purple-100'
  },
  {
    id: 'gold',
    name: 'Gold Tier',
    description: 'Premium gold theme for luxury experiences',
    badge: '🏆 Premium',
    preview: 'bg-gradient-to-r from-amber-200 to-yellow-200'
  },
  {
    id: 'platinum',
    name: 'Platinum Elite',
    description: 'Ultra-premium platinum design',
    badge: '💎 Elite',
    preview: 'bg-gradient-to-r from-slate-200 to-zinc-200'
  }
];

const DEFAULT_FEATURES = [
  { emoji: '⚡', title: 'Same Day Delivery', description: 'Fast & reliable service' },
  { emoji: '🏪', title: 'Locally Owned', description: 'Supporting Austin businesses' },
  { emoji: '🍸', title: 'Premium Selection', description: 'Curated for your event' }
];

const DEFAULT_BUTTONS = [
  { text: 'Start Shopping', type: 'primary' as const, target: '' },
  { text: 'Browse Collections', type: 'secondary' as const, target: '' }
];

export const EnhancedCoverPageCreator: React.FC<EnhancedCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<CoverPageConfig>({
    slug: '',
    title: 'Party On Delivery',
    subtitle: "Austin's exclusive concierge delivery service",
    logoEmoji: '🎉',
    variant: 'original',
    features: DEFAULT_FEATURES,
    buttons: DEFAULT_BUTTONS,
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [standalonePath, setStandalonePath] = useState<string>('');

  useEffect(() => {
    if (initial) {
      // Parse existing data
      const parsedFeatures = typeof initial.checklist === 'string' ? 
        JSON.parse(initial.checklist || '[]') : initial.checklist || [];
      const parsedButtons = typeof initial.buttons === 'string' ? 
        JSON.parse(initial.buttons || '[]') : initial.buttons || [];
      
      setConfig(prev => ({
        ...prev,
        ...initial,
        variant: initial.theme || initial.variant || 'original',
        features: parsedFeatures.length > 0 ? 
          parsedFeatures.map((item: any, index: number) => ({
            emoji: DEFAULT_FEATURES[index]?.emoji || '⭐',
            title: typeof item === 'string' ? item : item.title || '',
            description: typeof item === 'string' ? 'Premium feature' : item.description || ''
          })) : DEFAULT_FEATURES,
        buttons: parsedButtons.length > 0 ? parsedButtons : DEFAULT_BUTTONS,
        logoEmoji: initial.logoEmoji || '🎉'
      }));
    }
  }, [initial]);

  const handleSave = async () => {
    if (!config.slug.trim()) {
      toast.error('Please enter a page slug');
      return;
    }

    if (!config.title.trim()) {
      toast.error('Please enter a page title');
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        slug: config.slug,
        title: config.title,
        subtitle: config.subtitle,
        logo_url: config.logoUrl,
        bg_image_url: config.backgroundImageUrl,
        bg_video_url: config.backgroundVideoUrl,
        buttons: JSON.stringify(config.buttons),
        checklist: JSON.stringify(config.features),
        theme: config.variant,
        styles: JSON.stringify({
          variant: config.variant,
          logoEmoji: config.logoEmoji,
          features: config.features,
          buttons: config.buttons
        }),
        is_active: config.is_active,
        created_by: 'admin'
      };

      let result;
      if (config.id) {
        result = await supabase
          .from('cover_pages')
          .update(pageData)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('cover_pages')
          .insert([pageData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Set standalone path for new pages
      if (!config.id && result.data) {
        setStandalonePath(`/cover/${result.data.slug}`);
      } else if (config.id) {
        setStandalonePath(`/cover/${config.slug}`);
      }

      toast.success(config.id ? 'Cover page updated!' : 'Cover page created!');
      onSaved?.();
    } catch (error) {
      console.error('Error saving cover page:', error);
      toast.error('Failed to save cover page');
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const addFeature = () => {
    setConfig(prev => ({
      ...prev,
      features: [...prev.features, { emoji: '⭐', title: '', description: '' }]
    }));
  };

  const removeFeature = (index: number) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) =>
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const addButton = () => {
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: '', type: 'primary', target: '' }]
    }));
  };

  const removeButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Enhanced Cover Page Creator
                <Badge variant="secondary" className="text-xs">
                  Professional Templates
                </Badge>
              </div>
              {standalonePath && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(standalonePath, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="template" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="buttons">Actions</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Template Selection */}
              <TabsContent value="template" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {VARIANT_TEMPLATES.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        config.variant === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, variant: template.id as any }))}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {template.badge}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                        <div className={`h-20 rounded-lg ${template.preview} border`} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Content Configuration */}
              <TabsContent value="content" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="slug">Page Slug *</Label>
                      <Input
                        id="slug"
                        value={config.slug}
                        onChange={(e) => setConfig(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="my-cover-page"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={config.title}
                        onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Party On Delivery"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Textarea
                        id="subtitle"
                        value={config.subtitle}
                        onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Austin's exclusive concierge delivery service"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={config.logoUrl || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <Label htmlFor="logoEmoji">Logo Emoji (fallback)</Label>
                      <Input
                        id="logoEmoji"
                        value={config.logoEmoji}
                        onChange={(e) => setConfig(prev => ({ ...prev, logoEmoji: e.target.value }))}
                        placeholder="🎉"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bgImageUrl">Background Image URL</Label>
                      <Input
                        id="bgImageUrl"
                        value={config.backgroundImageUrl || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                        placeholder="https://example.com/background.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bgVideoUrl">Background Video URL</Label>
                      <Input
                        id="bgVideoUrl"
                        value={config.backgroundVideoUrl || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundVideoUrl: e.target.value }))}
                        placeholder="https://example.com/background.mp4"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Page Active</Label>
                </div>
              </TabsContent>

              {/* Features Configuration */}
              <TabsContent value="features" className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Feature Cards</Label>
                  <Button size="sm" onClick={addFeature}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {config.features.map((feature, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Emoji</Label>
                            <Input
                              value={feature.emoji}
                              onChange={(e) => updateFeature(index, 'emoji', e.target.value)}
                              placeholder="⭐"
                            />
                          </div>
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={feature.title}
                              onChange={(e) => updateFeature(index, 'title', e.target.value)}
                              placeholder="Feature title"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={feature.description}
                              onChange={(e) => updateFeature(index, 'description', e.target.value)}
                              placeholder="Feature description"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFeature(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Button Configuration */}
              <TabsContent value="buttons" className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Action Buttons</Label>
                  <Button size="sm" onClick={addButton}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {config.buttons.map((button, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <Label>Button Text</Label>
                            <Input
                              value={button.text}
                              onChange={(e) => updateButton(index, 'text', e.target.value)}
                              placeholder="Button text"
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={button.type}
                              onValueChange={(value) => updateButton(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                                <SelectItem value="tertiary">Tertiary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Target URL</Label>
                            <Input
                              value={button.target}
                              onChange={(e) => updateButton(index, 'target', e.target.value)}
                              placeholder="https://example.com"
                            />
                          </div>
                          <div>
                            <Label>Custom Color</Label>
                            <Input
                              value={button.color || ''}
                              onChange={(e) => updateButton(index, 'color', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                          <div>
                            <Label>Text Color</Label>
                            <Input
                              value={button.textColor || ''}
                              onChange={(e) => updateButton(index, 'textColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeButton(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Preview */}
              <TabsContent value="preview" className="h-[600px]">
                <EditableCoverScreen
                  title={config.title}
                  subtitle={config.subtitle}
                  logoUrl={config.logoUrl}
                  logoEmoji={config.logoEmoji}
                  backgroundImageUrl={config.backgroundImageUrl}
                  backgroundVideoUrl={config.backgroundVideoUrl}
                  features={config.features}
                  buttons={config.buttons.map(btn => ({
                    ...btn,
                    onClick: () => toast.info(`Would navigate to: ${btn.target}`)
                  }))}
                  variant={config.variant}
                  standalone={true}
                  className="rounded-lg overflow-hidden"
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Full Preview
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Cover Page
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <EditableCoverScreen
            title={config.title}
            subtitle={config.subtitle}
            logoUrl={config.logoUrl}
            logoEmoji={config.logoEmoji}
            backgroundImageUrl={config.backgroundImageUrl}
            backgroundVideoUrl={config.backgroundVideoUrl}
            features={config.features}
            buttons={config.buttons.map(btn => ({
              ...btn,
              onClick: () => setPreviewOpen(false)
            }))}
            variant={config.variant}
            onClose={() => setPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};