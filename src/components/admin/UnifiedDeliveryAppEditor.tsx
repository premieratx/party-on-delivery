import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Eye, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Palette,
  Settings,
  Plus,
  Trash2,
  Move,
  Type,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CANONICAL_DOMAIN } from '@/utils/links';
import Draggable from 'react-draggable';

const DELIVERY_THEMES = {
  modern: {
    name: 'Modern',
    colors: { 
      primary: '#0ea5e9', 
      secondary: '#06b6d4', 
      accent: '#3b82f6',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      text: '#1e293b'
    }
  },
  vibrant: {
    name: 'Vibrant',
    colors: { 
      primary: '#ef4444', 
      secondary: '#f97316', 
      accent: '#eab308',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      text: '#7f1d1d'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#a855f7', 
      accent: '#c084fc',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      text: '#581c87'
    }
  },
  professional: {
    name: 'Professional',
    colors: { 
      primary: '#1f2937', 
      secondary: '#374151', 
      accent: '#6b7280',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      text: '#111827'
    }
  }
};

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)', family: 'Inter, sans-serif' },
  { value: 'Roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', family: 'Open Sans, sans-serif' },
  { value: 'Lato', label: 'Lato', family: 'Lato, sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'Poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', family: 'Playfair Display, serif' },
  { value: 'Merriweather', label: 'Merriweather', family: 'Merriweather, serif' }
];

const DEVICE_CONFIGS = {
  mobile: { name: 'Mobile', width: 375, height: 667, className: 'w-[375px] h-[667px]' },
  tablet: { name: 'Tablet', width: 768, height: 1024, className: 'w-[450px] h-[600px]' },
  desktop: { name: 'Desktop', width: 1200, height: 800, className: 'w-[750px] h-[500px]' }
};

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  hero_heading?: string;
  hero_subheading?: string;
  hero_scrolling_text?: string;
  collections_config?: any;
  start_screen_config?: any;
  main_app_config?: any;
  post_checkout_config?: any;
  is_active: boolean;
  is_homepage: boolean;
  theme?: string;
  styles?: any;
}

interface UnifiedDeliveryAppEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig | null;
  onSaved?: () => void;
}

