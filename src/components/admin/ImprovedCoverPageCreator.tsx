import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Save, 
  Eye, 
  Upload,
  Palette,
  Type,
  Layout,
  Settings,
  Smartphone,
  Monitor,
  Tablet,
  Image as ImageIcon,
  Video,
  Sparkles,
  Trash2,
  Copy,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import CoverStartScreen from '@/components/custom-delivery/CoverStartScreen';

// Enhanced theme system with more options
const COVER_THEMES = {
  luxury: {
    name: 'Luxury Gold',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
    primaryColor: '#F5B800',
    secondaryColor: '#FFD700',
    textColor: '#F5B800',
    subtitleColor: '#CCCCCC',
    buttonBg: '#F5B800',
    buttonText: '#000000',
    glowColor: 'rgba(245, 184, 0, 0.4)'
  },
  ocean: {
    name: 'Ocean Blue',
    background: 'linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #0083b0 100%)',
    primaryColor: '#00d4ff',
    secondaryColor: '#0077be',
    textColor: '#ffffff',
    subtitleColor: '#b3e5fc',
    buttonBg: '#00d4ff',
    buttonText: '#0077be',
    glowColor: 'rgba(0, 212, 255, 0.3)'
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)',
    primaryColor: '#ffffff',
    secondaryColor: '#ff6b6b',
    textColor: '#ffffff',
    subtitleColor: '#ffe8e8',
    buttonBg: '#ffffff',
    buttonText: '#ff6b6b',
    glowColor: 'rgba(255, 255, 255, 0.4)'
  },
  forest: {
    name: 'Forest Green',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    primaryColor: '#a8e6cf',
    secondaryColor: '#71b280',
    textColor: '#ffffff',
    subtitleColor: '#d4efdf',
    buttonBg: '#a8e6cf',
    buttonText: '#134e5e',
    glowColor: 'rgba(168, 230, 207, 0.3)'
  },
  platinum: {
    name: 'Modern Platinum',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    primaryColor: '#BDC3C7',
    secondaryColor: '#ECF0F1',
    textColor: '#ECF0F1',
    subtitleColor: '#BDC3C7',
    buttonBg: '#ECF0F1',
    buttonText: '#2c3e50',
    glowColor: 'rgba(189, 195, 199, 0.3)'
  }
};

const DEVICE_CONFIGS = {
  mobile: { name: 'Mobile', icon: Smartphone, width: 375, height: 667, scale: 0.8 },
  tablet: { name: 'Tablet', icon: Tablet, width: 768, height: 1024, scale: 0.5 },
  desktop: { name: 'Desktop', icon: Monitor, width: 1200, height: 800, scale: 0.4 }
};

export interface CoverButtonConfig {
  text: string;
  type: 'delivery_app' | 'checkout' | 'url';
  app_slug?: string;
  url?: string;
  style: 'filled' | 'outline';
  bg_color?: string;
  text_color?: string;
}

export interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: CoverButtonConfig[];
  is_active: boolean;
  theme?: keyof typeof COVER_THEMES;
  styles?: {
    title_size?: number;
    subtitle_size?: number;
    checklist_size?: number;
  };
  is_default_homepage?: boolean;
}

interface ImprovedCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

