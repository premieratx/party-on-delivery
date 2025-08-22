import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { DEFAULT_COVER_TEMPLATE, TEMPLATE_VARIANTS, createCoverPageFromTemplate } from '../templates/CoverPageTemplates';

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
    linkType?: 'custom' | 'delivery_app';
    deliveryAppId?: string;
  }>;
  // Advanced Styling
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  backgroundOverlay?: {
    enabled: boolean;
    color?: string;
    opacity?: number;
  };
  // Typography & Logo Controls
  typography?: {
    titleSize?: string;
    subtitleSize?: string;
    fontFamily?: string;
    titleColor?: string;
    subtitleColor?: string;
  };
  logoSizing?: {
    width?: string;
    height?: string;
  };
  // Layout & Positioning Controls
  positioning?: {
    logoMarginTop?: string;
    logoMarginBottom?: string;
    titleMarginTop?: string;
    titleMarginBottom?: string;
    subtitleMarginTop?: string;
    subtitleMarginBottom?: string;
    featuresMarginTop?: string;
    featuresMarginBottom?: string;
    buttonsMarginTop?: string;
    buttonsMarginBottom?: string;
  };
  // Animation Settings
  animations?: {
    enabled: boolean;
    speed?: 'slow' | 'normal' | 'fast';
    entrance?: 'fade' | 'slide' | 'scale';
  };
  // SEO Settings
  seo?: {
    metaDescription?: string;
    keywords?: string;
    ogImage?: string;
  };
  // Analytics
  analytics?: {
    trackingCode?: string;
    conversionPixel?: string;
  };
  // Scheduling
  scheduling?: {
    publishAt?: string;
    unpublishAt?: string;
  };
  is_active: boolean;
}