export const UnifiedDeliveryAppEditor: React.FC<UnifiedDeliveryAppEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  // Device and theme state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);
  const [saving, setSaving] = useState(false);

  // New styling controls
  const [headlineSize, setHeadlineSize] = useState(20);
  const [logoSize, setLogoSize] = useState(64);
  const [subheadlineSize, setSubheadlineSize] = useState(14);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [headlineFont, setHeadlineFont] = useState('Inter');
  const [headlineColor, setHeadlineColor] = useState('#000000');
  const [subheadlineFont, setSubheadlineFont] = useState('Inter');
  const [subheadlineColor, setSubheadlineColor] = useState('#666666');

  // Collections state
  const [collections, setCollections] = useState([
    { name: 'Beer', collection_handle: 'beer' },
    { name: 'Wine', collection_handle: 'wine' },
    { name: 'Spirits', collection_handle: 'spirits' },
    { name: 'Mixers', collection_handle: 'mixers' },
    { name: 'Snacks', collection_handle: 'snacks' }
  ]);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!initial?.id;
  
  const computedSlug = useMemo(() => {
    return appSlug || appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }, [appSlug, appName]);

  useEffect(() => {
    if (!open) return;
    
    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setLogoUrl(initial.logo_url || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_homepage ?? false);
      setSelectedTheme(initial.theme || 'modern');
      
      // Load styling controls from styles object
      const styles = initial.styles || {};
      setHeadlineSize(styles.headlineSize || 20);
      setLogoSize(styles.logoSize || 64);
      setSubheadlineSize(styles.subheadlineSize || 14);
      setBackgroundImage(styles.backgroundImage || '');
      setOverlayOpacity(styles.overlayOpacity || 50);
      setOverlayColor(styles.overlayColor || '#000000');
      setHeadlineFont(styles.headlineFont || 'Inter');
      setHeadlineColor(styles.headlineColor || '#000000');
      setSubheadlineFont(styles.subheadlineFont || 'Inter');
      setSubheadlineColor(styles.subheadlineColor || '#666666');
      
      if (initial.collections_config?.tabs) {
        setCollections(initial.collections_config.tabs);
      }
    } else {
      // Reset for new app
      setAppName('');
      setAppSlug('');
      setLogoUrl('');
      setHeroHeading('Welcome to Our Store');
      setHeroSubheading('Premium delivery service');
      
      setIsActive(true);
      setIsHomepage(false);
      setSelectedTheme('modern');
      
      // Reset styling controls to defaults
      setHeadlineSize(20);
      setLogoSize(64);
      setSubheadlineSize(14);
      setBackgroundImage('');
      setOverlayOpacity(50);
      setOverlayColor('#000000');
      setHeadlineFont('Inter');
      setHeadlineColor('#000000');
      setSubheadlineFont('Inter');
      setSubheadlineColor('#666666');
    }
  }, [open, initial]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `delivery-app-${computedSlug}-logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
      return null;
    }
  };

  const uploadBackground = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `delivery-app-${computedSlug}-bg.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Background upload failed:', error);
      toast({ title: 'Background upload failed', variant: 'destructive' });
      return null;
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = await uploadLogo(file);
    if (url) {
      setLogoUrl(url);
      toast({ title: 'Logo uploaded successfully!' });
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = await uploadBackground(file);
    if (url) {
      setBackgroundImage(url);
      toast({ title: 'Background uploaded successfully!' });
    }
  };

  const handleSave = async () => {
    if (!appName || !computedSlug) {
      toast({ title: 'Missing required fields', description: 'App name is required', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        app_name: appName,
        app_slug: computedSlug,
        logo_url: logoUrl || null,
        is_active: isActive,
        is_homepage: isHomepage,
        collections_config: {
          tab_count: collections.length,
          tabs: collections
        },
        main_app_config: {
          hero_heading: heroHeading,
          hero_subheading: heroSubheading,
          logo_url: logoUrl
        },
        start_screen_config: {
          enabled: false,
          title: appName,
          subtitle: heroSubheading,
          logo_url: logoUrl
        },
        post_checkout_config: {
          heading: 'Order Confirmed!',
          subheading: 'Thank you for your order!'
        },
        custom_post_checkout_config: {
          enabled: false,
          title: '',
          message: '',
          background_color: '#ffffff',
          text_color: '#000000'
        },
        styles: {
          theme: selectedTheme,
          headlineSize: headlineSize,
          logoSize: logoSize,
          subheadlineSize: subheadlineSize,
          backgroundImage: backgroundImage,
          overlayOpacity: overlayOpacity,
          overlayColor: overlayColor,
          headlineFont: headlineFont,
          headlineColor: headlineColor,
          subheadlineFont: subheadlineFont,
          subheadlineColor: subheadlineColor
        }
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('delivery_app_variations').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('delivery_app_variations').insert(payload);
        if (error) throw error;
      }

      toast({ title: 'Saved successfully!' });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({ title: 'Save failed', description: error?.message || 'Unknown error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addCollection = () => {
    setCollections([...collections, { name: 'New Category', collection_handle: 'new-category' }]);
  };

  const removeCollection = (index: number) => {
    setCollections(collections.filter((_, i) => i !== index));
  };

  const updateCollection = (index: number, field: 'name' | 'collection_handle', value: string) => {
    const updated = [...collections];
    updated[index] = { ...updated[index], [field]: value };
    setCollections(updated);
  };

  const renderPreview = () => {
    const theme = DELIVERY_THEMES[selectedTheme as keyof typeof DELIVERY_THEMES];
    const device = DEVICE_CONFIGS[activeDevice];

    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Device Frame */}
        <div className="flex items-center space-x-2 mb-4">
          {Object.entries(DEVICE_CONFIGS).map(([key, config]) => (
            <Button
              key={key}
              variant={activeDevice === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
            >
              {key === 'mobile' && <Smartphone className="w-4 h-4 mr-1" />}
              {key === 'tablet' && <Tablet className="w-4 h-4 mr-1" />}
              {key === 'desktop' && <Monitor className="w-4 h-4 mr-1" />}
              {config.name}
            </Button>
          ))}
        </div>

        {/* Preview Frame */}
        <div 
          className={`${device.className} border-2 border-gray-300 rounded-lg overflow-y-auto shadow-lg bg-white relative max-h-[80vh]`}
          style={{ 
            background: backgroundImage 
              ? `url(${backgroundImage})` 
              : theme.colors.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Background Overlay */}
          {backgroundImage && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: overlayColor,
                opacity: overlayOpacity / 100
              }}
            />
          )}
          
          {/* App Header */}
          <div className="p-4 text-center relative z-10" style={{ color: theme.colors.text }}>
            {logoUrl && (
              <Draggable bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
                <div className="absolute cursor-move">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="object-contain rounded-lg resize-handle"
                    style={{ 
                      width: `${logoSize}px`,
                      height: `${logoSize}px`,
                      minWidth: '32px',
                      minHeight: '32px',
                      maxWidth: '128px',
                      maxHeight: '128px'
                    }}
                  />
                </div>
              </Draggable>
            )}
            <div className={logoUrl ? 'mt-20' : ''}>
              <h1 
                className="font-bold mb-2" 
                style={{ 
                  color: headlineColor,
                  fontSize: `${headlineSize}px`,
                  fontFamily: FONT_OPTIONS.find(f => f.value === headlineFont)?.family || 'Inter, sans-serif'
                }}
              >
                {heroHeading || 'Welcome to Our Store'}
              </h1>
              <p 
                className="opacity-80"
                style={{ 
                  fontSize: `${subheadlineSize}px`,
                  color: subheadlineColor,
                  fontFamily: FONT_OPTIONS.find(f => f.value === subheadlineFont)?.family || 'Inter, sans-serif'
                }}
              >
                {heroSubheading || 'Premium delivery service'}
              </p>
            </div>
          </div>

          {/* Category Tabs Preview */}
          <div className="px-4 pb-4">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {collections.map((collection, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs border"
                  style={{ 
                    borderColor: theme.colors.primary,
                    backgroundColor: idx === 0 ? theme.colors.primary : 'transparent',
                    color: idx === 0 ? 'white' : theme.colors.primary
                  }}
                >
                  {collection.name}
                </div>
              ))}
            </div>
          </div>

          {/* Sample Products Grid */}
          <div className="px-4 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg p-2 shadow-sm border">
                <div className="w-full h-20 bg-gray-200 rounded mb-2"></div>
                <div className="text-xs font-medium">Sample Product {item}</div>
                <div className="text-xs text-gray-500">$19.99</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !appName}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Panel */}
            <div className="w-[400px] border-r flex-shrink-0 overflow-y-auto">
              <div className="p-4">
                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="collections">Categories</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label>App Name *</Label>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="My Delivery App"
                      />
                    </div>
                    
                    <div>
                      <Label>App Slug</Label>
                      <Input
                        value={appSlug}
                        onChange={(e) => setAppSlug(e.target.value)}
                        placeholder="my-delivery-app"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        URL: {CANONICAL_DOMAIN}/{computedSlug}
                      </div>
                    </div>

                    <div>
                      <Label>Logo</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                      {logoUrl && (
                        <div className="mt-2">
                          <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded border" />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Hero Heading</Label>
                      <Input
                        value={heroHeading}
                        onChange={(e) => setHeroHeading(e.target.value)}
                        placeholder="Welcome to Our Store"
                      />
                    </div>

                    <div>
                      <Label>Hero Subheading</Label>
                      <Input
                        value={heroSubheading}
                        onChange={(e) => setHeroSubheading(e.target.value)}
                        placeholder="Premium delivery service"
                      />
                    </div>


                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <Label>Active</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isHomepage}
                          onCheckedChange={setIsHomepage}
                        />
                        <Label>Set as Homepage</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(DELIVERY_THEMES).map(([key, theme]) => (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedTheme === key ? 'border-primary' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedTheme(key)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <span className="text-sm font-medium">{theme.name}</span>
                            </div>
                            <div 
                              className="w-full h-6 rounded text-xs flex items-center justify-center text-white"
                              style={{ background: theme.colors.background }}
                            >
                              Preview
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Size Controls */}
                    <div className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Headline Size: {headlineSize}px
                        </Label>
                        <Slider
                          value={[headlineSize]}
                          onValueChange={(value) => setHeadlineSize(value[0])}
                          min={14}
                          max={32}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Logo Size: {logoSize}px
                        </Label>
                        <Slider
                          value={[logoSize]}
                          onValueChange={(value) => setLogoSize(value[0])}
                          min={32}
                          max={128}
                          step={4}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Subheadline Size: {subheadlineSize}px
                        </Label>
                        <Slider
                          value={[subheadlineSize]}
                          onValueChange={(value) => setSubheadlineSize(value[0])}
                          min={10}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Background Controls */}
                    <div className="space-y-4">
                      <div>
                        <Label>Background Image</Label>
                        <Button
                          variant="outline"
                          onClick={() => backgroundInputRef.current?.click()}
                          className="w-full mt-2"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Background
                        </Button>
                        {backgroundImage && (
                          <div className="mt-2">
                            <img src={backgroundImage} alt="Background" className="w-full h-20 object-cover rounded border" />
                          </div>
                        )}
                      </div>

                      {backgroundImage && (
                        <>
                          <div>
                            <Label>Overlay Opacity: {overlayOpacity}%</Label>
                            <Slider
                              value={[overlayOpacity]}
                              onValueChange={(value) => setOverlayOpacity(value[0])}
                              min={0}
                              max={100}
                              step={5}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>Overlay Color</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="color"
                                value={overlayColor}
                                onChange={(e) => setOverlayColor(e.target.value)}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={overlayColor}
                                onChange={(e) => setOverlayColor(e.target.value)}
                                className="flex-1"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Typography Controls */}
                    <div className="space-y-4">
                      <div>
                        <Label>Headline Font</Label>
                        <Select value={headlineFont} onValueChange={setHeadlineFont}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: font.family }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Headline Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="color"
                            value={headlineColor}
                            onChange={(e) => setHeadlineColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={headlineColor}
                            onChange={(e) => setHeadlineColor(e.target.value)}
                            className="flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Subheadline Font</Label>
                        <Select value={subheadlineFont} onValueChange={setSubheadlineFont}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: font.family }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Subheadline Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="color"
                            value={subheadlineColor}
                            onChange={(e) => setSubheadlineColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={subheadlineColor}
                            onChange={(e) => setSubheadlineColor(e.target.value)}
                            className="flex-1"
                            placeholder="#666666"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="collections" className="space-y-4">
                    <div>
                      <Label>Product Categories</Label>
                      <div className="space-y-2 mt-2">
                        {collections.map((collection, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <Label className="font-semibold text-sm">Category {idx + 1}</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCollection(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">Display Name</Label>
                                <Input
                                  value={collection.name}
                                  onChange={(e) => updateCollection(idx, 'name', e.target.value)}
                                  placeholder="Category Name"
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Collection Handle</Label>
                                <Input
                                  value={collection.collection_handle}
                                  onChange={(e) => updateCollection(idx, 'collection_handle', e.target.value)}
                                  placeholder="collection-handle"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={addCollection}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};