export const ImprovedCoverPageCreator: React.FC<ImprovedCoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const isEditing = !!initial?.id;
  const { toast } = useToast();

  // State management
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COVER_THEMES>('luxury');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [slug, setSlug] = useState(initial?.slug || '');
  const [title, setTitle] = useState(initial?.title || 'Elite Concierge');
  const [subtitle, setSubtitle] = useState(initial?.subtitle || 'Luxury Lifestyle Services');
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '');
  const [logoHeight, setLogoHeight] = useState<number>(initial?.logo_height ?? 160);
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || '');
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || '');
  const [checklist, setChecklist] = useState<string[]>(
    initial?.checklist || ['Premium Alcohol Delivery', 'White-Glove Service', 'Exclusive Member Access']
  );
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(
    initial?.buttons || [
      { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
      { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
    ]
  );
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  // Available delivery apps
  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);

  // Load delivery apps
  useEffect(() => {
    if (!open) return;
    
    (async () => {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('app_slug, app_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setApps(data || []);
    })();
  }, [open]);

  // Initialize with provided data
  useEffect(() => {
    if (!open) return;
    setSelectedTheme(initial?.theme || 'luxury');
    setTitle(initial?.title || 'Elite Concierge');
    setSubtitle(initial?.subtitle || 'Luxury Lifestyle Services');
    setLogoUrl(initial?.logo_url || '');
    setBgImageUrl(initial?.bg_image_url || '');
    setBgVideoUrl(initial?.bg_video_url || '');
    setChecklist(initial?.checklist || ['Premium Alcohol Delivery', 'White-Glove Service', 'Exclusive Member Access']);
    setButtons(initial?.buttons || [
      { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
      { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
    ]);
  }, [open, initial]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const coverPageData = {
        slug: slug || slugify(title),
        title,
        subtitle,
        logo_url: logoUrl,
        logo_height: logoHeight,
        bg_image_url: bgImageUrl,
        bg_video_url: bgVideoUrl,
        checklist: checklist as any,
        buttons: buttons as any,
        is_active: isActive,
        theme: selectedTheme,
        styles: {
          title_size: 48,
          subtitle_size: 24,
          checklist_size: 18
        }
      };

      let result;
      if (isEditing && initial?.id) {
        result = await supabase
          .from('cover_pages')
          .update(coverPageData)
          .eq('id', initial.id);
      } else {
        result = await supabase
          .from('cover_pages')
          .insert(coverPageData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Cover page ${isEditing ? 'updated' : 'created'} successfully`
      });
      
      sonnerToast.success(`Cover page ${isEditing ? 'updated' : 'created'} successfully!`);
      onSaved?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving cover page:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cover page',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addButton = () => {
    setButtons(prev => [...prev, { 
      text: `Button ${prev.length + 1}`, 
      type: 'delivery_app',
      style: 'filled'
    }]);
  };

  const removeButton = (idx: number) => {
    setButtons(prev => prev.filter((_, i) => i !== idx));
  };

  const updateButton = (idx: number, patch: Partial<CoverButtonConfig>) => {
    setButtons(prev => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addChecklistItem = () => {
    setChecklist(prev => [...prev, 'New Feature']);
  };

  const removeChecklistItem = (idx: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== idx));
  };

  const updateChecklistItem = (idx: number, value: string) => {
    setChecklist(prev => prev.map((item, i) => (i === idx ? value : item)));
  };

  const applyTheme = (theme: keyof typeof COVER_THEMES) => {
    setSelectedTheme(theme);
    sonnerToast.success(`Applied ${COVER_THEMES[theme].name} theme!`);
  };

  const slugify = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\-+/g, '-');

  const renderPreview = () => {
    const device = DEVICE_CONFIGS[activeDevice];
    const theme = COVER_THEMES[selectedTheme];
    
    return (
      <div className="flex justify-center p-4">
        <div 
          className="border-2 border-muted rounded-lg overflow-hidden shadow-xl relative"
          style={{
            width: device.width * device.scale,
            height: device.height * device.scale,
            background: theme.background
          }}
        >
          <div 
            className="border-2 border-muted rounded-lg overflow-hidden shadow-xl relative bg-gradient-to-br from-gray-900 to-black"
            style={{
              width: device.width * device.scale,
              height: device.height * device.scale,
              background: theme.background
            }}
          >
            <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              {/* Logo */}
              {logoUrl && (
                <div className="flex justify-center">
                  <img src={logoUrl} alt="Logo" style={{ height: logoHeight * device.scale }} className="object-contain" />
                </div>
              )}
              
              {/* Title */}
              <h1 
                className="font-bold text-center"
                style={{ 
                  color: theme.textColor,
                  fontSize: 32 * device.scale,
                  textShadow: theme.glowColor ? `0 0 20px ${theme.glowColor}` : 'none'
                }}
              >
                {title}
              </h1>
              
              {/* Subtitle */}
              {subtitle && (
                <p 
                  className="text-center"
                  style={{ 
                    color: theme.subtitleColor,
                    fontSize: 18 * device.scale
                  }}
                >
                  {subtitle}
                </p>
              )}
              
              {/* Checklist */}
              {checklist.length > 0 && (
                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-center gap-2"
                      style={{ 
                        color: theme.subtitleColor,
                        fontSize: 14 * device.scale
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Buttons */}
              {buttons.length > 0 && (
                <div className="flex gap-3 justify-center">
                  {buttons.slice(0, 2).map((button, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105"
                      style={{
                        backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
                        color: button.style === 'filled' ? theme.buttonText : theme.primaryColor,
                        border: button.style === 'outline' ? `2px solid ${theme.primaryColor}` : 'none',
                        fontSize: 12 * device.scale
                      }}
                    >
                      {button.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <div className="flex h-full">
          {/* Left Panel - Configuration */}
          <div className="w-96 border-r bg-card flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {isEditing ? 'Edit Cover Page' : 'Create Cover Page'}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (!slug) setSlug(slugify(e.target.value));
                        }}
                        placeholder="Elite Concierge"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Luxury Lifestyle Services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Page Slug</Label>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="elite-concierge"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        URL: /{slug || slugify(title)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active">Active</Label>
                      <Switch
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Theme & Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(COVER_THEMES).map(([key, theme]) => (
                        <Button
                          key={key}
                          variant={selectedTheme === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyTheme(key as keyof typeof COVER_THEMES)}
                          className="h-auto p-2 flex flex-col items-center gap-1"
                        >
                          <div 
                            className="w-full h-6 rounded"
                            style={{ background: theme.background }}
                          />
                          <span className="text-xs">{theme.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Media Assets */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Media Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="logo_url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="logo_height">Logo Height: {logoHeight}px</Label>
                      <Slider
                        id="logo_height"
                        min={80}
                        max={300}
                        step={10}
                        value={[logoHeight]}
                        onValueChange={(value) => setLogoHeight(value[0])}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bg_image_url">Background Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bg_image_url"
                          value={bgImageUrl}
                          onChange={(e) => setBgImageUrl(e.target.value)}
                          placeholder="https://example.com/bg.jpg"
                        />
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bg_video_url">Background Video URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bg_video_url"
                          value={bgVideoUrl}
                          onChange={(e) => setBgVideoUrl(e.target.value)}
                          placeholder="https://example.com/bg.mp4"
                        />
                        <Button variant="outline" size="sm">
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Feature List
                      <Badge variant="secondary">{checklist.length}</Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addChecklistItem} className="ml-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateChecklistItem(index, e.target.value)}
                          placeholder="Feature description"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChecklistItem(index)}
                          disabled={checklist.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Action Buttons
                      <Badge variant="secondary">{buttons.length}</Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addButton} className="ml-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {buttons.map((button, index) => (
                      <div key={index} className="p-3 border rounded space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Button {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeButton(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            value={button.text}
                            onChange={(e) => updateButton(index, { text: e.target.value })}
                            placeholder="Button Text"
                          />
                          
                          <Select
                            value={button.type}
                            onValueChange={(value: 'delivery_app' | 'checkout' | 'url') => 
                              updateButton(index, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delivery_app">Delivery App</SelectItem>
                              <SelectItem value="url">Custom URL</SelectItem>
                              <SelectItem value="checkout">Direct Checkout</SelectItem>
                            </SelectContent>
                          </Select>

                          {button.type === 'delivery_app' && (
                            <Select
                              value={button.app_slug || ''}
                              onValueChange={(value) => updateButton(index, { app_slug: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select App" />
                              </SelectTrigger>
                              <SelectContent>
                                {apps.map((app) => (
                                  <SelectItem key={app.app_slug} value={app.app_slug}>
                                    {app.app_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {button.type === 'url' && (
                            <Input
                              value={button.url || ''}
                              onChange={(e) => updateButton(index, { url: e.target.value })}
                              placeholder="https://example.com"
                            />
                          )}

                          <Select
                            value={button.style}
                            onValueChange={(value: 'filled' | 'outline') => 
                              updateButton(index, { style: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="filled">Filled</SelectItem>
                              <SelectItem value="outline">Outline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Save Button */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update' : 'Create'} Page
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/${slug || slugify(title)}`, '_blank')}
                  disabled={!title}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="flex-1 bg-muted/20 flex flex-col">
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Live Preview</h3>
                <div className="flex items-center gap-2">
                  {Object.entries(DEVICE_CONFIGS).map(([key, device]) => {
                    const Icon = device.icon;
                    return (
                      <Button
                        key={key}
                        variant={activeDevice === key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">{device.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {renderPreview()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};