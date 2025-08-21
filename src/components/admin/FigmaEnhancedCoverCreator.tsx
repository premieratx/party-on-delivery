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
import { Eye, Save, Copy, Settings2, Palette, Layout, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Import Figma components - Removed old cover screens per user request

interface FigmaEnhancedCoverCreatorProps {
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
  template: 'original' | 'gold' | 'platinum';
  logo_url?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  buttons: Array<{
    text: string;
    type: string;
    target: string;
    style: string;
  }>;
  checklist: string[];
  theme: string;
  styles: any;
  is_active: boolean;
}

  const FIGMA_TEMPLATES = [
    // Templates disabled - old cover screens removed per user request
  ];

const DEFAULT_BUTTONS = [
  { text: 'Start Shopping', type: 'delivery_app', target: '', style: 'primary' },
  { text: 'Browse Collections', type: 'url', target: '', style: 'secondary' }
];

const DEFAULT_CHECKLIST = [
  'Same Day Delivery',
  'Locally Owned',
  'Premium Selection'
];

export const FigmaEnhancedCoverCreator: React.FC<FigmaEnhancedCoverCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<CoverPageConfig>({
    slug: '',
    title: 'Party On Delivery',
    subtitle: "Austin's exclusive concierge delivery service",
    template: 'original',
    buttons: DEFAULT_BUTTONS,
    checklist: DEFAULT_CHECKLIST,
    theme: 'default',
    styles: {},
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deliveryApps, setDeliveryApps] = useState<any[]>([]);

  useEffect(() => {
    if (initial) {
      setConfig(prev => ({
        ...prev,
        ...initial,
        template: initial.template || 'original',
        buttons: initial.buttons?.length > 0 ? initial.buttons : DEFAULT_BUTTONS,
        checklist: initial.checklist?.length > 0 ? initial.checklist : DEFAULT_CHECKLIST
      }));
    }
  }, [initial]);

  // Load delivery apps for button targets
  useEffect(() => {
    const loadDeliveryApps = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setDeliveryApps(data || []);
      } catch (error) {
        console.error('Error loading delivery apps:', error);
      }
    };
    
    if (open) {
      loadDeliveryApps();
    }
  }, [open]);

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
        logo_url: config.logo_url,
        bg_image_url: config.bg_image_url,
        bg_video_url: config.bg_video_url,
        buttons: JSON.stringify(config.buttons),
        checklist: JSON.stringify(config.checklist),
        theme: config.template, // Store template as theme
        styles: JSON.stringify({
          ...config.styles,
          template: config.template
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
          .insert([pageData]);
      }

      if (result.error) throw result.error;

      toast.success(config.id ? 'Cover page updated!' : 'Cover page created!');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving cover page:', error);
      toast.error('Failed to save cover page');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (templateId: 'original' | 'gold' | 'platinum') => {
    setConfig(prev => ({ ...prev, template: templateId }));
    toast.success(`Selected ${FIGMA_TEMPLATES.find(t => t.id === templateId)?.name} template`);
  };

  const addButton = () => {
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: '', type: 'url', target: '', style: 'primary' }]
    }));
  };

  const updateButton = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const removeButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const addChecklistItem = () => {
    setConfig(prev => ({
      ...prev,
      checklist: [...prev.checklist, '']
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => i === index ? value : item)
    }));
  };

  const removeChecklistItem = (index: number) => {
    setConfig(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const PreviewComponent = null; // Templates disabled per user request

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" style={{ fontSize: '14px' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Figma Enhanced Cover Page Creator
              <Badge variant="secondary" className="text-xs">
                Following System Guidelines
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="template" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="buttons" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Template Selection */}
            <TabsContent value="template" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">
                    Old template system has been disabled.
                    <br />
                    Use the enhanced cover page creator instead.
                  </p>
                </div>
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
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={config.logo_url || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bg_image_url">Background Image URL</Label>
                    <Input
                      id="bg_image_url"
                      value={config.bg_image_url || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, bg_image_url: e.target.value }))}
                      placeholder="https://example.com/background.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bg_video_url">Background Video URL</Label>
                    <Input
                      id="bg_video_url"
                      value={config.bg_video_url || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, bg_video_url: e.target.value }))}
                      placeholder="https://example.com/background.mp4"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Feature Checklist</Label>
                  <Button size="sm" onClick={addChecklistItem}>Add Item</Button>
                </div>
                <div className="space-y-2">
                  {config.checklist.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        placeholder="Feature description"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeChecklistItem(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Button Configuration */}
            <TabsContent value="buttons" className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Action Buttons</Label>
                <Button onClick={addButton}>Add Button</Button>
              </div>
              
              <div className="space-y-4">
                {config.buttons.map((button, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                              <SelectItem value="url">Custom URL</SelectItem>
                              <SelectItem value="delivery_app">Delivery App</SelectItem>
                              <SelectItem value="collection">Product Collection</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Target</Label>
                          {button.type === 'delivery_app' ? (
                            <Select
                              value={button.target}
                              onValueChange={(value) => updateButton(index, 'target', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select app" />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryApps.map((app) => (
                                  <SelectItem key={app.id} value={app.slug}>
                                    {app.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={button.target}
                              onChange={(e) => updateButton(index, 'target', e.target.value)}
                              placeholder={button.type === 'url' ? 'https://example.com' : 'collection-handle'}
                            />
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Style</Label>
                            <Select
                              value={button.style}
                              onValueChange={(value) => updateButton(index, 'style', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                                <SelectItem value="outline">Outline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeButton(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="space-y-6">
              <div className="text-center">
                <Button onClick={() => setPreviewOpen(true)} size="lg">
                  <Eye className="mr-2 h-4 w-4" />
                  Open Full Preview
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Preview your cover page with the selected template
                </p>
              </div>
              
              {/* Mini Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-center space-y-2">
                  <Badge variant="outline">Enhanced Cover System Active</Badge>
                  <h3 className="text-lg font-semibold">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    {config.buttons.map((btn, i) => (
                      <Badge key={i} variant={btn.style === 'primary' ? 'default' : 'outline'}>
                        {btn.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/cover/${config.slug}`)}
                variant="outline"
                size="sm"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !config.slug.trim() || !config.title.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : (config.id ? 'Update' : 'Create')} Cover Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Preview - Disabled */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg">
            <p className="text-center">Preview disabled - old template system removed</p>
            <Button onClick={() => setPreviewOpen(false)} className="mt-4 w-full">Close</Button>
          </div>
        </div>
      )}
    </>
  );
};