const VARIANT_TEMPLATES = [
  {
    id: 'gold',
    name: 'Gold Premium',
    description: 'Luxury gold design with premium styling',
    badge: '🏆 Premium',
    preview: 'bg-gradient-to-r from-amber-200 to-yellow-200',
    colors: { primary: '#d4af37', secondary: '#8b5cf6', accent: '#f59e0b' }
  },
  {
    id: 'platinum',
    name: 'Platinum Elite',
    description: 'Ultra-premium platinum design',
    badge: '💎 Elite',
    preview: 'bg-gradient-to-r from-slate-200 to-zinc-200',
    colors: { primary: '#71717a', secondary: '#3b82f6', accent: '#6366f1' }
  },
  {
    id: 'original',
    name: 'Classic Blue',
    description: 'Clean, modern design with blue accents',
    badge: '✨ Classic',
    preview: 'bg-gradient-to-r from-blue-100 to-purple-100',
    colors: { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#06b6d4' }
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

const COMMON_EMOJIS = [
  '⭐', '🎉', '🚀', '💎', '🔥', '✨', '⚡', '🏪', '🍸', '🎯',
  '🎊', '💫', '🌟', '🎁', '🏆', '💪', '🔝', '📱', '💻', '🎵',
  '🏅', '🎪', '🎨', '🎭', '🎬', '📸', '🎤', '🎧', '🎮', '🃏',
  '🍀', '🌈', '☀️', '🌙', '❄️', '🌊', '🔔', '⏰', '📍', '🎄'
];

export const EnhancedCoverPageCreator: React.FC<EnhancedCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<CoverPageConfig>(() => {
    // Initialize with the gold template as default
    const template = createCoverPageFromTemplate('gold');
    return {
      slug: '',
      title: template.title,
      subtitle: template.subtitle,
      logoEmoji: template.styles.logoEmoji,
      variant: 'gold' as const,
      features: template.styles.features,
      buttons: template.buttons,
      backgroundOverlay: { enabled: false, opacity: 0.5 },
      typography: { 
        titleSize: 'text-4xl md:text-5xl', 
        subtitleSize: 'text-xl',
        fontFamily: 'inherit'
      },
      logoSizing: {
        width: '5rem',
        height: '5rem'
      },
      positioning: {
        logoMarginTop: '0',
        logoMarginBottom: '0',
        titleMarginTop: '0', 
        titleMarginBottom: '0',
        subtitleMarginTop: '0',
        subtitleMarginBottom: '0',
        featuresMarginTop: '0',
        featuresMarginBottom: '0',
        buttonsMarginTop: '0',
        buttonsMarginBottom: '0'
      },
      customColors: template.styles.customColors,
      animations: { enabled: true, speed: 'normal' as const, entrance: 'fade' as const },
      seo: {},
      analytics: {},
      scheduling: {},
      is_active: true
    };
  });
  
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [standalonePath, setStandalonePath] = useState<string>('');
  
  // Fetch delivery apps for button assignment
  const [deliveryApps, setDeliveryApps] = useState<Array<{
    id: string;
    app_name: string;
    app_slug: string;
  }>>([]);

  useEffect(() => {
    const loadDeliveryApps = async () => {
      try {
        console.log('🔍 Loading delivery apps for button assignment...');
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('id, app_name, app_slug')
          .eq('is_active', true)
          .order('app_name');

        if (error) {
          console.error('❌ Error loading delivery apps:', error);
          throw error;
        }
        
        console.log('✅ Loaded delivery apps:', data?.length);
        setDeliveryApps(data || []);
      } catch (error) {
        console.error('Error loading delivery apps:', error);
      }
    };

    if (open) {
      loadDeliveryApps();
    }
  }, [open]);

  // Helper function to load template
  const loadTemplate = (templateName: 'gold' | 'platinum' | 'original') => {
    console.log('Loading template:', templateName);
    const template = createCoverPageFromTemplate(templateName);
    setConfig(prev => ({
      ...prev,
      title: template.title,
      subtitle: template.subtitle,
      variant: templateName,
      features: template.styles.features,
      buttons: template.buttons,
      logoEmoji: template.styles.logoEmoji,
      customColors: template.styles.customColors
    }));
  };

  useEffect(() => {
    if (initial) {
      console.log('🔍 Loading initial cover page data:', initial);
      
      // Parse existing data
      const parsedFeatures = typeof initial.checklist === 'string' ? 
        JSON.parse(initial.checklist || '[]') : initial.checklist || [];
      const parsedButtons = typeof initial.buttons === 'string' ? 
        JSON.parse(initial.buttons || '[]') : initial.buttons || [];
      const parsedStyles = typeof initial.styles === 'string' ? 
        JSON.parse(initial.styles || '{}') : initial.styles || {};

      console.log('📝 Parsed data:', {
        features: parsedFeatures,
        buttons: parsedButtons,
        styles: parsedStyles
      });
      
      setConfig(prev => ({
        ...prev,
        id: initial.id,
        slug: initial.slug,
        title: initial.title,
        subtitle: initial.subtitle,
        logoUrl: initial.logo_url,
        backgroundImageUrl: initial.bg_image_url,
        backgroundVideoUrl: initial.bg_video_url,
        variant: initial.theme || initial.variant || parsedStyles.variant || 'original',
        features: parsedFeatures.length > 0 ? 
          parsedFeatures.map((item: any, index: number) => ({
            emoji: parsedStyles.features?.[index]?.emoji || item.emoji || '⭐',
            title: typeof item === 'string' ? item : item.title || '',
            description: typeof item === 'string' ? 'Premium feature' : item.description || ''
          })) : DEFAULT_FEATURES,
        buttons: parsedButtons.length > 0 ? parsedButtons : DEFAULT_BUTTONS,
        logoEmoji: parsedStyles.logoEmoji || initial.logoEmoji || '🎉',
        // Restore all styling configurations
        logoSizing: parsedStyles.logoSizing || {
          width: '5rem',
          height: '5rem'
        },
        typography: parsedStyles.typography || {
          titleSize: 'text-4xl md:text-5xl',
          subtitleSize: 'text-xl',
          fontFamily: 'inherit'
        },
        positioning: parsedStyles.positioning || {
          logoMarginTop: '0',
          logoMarginBottom: '0',
          titleMarginTop: '0',
          titleMarginBottom: '0',
          subtitleMarginTop: '0',
          subtitleMarginBottom: '0',
          featuresMarginTop: '0',
          featuresMarginBottom: '0',
          buttonsMarginTop: '0',
          buttonsMarginBottom: '0'
        },
        customColors: parsedStyles.customColors || {},
        animations: parsedStyles.animations || {
          enabled: true,
          speed: 'normal' as const,
          entrance: 'fade' as const
        },
        backgroundOverlay: parsedStyles.backgroundOverlay || {
          enabled: false,
          opacity: 0.5
        },
        is_active: initial.is_active !== undefined ? initial.is_active : true
      }));

      console.log('✅ Cover page data loaded and config updated');
    }
  }, [initial]);

  const handleSave = async () => {
    console.log('🚀 SAVE INITIATED - Current config:', config);
    
    // Validation
    if (!config.slug?.trim()) {
      console.error('❌ VALIDATION FAILED: Missing slug');
      toast.error('Please enter a page slug');
      return;
    }

    if (!config.title?.trim()) {
      console.error('❌ VALIDATION FAILED: Missing title');
      toast.error('Please enter a page title');
      return;
    }

    console.log('✅ VALIDATION PASSED');
    setSaving(true);
    
    try {
      console.log('🏗️ CONSTRUCTING PAGE DATA...');
      const pageData = {
        slug: config.slug,
        title: config.title,
        subtitle: config.subtitle || '',
        logo_url: config.logoUrl || null,
        bg_image_url: config.backgroundImageUrl || null,
        bg_video_url: config.backgroundVideoUrl || null,
        buttons: JSON.stringify(config.buttons || []),
        checklist: JSON.stringify(config.features || []),
        theme: config.variant || 'gold',
        styles: JSON.stringify({
          variant: config.variant,
          logoEmoji: config.logoEmoji,
          features: config.features,
          buttons: config.buttons,
          typography: config.typography,
          logoSizing: config.logoSizing,
          positioning: config.positioning,
          customColors: config.customColors,
          animations: config.animations,
          backgroundOverlay: config.backgroundOverlay
        }),
        is_active: config.is_active !== undefined ? config.is_active : true,
        created_by: 'admin'
      };

      console.log('📦 PAGE DATA CONSTRUCTED:', pageData);
      console.log('🔍 Buttons being saved:', config.buttons);
      console.log('🔍 Features being saved:', config.features);
      
      let result;
      if (config.id) {
        console.log('📝 UPDATING EXISTING PAGE:', config.id);
        try {
          result = await supabase
            .from('cover_pages')
            .update(pageData)
            .eq('id', config.id)
            .select()
            .single();
          console.log('✅ UPDATE QUERY COMPLETED');
        } catch (updateError) {
          console.error('❌ UPDATE QUERY FAILED:', updateError);
          throw updateError;
        }
      } else {
        console.log('✨ CREATING NEW PAGE');
        try {
          result = await supabase
            .from('cover_pages')
            .insert([pageData])
            .select()
            .single();
          console.log('✅ INSERT QUERY COMPLETED');
        } catch (insertError) {
          console.error('❌ INSERT QUERY FAILED:', insertError);
          throw insertError;
        }
      }

      console.log('📊 FULL SUPABASE RESULT:', result);
      
      if (result.error) {
        console.error('❌ SUPABASE ERROR DETECTED:', result.error);
        console.error('Error details:', JSON.stringify(result.error, null, 2));
        throw result.error;
      }

      if (!result.data) {
        console.error('❌ NO DATA RETURNED FROM SUPABASE');
        throw new Error('No data returned from save operation');
      }

      console.log('✅ SAVE SUCCESSFUL - Data returned:', result.data);
      
      // Set standalone path and update config ID for new pages
      if (!config.id && result.data) {
        console.log('🔗 SETTING UP NEW PAGE REFERENCES');
        setConfig(prev => ({ ...prev, id: result.data.id }));
        setStandalonePath(`/cover/${result.data.slug}`);
        console.log('✅ NEW PAGE SETUP COMPLETE');
      } else if (config.id) {
        setStandalonePath(`/cover/${config.slug}`);
        console.log('✅ EXISTING PAGE PATH UPDATED');
      }

      const successMessage = config.id ? 'Cover page updated!' : 'Cover page created!';
      console.log('🎉 SUCCESS:', successMessage);
      toast.success(successMessage);
      onSaved?.();
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR DURING SAVE:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to save cover page';
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      console.log('🏁 SAVE PROCESS COMPLETED');
      setSaving(false);
    }
  };

  const updateFeature = (index: number, field: string, value: string) => {
    console.log(`Updating feature ${index}, field: ${field}, value: ${value}`);
    setConfig(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const addFeature = () => {
    console.log('Adding feature...');
    setConfig(prev => ({
      ...prev,
      features: [...prev.features, { emoji: '⭐', title: '', description: '' }]
    }));
  };

  const removeFeature = (index: number) => {
    console.log(`Removing feature ${index}`);
    setConfig(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, field: string, value: any) => {
    console.log(`Updating button ${index}, field: ${field}, value: ${value}`);
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) =>
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const addButton = () => {
    console.log('🔧 Adding button...');
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { 
        text: 'New Button', 
        type: 'primary' as const, 
        target: '',
        linkType: 'custom' as const
      }]
    }));
  };

  const removeButton = (index: number) => {
    console.log(`Removing button ${index}`);
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden" aria-describedby="cover-page-description">
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
            <DialogDescription id="cover-page-description">
              Create and customize professional cover pages with templates, branding, and interactive elements.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="template" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="buttons">Actions</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="positioning">Spacing</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
              <TabsTrigger value="seo">SEO & Analytics</TabsTrigger>
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
                       onClick={() => loadTemplate(template.id as 'gold' | 'platinum' | 'original')}
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
                         <div className={`h-20 rounded-lg ${template.preview} border relative overflow-hidden`}>
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                           <div className="absolute bottom-2 left-2 text-xs font-medium opacity-75">
                             {config.variant === template.id && "✓ Active Template"}
                           </div>
                         </div>
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
                             <div className="flex gap-2">
                               <Select
                                 value={feature.emoji}
                                 onValueChange={(value) => updateFeature(index, 'emoji', value)}
                               >
                                 <SelectTrigger className="w-20">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="z-[9999] bg-background border shadow-lg max-h-48">
                                   {COMMON_EMOJIS.map((emoji) => (
                                     <SelectItem key={emoji} value={emoji}>
                                       {emoji}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <Input
                                 value={feature.emoji}
                                 onChange={(e) => updateFeature(index, 'emoji', e.target.value)}
                                 placeholder="⭐"
                                 className="w-16 text-center"
                               />
                             </div>
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
                   <Label>Action Buttons (Max 2)</Label>
                   <Button 
                     size="sm" 
                     onClick={addButton}
                     disabled={config.buttons.length >= 2}
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     Add Button {config.buttons.length < 2 && `(${2 - config.buttons.length} remaining)`}
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
                               <SelectContent className="z-[9999] bg-background border shadow-lg">
                                 <SelectItem value="primary">Primary</SelectItem>
                                 <SelectItem value="secondary">Secondary</SelectItem>
                                 <SelectItem value="tertiary">Tertiary</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="col-span-2">
                             <Label>Link Assignment</Label>
                             <div className="grid grid-cols-2 gap-2">
                               <Select
                                 value={button.linkType || 'custom'}
                                 onValueChange={(value) => {
                                   updateButton(index, 'linkType', value);
                                   if (value === 'delivery_app' && !button.target.startsWith('/app/')) {
                                     updateButton(index, 'target', '');
                                   }
                                 }}
                               >
                                 <SelectTrigger>
                                   <SelectValue placeholder="Link type" />
                                 </SelectTrigger>
                                 <SelectContent className="z-[9999] bg-background border shadow-lg">
                                   <SelectItem value="custom">Custom URL</SelectItem>
                                   <SelectItem value="delivery_app">Delivery App</SelectItem>
                                 </SelectContent>
                               </Select>
                               
                               {button.linkType === 'delivery_app' ? (
                                 <Select
                                   value={button.deliveryAppId || ''}
                                   onValueChange={(value) => {
                                     const selectedApp = deliveryApps.find(app => app.id === value);
                                     if (selectedApp) {
                                       updateButton(index, 'deliveryAppId', value);
                                       updateButton(index, 'target', `/app/${selectedApp.app_slug}`);
                                     }
                                   }}
                                 >
                                   <SelectTrigger>
                                     <SelectValue placeholder="Select app" />
                                   </SelectTrigger>
                                   <SelectContent className="z-[9999] bg-background border shadow-lg max-h-48 overflow-y-auto">
                                     {deliveryApps.map((app) => (
                                       <SelectItem key={app.id} value={app.id}>
                                         {app.app_name}
                                       </SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               ) : (
                                 <Input
                                   value={button.target}
                                   onChange={(e) => updateButton(index, 'target', e.target.value)}
                                   placeholder="https://example.com or /page"
                                 />
                               )}
                             </div>
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

              {/* Typography Configuration */}
              <TabsContent value="typography" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Title Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title Size</Label>
                        <Select
                          value={config.typography?.titleSize || 'text-4xl md:text-5xl'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, titleSize: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="text-2xl md:text-3xl">Small (2xl/3xl)</SelectItem>
                            <SelectItem value="text-3xl md:text-4xl">Medium (3xl/4xl)</SelectItem>
                            <SelectItem value="text-4xl md:text-5xl">Large (4xl/5xl)</SelectItem>
                            <SelectItem value="text-5xl md:text-6xl">XL (5xl/6xl)</SelectItem>
                            <SelectItem value="text-6xl md:text-7xl">XXL (6xl/7xl)</SelectItem>
                            <SelectItem value="text-7xl md:text-8xl">XXXL (7xl/8xl)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Title Color (Custom)</Label>
                        <Input
                          value={config.typography?.titleColor || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, titleColor: e.target.value }
                          }))}
                          placeholder="#000000 (leave empty for theme default)"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subtitle Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Subtitle Size</Label>
                        <Select
                          value={config.typography?.subtitleSize || 'text-xl'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, subtitleSize: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="text-sm">Small</SelectItem>
                            <SelectItem value="text-base">Base</SelectItem>
                            <SelectItem value="text-lg">Large</SelectItem>
                            <SelectItem value="text-xl">XL</SelectItem>
                            <SelectItem value="text-2xl">XXL</SelectItem>
                            <SelectItem value="text-3xl">XXXL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subtitle Color (Custom)</Label>
                        <Input
                          value={config.typography?.subtitleColor || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, subtitleColor: e.target.value }
                          }))}
                          placeholder="#666666 (leave empty for theme default)"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Font Family</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Font Family</Label>
                        <Select
                          value={config.typography?.fontFamily || 'inherit'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, fontFamily: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="inherit">Default (Inherit)</SelectItem>
                            <SelectItem value="font-sans">Sans Serif</SelectItem>
                            <SelectItem value="font-serif">Serif</SelectItem>
                            <SelectItem value="font-mono">Monospace</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Logo Sizing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Logo Width</Label>
                        <Select
                          value={config.logoSizing?.width || '5rem'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            logoSizing: { ...prev.logoSizing, width: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="3rem">Small (3rem)</SelectItem>
                            <SelectItem value="4rem">Medium (4rem)</SelectItem>
                            <SelectItem value="5rem">Large (5rem) - Default</SelectItem>
                            <SelectItem value="6rem">XL (6rem)</SelectItem>
                            <SelectItem value="8rem">XXL (8rem)</SelectItem>
                            <SelectItem value="10rem">XXXL (10rem)</SelectItem>
                            <SelectItem value="12rem">Huge (12rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Logo Height</Label>
                        <Select
                          value={config.logoSizing?.height || '5rem'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            logoSizing: { ...prev.logoSizing, height: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="3rem">Small (3rem)</SelectItem>
                            <SelectItem value="4rem">Medium (4rem)</SelectItem>
                            <SelectItem value="5rem">Large (5rem) - Default</SelectItem>
                            <SelectItem value="6rem">XL (6rem)</SelectItem>
                            <SelectItem value="8rem">XXL (8rem)</SelectItem>
                            <SelectItem value="10rem">XXXL (10rem)</SelectItem>
                            <SelectItem value="12rem">Huge (12rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Positioning Controls */}
              <TabsContent value="positioning" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Logo Top Margin</Label>
                        <Select
                          value={config.positioning?.logoMarginTop || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, logoMarginTop: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Logo Bottom Margin</Label>
                        <Select
                          value={config.positioning?.logoMarginBottom || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, logoMarginBottom: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Title Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title Top Margin</Label>
                        <Select
                          value={config.positioning?.titleMarginTop || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, titleMarginTop: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Title Bottom Margin</Label>
                        <Select
                          value={config.positioning?.titleMarginBottom || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, titleMarginBottom: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subtitle Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Subtitle Top Margin</Label>
                        <Select
                          value={config.positioning?.subtitleMarginTop || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, subtitleMarginTop: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subtitle Bottom Margin</Label>
                        <Select
                          value={config.positioning?.subtitleMarginBottom || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, subtitleMarginBottom: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                            <SelectItem value="1rem">Medium (1rem)</SelectItem>
                            <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                            <SelectItem value="2rem">XL (2rem)</SelectItem>
                            <SelectItem value="3rem">XXL (3rem)</SelectItem>
                            <SelectItem value="4rem">XXXL (4rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Features & Buttons Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Features Top Margin</Label>
                        <Select
                          value={config.positioning?.featuresMarginTop || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, featuresMarginTop: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="1rem">Small (1rem)</SelectItem>
                            <SelectItem value="2rem">Medium (2rem)</SelectItem>
                            <SelectItem value="3rem">Large (3rem)</SelectItem>
                            <SelectItem value="4rem">XL (4rem)</SelectItem>
                            <SelectItem value="6rem">XXL (6rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Buttons Top Margin</Label>
                        <Select
                          value={config.positioning?.buttonsMarginTop || '0'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            positioning: { ...prev.positioning, buttonsMarginTop: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0)</SelectItem>
                            <SelectItem value="1rem">Small (1rem)</SelectItem>
                            <SelectItem value="2rem">Medium (2rem)</SelectItem>
                            <SelectItem value="3rem">Large (3rem)</SelectItem>
                            <SelectItem value="4rem">XL (4rem)</SelectItem>
                            <SelectItem value="6rem">XXL (6rem)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Advanced Styling */}
              <TabsContent value="styling" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Primary Color</Label>
                        <Input
                          value={config.customColors?.primary || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            customColors: { ...prev.customColors, primary: e.target.value }
                          }))}
                          placeholder="#3b82f6"
                        />
                      </div>
                      <div>
                        <Label>Secondary Color</Label>
                        <Input
                          value={config.customColors?.secondary || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            customColors: { ...prev.customColors, secondary: e.target.value }
                          }))}
                          placeholder="#8b5cf6"
                        />
                      </div>
                      <div>
                        <Label>Accent Color</Label>
                        <Input
                          value={config.customColors?.accent || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            customColors: { ...prev.customColors, accent: e.target.value }
                          }))}
                          placeholder="#f59e0b"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Background Overlay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.backgroundOverlay?.enabled || false}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            backgroundOverlay: { ...prev.backgroundOverlay, enabled: checked }
                          }))}
                        />
                        <Label>Enable Background Overlay</Label>
                      </div>
                      <div>
                        <Label>Overlay Color</Label>
                        <Input
                          value={config.backgroundOverlay?.color || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            backgroundOverlay: { ...prev.backgroundOverlay, color: e.target.value }
                          }))}
                          placeholder="#000000"
                        />
                      </div>
                      <div>
                        <Label>Overlay Opacity</Label>
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={config.backgroundOverlay?.opacity || 0.5}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            backgroundOverlay: { ...prev.backgroundOverlay, opacity: parseFloat(e.target.value) }
                          }))}
                        />
                        <span className="text-sm text-muted-foreground">{config.backgroundOverlay?.opacity || 0.5}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Typography</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title Size</Label>
                        <Select
                          value={config.typography?.titleSize || 'text-4xl md:text-5xl'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, titleSize: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-3xl md:text-4xl">Small</SelectItem>
                            <SelectItem value="text-4xl md:text-5xl">Medium</SelectItem>
                            <SelectItem value="text-5xl md:text-6xl">Large</SelectItem>
                            <SelectItem value="text-6xl md:text-7xl">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Font Family</Label>
                        <Select
                          value={config.typography?.fontFamily || 'font-sans'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            typography: { ...prev.typography, fontFamily: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="font-sans">Sans Serif</SelectItem>
                            <SelectItem value="font-serif">Serif</SelectItem>
                            <SelectItem value="font-mono">Monospace</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Animations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.animations?.enabled || true}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            animations: { ...prev.animations, enabled: checked }
                          }))}
                        />
                        <Label>Enable Animations</Label>
                      </div>
                      <div>
                        <Label>Animation Speed</Label>
                        <Select
                          value={config.animations?.speed || 'normal'}
                          onValueChange={(value) => setConfig(prev => ({ 
                            ...prev, 
                            animations: { ...prev.animations, speed: value as any }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* SEO & Analytics */}
              <TabsContent value="seo" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>SEO Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          value={config.seo?.metaDescription || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, metaDescription: e.target.value }
                          }))}
                          placeholder="A concise description for search engines"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Keywords</Label>
                        <Input
                          value={config.seo?.keywords || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, keywords: e.target.value }
                          }))}
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                      <div>
                        <Label>Open Graph Image URL</Label>
                        <Input
                          value={config.seo?.ogImage || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, ogImage: e.target.value }
                          }))}
                          placeholder="https://example.com/og-image.jpg"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics & Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Google Analytics Code</Label>
                        <Input
                          value={config.analytics?.trackingCode || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            analytics: { ...prev.analytics, trackingCode: e.target.value }
                          }))}
                          placeholder="G-XXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <Label>Conversion Pixel</Label>
                        <Textarea
                          value={config.analytics?.conversionPixel || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            analytics: { ...prev.analytics, conversionPixel: e.target.value }
                          }))}
                          placeholder="Facebook Pixel or other tracking code"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Content Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Publish Date</Label>
                        <Input
                          type="datetime-local"
                          value={config.scheduling?.publishAt || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            scheduling: { ...prev.scheduling, publishAt: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Unpublish Date</Label>
                        <Input
                          type="datetime-local"
                          value={config.scheduling?.unpublishAt || ''}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            scheduling: { ...prev.scheduling, unpublishAt: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
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
                  customColors={config.customColors}
                  typography={config.typography}
                  logoSizing={config.logoSizing}
                  positioning={config.positioning}
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
            customColors={config.customColors}
            typography={config.typography}
            logoSizing={config.logoSizing}
            positioning={config.positioning}
            onClose={() => setPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};