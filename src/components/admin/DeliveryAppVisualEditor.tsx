import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Upload, Type, Settings, Save, Loader2, Eye, Video, Play, Pause, Smartphone, Tablet, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryAppHeroConfig {
  // Basic content
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  
  // Logo customization
  logoUrl: string;
  logoSize: number;
  logoVerticalPosition: number;
  
  // Headline styling
  headlineSize: number;
  headlineColor: string;
  headlineFont: string;
  headlineStyle: {
    bold: boolean;
    italic: boolean;
    underlined: boolean;
  };
  headlineVerticalPosition: number;
  
  // Sub-headline styling
  subheadlineSize: number;
  subheadlineColor: string;
  subheadlineFont: string;
  subheadlineStyle: {
    bold: boolean;
    italic: boolean;
    underlined: boolean;
  };
  subheadlineVerticalPosition: number;
  
  // Scrolling text
  scrollingText: string;
  scrollingTextSize: number;
  scrollingTextColor: string;
  scrollingTextFont: string;
  scrollingTextStyle: {
    bold: boolean;
    italic: boolean;
    underlined: boolean;
  };
  scrollingTextVerticalPosition: number;
  scrollingTextSpeed: number; // typing animation speed
  
  // Background
  backgroundType: 'image' | 'video' | 'gif';
  backgroundUrl: string;
  
  // Tabs and app config
  collections_config: any;
  tabs: any[];
  is_active: boolean;
  is_homepage: boolean;
}

interface DeliveryAppVisualEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (Default)' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'oswald', label: 'Oswald' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'roboto', label: 'Roboto' },
];

const DEVICE_CONFIGS = {
  mobile: { width: 375, height: 812, name: 'iPhone' },      // iPhone 12/13/14 standard
  tablet: { width: 768, height: 1024, name: 'iPad' },       // Standard iPad
  desktop: { width: 1366, height: 768, name: 'Laptop' }     // Most common laptop resolution
};

const ScrollingTextComponent: React.FC<{
  text: string;
  speed: number;
  style: any;
  className?: string;
}> = ({ text, speed, style, className }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    if (!text || !isAnimating) {
      setDisplayText(text);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= text.length) {
          return 0; // Reset animation
        }
        return prev + 1;
      });
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed, isAnimating]);
  
  useEffect(() => {
    setDisplayText(text.slice(0, currentIndex));
  }, [currentIndex, text]);
  
  return (
    <div className={`${className}`} style={style}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  );
};

export const DeliveryAppVisualEditor: React.FC<DeliveryAppVisualEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('desktop');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hero configuration state
  const [config, setConfig] = useState<DeliveryAppHeroConfig>({
    appName: '',
    heroHeading: '',
    heroSubheading: '',
    logoUrl: '',
    logoSize: 64,
    logoVerticalPosition: 0,
    headlineSize: 48,
    headlineColor: '#ffffff',
    headlineFont: 'inter',
    headlineStyle: { bold: true, italic: false, underlined: false },
    headlineVerticalPosition: 0,
    subheadlineSize: 20,
    subheadlineColor: '#e2e8f0',
    subheadlineFont: 'inter',
    subheadlineStyle: { bold: false, italic: false, underlined: false },
    subheadlineVerticalPosition: 0,
    scrollingText: 'Fast delivery • Premium quality • Satisfaction guaranteed',
    scrollingTextSize: 16,
    scrollingTextColor: '#fbbf24',
    scrollingTextFont: 'inter',
    scrollingTextStyle: { bold: false, italic: false, underlined: false },
    scrollingTextVerticalPosition: 0,
    scrollingTextSpeed: 100,
    backgroundType: 'image',
    backgroundUrl: '',
    collections_config: {},
    tabs: [],
    is_active: true,
    is_homepage: false
  });

  // Load initial data
  useEffect(() => {
    if (initial && open) {
      const heroConfig = initial.hero_config || {};
      setConfig({
        appName: initial.app_name || '',
        heroHeading: initial.main_app_config?.hero_heading || '',
        heroSubheading: initial.main_app_config?.hero_subheading || '',
        logoUrl: initial.logo_url || '',
        logoSize: heroConfig.logoSize || 64,
        logoVerticalPosition: heroConfig.logoVerticalPosition || 0,
        headlineSize: heroConfig.headlineSize || 48,
        headlineColor: heroConfig.headlineColor || '#ffffff',
        headlineFont: heroConfig.headlineFont || 'inter',
        headlineStyle: heroConfig.headlineStyle || { bold: true, italic: false, underlined: false },
        headlineVerticalPosition: heroConfig.headlineVerticalPosition || 0,
        subheadlineSize: heroConfig.subheadlineSize || 20,
        subheadlineColor: heroConfig.subheadlineColor || '#e2e8f0',
        subheadlineFont: heroConfig.subheadlineFont || 'inter',
        subheadlineStyle: heroConfig.subheadlineStyle || { bold: false, italic: false, underlined: false },
        subheadlineVerticalPosition: heroConfig.subheadlineVerticalPosition || 0,
        scrollingText: heroConfig.scrollingText || 'Fast delivery • Premium quality • Satisfaction guaranteed',
        scrollingTextSize: heroConfig.scrollingTextSize || 16,
        scrollingTextColor: heroConfig.scrollingTextColor || '#fbbf24',
        scrollingTextFont: heroConfig.scrollingTextFont || 'inter',
        scrollingTextStyle: heroConfig.scrollingTextStyle || { bold: false, italic: false, underlined: false },
        scrollingTextVerticalPosition: heroConfig.scrollingTextVerticalPosition || 0,
        scrollingTextSpeed: heroConfig.scrollingTextSpeed || 100,
        backgroundType: heroConfig.backgroundType || 'image',
        backgroundUrl: heroConfig.backgroundUrl || '',
        collections_config: initial.collections_config || {},
        tabs: initial.collections_config?.tabs || [],
        is_active: initial.is_active ?? true,
        is_homepage: initial.is_homepage ?? false
      });
    }
  }, [initial, open]);

  const updateConfig = (updates: Partial<DeliveryAppHeroConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateTextStyle = (textType: 'headline' | 'subheadline' | 'scrollingText', property: keyof DeliveryAppHeroConfig['headlineStyle'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [`${textType}Style`]: {
        ...prev[`${textType}Style` as keyof DeliveryAppHeroConfig],
        [property]: value
      }
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type based on context
    const isValidFile = type === 'logo' 
      ? file.type.startsWith('image/')
      : file.type.startsWith('image/') || file.type.startsWith('video/');

    if (!isValidFile) {
      toast({
        title: "Invalid file type",
        description: type === 'logo' ? "Please select an image file for logo" : "Please select an image or video file",
        variant: "destructive"
      });
      return;
    }

    // File size limit (10MB for videos, 5MB for images)
    const maxSize = file.type.startsWith('video/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxSize / (1024 * 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        updateConfig({ logoUrl: urlData.publicUrl });
      } else {
        const bgType = file.type.startsWith('video/') ? 'video' : 
                     file.name.toLowerCase().includes('.gif') ? 'gif' : 'image';
        updateConfig({ 
          backgroundUrl: urlData.publicUrl,
          backgroundType: bgType as 'image' | 'video' | 'gif'
        });
      }
      
      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Background'} uploaded successfully`
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    console.log('🔥 SAVE DEBUG - About to save with config:', {
      heroHeading: config.heroHeading,
      heroSubheading: config.heroSubheading,
      appName: config.appName
    });
    
    if (!config.appName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the app name",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: config.appName,
        app_slug: initial?.app_slug || config.appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        main_app_config: {
          hero_heading: config.heroHeading,
          hero_subheading: config.heroSubheading,
          logo_size: config.logoSize,
          headline_size: config.headlineSize,
          subheadline_size: config.subheadlineSize,
          logo_vertical_pos: config.logoVerticalPosition,
          headline_vertical_pos: config.headlineVerticalPosition,
          subheadline_vertical_pos: config.subheadlineVerticalPosition,
          headline_font: config.headlineFont,
          headline_color: config.headlineColor,
          subheadline_font: config.subheadlineFont,
          subheadline_color: config.subheadlineColor,
          background_image_url: config.backgroundUrl,
          background_opacity: 50
        },
        logo_url: config.logoUrl,
        hero_config: {
          logoSize: config.logoSize,
          logoVerticalPosition: config.logoVerticalPosition,
          headlineSize: config.headlineSize,
          headlineColor: config.headlineColor,
          headlineFont: config.headlineFont,
          headlineStyle: config.headlineStyle,
          headlineVerticalPosition: config.headlineVerticalPosition,
          subheadlineSize: config.subheadlineSize,
          subheadlineColor: config.subheadlineColor,
          subheadlineFont: config.subheadlineFont,
          subheadlineStyle: config.subheadlineStyle,
          subheadlineVerticalPosition: config.subheadlineVerticalPosition,
          scrollingText: config.scrollingText,
          scrollingTextSize: config.scrollingTextSize,
          scrollingTextColor: config.scrollingTextColor,
          scrollingTextFont: config.scrollingTextFont,
          scrollingTextStyle: config.scrollingTextStyle,
          scrollingTextVerticalPosition: config.scrollingTextVerticalPosition,
          scrollingTextSpeed: config.scrollingTextSpeed,
          backgroundType: config.backgroundType,
          backgroundUrl: config.backgroundUrl
        },
        collections_config: config.collections_config,
        is_active: config.is_active,
        is_homepage: config.is_homepage,
        updated_at: new Date().toISOString()
      };

      if (initial?.id) {
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Delivery app updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert(appData);

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Delivery app created successfully"
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateTextStyle = (type: 'headline' | 'subheadline' | 'scrollingText') => {
    const size = config[`${type}Size` as keyof DeliveryAppHeroConfig] as number;
    const color = config[`${type}Color` as keyof DeliveryAppHeroConfig] as string;
    const font = config[`${type}Font` as keyof DeliveryAppHeroConfig] as string;
    const style = config[`${type}Style` as keyof DeliveryAppHeroConfig] as any;
    const position = config[`${type}VerticalPosition` as keyof DeliveryAppHeroConfig] as number;
    
    return {
      fontSize: `${size}px`,
      color: color,
      fontFamily: font === 'inter' ? 'Inter, sans-serif' : 
                  font === 'playfair' ? 'Playfair Display, serif' :
                  font === 'oswald' ? 'Oswald, sans-serif' :
                  font === 'montserrat' ? 'Montserrat, sans-serif' :
                  font === 'poppins' ? 'Poppins, sans-serif' :
                  font === 'roboto' ? 'Roboto, sans-serif' : 'Inter, sans-serif',
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      textDecoration: style.underlined ? 'underline' : 'none',
      transform: `translateY(${position}px)`
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col" aria-describedby="visual-editor-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {initial ? 'Edit' : 'Create'} Delivery App - Visual Editor
          </DialogTitle>
          <DialogDescription id="visual-editor-description">
            Customize the hero section of your delivery app with visual controls
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6">
          {/* Left Panel - Controls */}
          <div className="w-80 flex-shrink-0">
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="content" className="space-y-6 mt-4">
                  {/* Basic Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Basic Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>App Name</Label>
                        <Input
                          value={config.appName}
                          onChange={(e) => updateConfig({ appName: e.target.value })}
                          placeholder="e.g., Austin Party Delivery"
                        />
                      </div>
                      
                      <div>
                        <Label>Headline</Label>
                        <Input
                          value={config.heroHeading}
                          onChange={(e) => updateConfig({ heroHeading: e.target.value })}
                          placeholder="e.g., Premium Party Delivery"
                        />
                      </div>
                      
                      <div>
                        <Label>Sub-headline</Label>
                        <Input
                          value={config.heroSubheading}
                          onChange={(e) => updateConfig({ heroSubheading: e.target.value })}
                          placeholder="e.g., Fast delivery in 30-60 minutes"
                        />
                      </div>
                      
                      <div>
                        <Label>Scrolling Text</Label>
                        <Input
                          value={config.scrollingText}
                          onChange={(e) => updateConfig({ scrollingText: e.target.value })}
                          placeholder="e.g., Fast delivery • Premium quality"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Logo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={config.logoUrl}
                          onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="hidden"
                      />
                      
                      {config.logoUrl && (
                        <div className="flex items-center gap-2">
                          <img src={config.logoUrl} alt="Logo preview" className="w-8 h-8 object-contain rounded" />
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="design" className="space-y-6 mt-4">
                  {/* Logo Styling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Logo Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Size: {config.logoSize}px</Label>
                        <Slider
                          value={[config.logoSize]}
                          onValueChange={(value) => updateConfig({ logoSize: value[0] })}
                          min={24}
                          max={400}
                          step={4}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Vertical Position: {config.logoVerticalPosition}px</Label>
                        <Slider
                          value={[config.logoVerticalPosition]}
                          onValueChange={(value) => updateConfig({ logoVerticalPosition: value[0] })}
                          min={-100}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Headline Styling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Headline Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Size: {config.headlineSize}px</Label>
                        <Slider
                          value={[config.headlineSize]}
                          onValueChange={(value) => updateConfig({ headlineSize: value[0] })}
                          min={16}
                          max={200}
                          step={2}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.headlineColor}
                            onChange={(e) => updateConfig({ headlineColor: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.headlineColor}
                            onChange={(e) => updateConfig({ headlineColor: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Font</Label>
                        <Select
                          value={config.headlineFont}
                          onValueChange={(value) => updateConfig({ headlineFont: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.headlineStyle.bold}
                            onCheckedChange={(checked) => updateTextStyle('headline', 'bold', checked)}
                          />
                          <Label className="text-sm">Bold</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.headlineStyle.italic}
                            onCheckedChange={(checked) => updateTextStyle('headline', 'italic', checked)}
                          />
                          <Label className="text-sm">Italic</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.headlineStyle.underlined}
                            onCheckedChange={(checked) => updateTextStyle('headline', 'underlined', checked)}
                          />
                          <Label className="text-sm">Underline</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Vertical Position: {config.headlineVerticalPosition}px</Label>
                        <Slider
                          value={[config.headlineVerticalPosition]}
                          onValueChange={(value) => updateConfig({ headlineVerticalPosition: value[0] })}
                          min={-100}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sub-headline Styling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Sub-headline Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Size: {config.subheadlineSize}px</Label>
                        <Slider
                          value={[config.subheadlineSize]}
                          onValueChange={(value) => updateConfig({ subheadlineSize: value[0] })}
                          min={10}
                          max={120}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.subheadlineColor}
                            onChange={(e) => updateConfig({ subheadlineColor: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.subheadlineColor}
                            onChange={(e) => updateConfig({ subheadlineColor: e.target.value })}
                            placeholder="#e2e8f0"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Font</Label>
                        <Select
                          value={config.subheadlineFont}
                          onValueChange={(value) => updateConfig({ subheadlineFont: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.subheadlineStyle.bold}
                            onCheckedChange={(checked) => updateTextStyle('subheadline', 'bold', checked)}
                          />
                          <Label className="text-sm">Bold</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.subheadlineStyle.italic}
                            onCheckedChange={(checked) => updateTextStyle('subheadline', 'italic', checked)}
                          />
                          <Label className="text-sm">Italic</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.subheadlineStyle.underlined}
                            onCheckedChange={(checked) => updateTextStyle('subheadline', 'underlined', checked)}
                          />
                          <Label className="text-sm">Underline</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Vertical Position: {config.subheadlineVerticalPosition}px</Label>
                        <Slider
                          value={[config.subheadlineVerticalPosition]}
                          onValueChange={(value) => updateConfig({ subheadlineVerticalPosition: value[0] })}
                          min={-100}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scrolling Text Styling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Scrolling Text Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Size: {config.scrollingTextSize}px</Label>
                        <Slider
                          value={[config.scrollingTextSize]}
                          onValueChange={(value) => updateConfig({ scrollingTextSize: value[0] })}
                          min={12}
                          max={36}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.scrollingTextColor}
                            onChange={(e) => updateConfig({ scrollingTextColor: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.scrollingTextColor}
                            onChange={(e) => updateConfig({ scrollingTextColor: e.target.value })}
                            placeholder="#fbbf24"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Font</Label>
                        <Select
                          value={config.scrollingTextFont}
                          onValueChange={(value) => updateConfig({ scrollingTextFont: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.scrollingTextStyle.bold}
                            onCheckedChange={(checked) => updateTextStyle('scrollingText', 'bold', checked)}
                          />
                          <Label className="text-sm">Bold</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.scrollingTextStyle.italic}
                            onCheckedChange={(checked) => updateTextStyle('scrollingText', 'italic', checked)}
                          />
                          <Label className="text-sm">Italic</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.scrollingTextStyle.underlined}
                            onCheckedChange={(checked) => updateTextStyle('scrollingText', 'underlined', checked)}
                          />
                          <Label className="text-sm">Underline</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Vertical Position: {config.scrollingTextVerticalPosition}px</Label>
                        <Slider
                          value={[config.scrollingTextVerticalPosition]}
                          onValueChange={(value) => updateConfig({ scrollingTextVerticalPosition: value[0] })}
                          min={-100}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Animation Speed: {config.scrollingTextSpeed}ms</Label>
                        <Slider
                          value={[config.scrollingTextSpeed]}
                          onValueChange={(value) => updateConfig({ scrollingTextSpeed: value[0] })}
                          min={50}
                          max={500}
                          step={25}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Background */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Background</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Background Type</Label>
                        <Select
                          value={config.backgroundType}
                          onValueChange={(value) => updateConfig({ backgroundType: value as 'image' | 'video' | 'gif' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="gif">GIF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          value={config.backgroundUrl}
                          onChange={(e) => updateConfig({ backgroundUrl: e.target.value })}
                          placeholder="https://example.com/background.jpg"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*,video/*';
                            input.onchange = (e) => handleFileUpload(e as any, 'background');
                            input.click();
                          }}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">App Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) => updateConfig({ is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.is_homepage}
                          onCheckedChange={(checked) => updateConfig({ is_homepage: checked })}
                        />
                        <Label>Set as Homepage</Label>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Device Selector */}
            <div className="flex gap-2 mb-4 justify-center">
              {Object.entries(DEVICE_CONFIGS).map(([key, device]) => (
                <Button
                  key={key}
                  variant={activeDevice === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                  className="flex items-center gap-2"
                >
                  {key === 'mobile' && <Smartphone className="w-4 h-4" />}
                  {key === 'tablet' && <Tablet className="w-4 h-4" />}
                  {key === 'desktop' && <Monitor className="w-4 h-4" />}
                  {device.name}
                </Button>
              ))}
            </div>

            {/* Preview Container */}
            <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg p-4">
              <div 
                className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg relative"
                style={{
                  width: DEVICE_CONFIGS[activeDevice].width,
                  height: DEVICE_CONFIGS[activeDevice].height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: activeDevice === 'mobile' ? 'scale(0.9)' :     // iPhone gets better scale
                            activeDevice === 'tablet' ? 'scale(0.75)' :    // iPad fits nicely  
                            'scale(0.55)'                                   // Laptop needs smaller scale
                }}
              >
                {/* Hero Section Preview */}
                <div 
                  className="relative h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Video Background */}
                  {config.backgroundType === 'video' && config.backgroundUrl && (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      src={config.backgroundUrl}
                    />
                  )}
                  
                  {/* Content - Responsive Layout */}
                  <div className={`relative z-10 flex flex-col h-full text-center px-4 ${
                    activeDevice === 'mobile' ? 'py-8' : 
                    activeDevice === 'tablet' ? 'py-12' : 'py-16'
                  }`}>
                    {/* Logo */}
                    {config.logoUrl && (
                      <div 
                        className={`flex-shrink-0 ${
                          activeDevice === 'mobile' ? 'mb-4' : 
                          activeDevice === 'tablet' ? 'mb-6' : 'mb-8'
                        }`}
                        style={{
                          transform: `translateY(${config.logoVerticalPosition * (
                            activeDevice === 'mobile' ? 0.6 : 
                            activeDevice === 'tablet' ? 0.8 : 1
                          )}px)`
                        }}
                      >
                        <img 
                          src={config.logoUrl} 
                          alt={config.appName}
                          className="mx-auto"
                          style={{
                            height: `${config.logoSize * (
                              activeDevice === 'mobile' ? 0.7 : 
                              activeDevice === 'tablet' ? 0.85 : 1
                            )}px`,
                            maxWidth: '80%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Content Container - Flex Grow */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Headline */}
                      {config.heroHeading && (
                        <h1 
                          className={`${
                            activeDevice === 'mobile' ? 'mb-3' : 
                            activeDevice === 'tablet' ? 'mb-4' : 'mb-6'
                          } leading-tight`}
                          style={{
                            ...generateTextStyle('headline'),
                            fontSize: `${config.headlineSize * (
                              activeDevice === 'mobile' ? 0.6 : 
                              activeDevice === 'tablet' ? 0.8 : 1
                            )}px`,
                            transform: `translateY(${config.headlineVerticalPosition * (
                              activeDevice === 'mobile' ? 0.6 : 
                              activeDevice === 'tablet' ? 0.8 : 1
                            )}px)`
                          }}
                        >
                          {config.heroHeading}
                        </h1>
                      )}
                      
                      {/* Sub-headline */}
                      {config.heroSubheading && (
                        <p 
                          className={`${
                            activeDevice === 'mobile' ? 'mb-4' : 
                            activeDevice === 'tablet' ? 'mb-6' : 'mb-8'
                          } leading-relaxed`}
                          style={{
                            ...generateTextStyle('subheadline'),
                            fontSize: `${config.subheadlineSize * (
                              activeDevice === 'mobile' ? 0.7 : 
                              activeDevice === 'tablet' ? 0.85 : 1
                            )}px`,
                            transform: `translateY(${config.subheadlineVerticalPosition * (
                              activeDevice === 'mobile' ? 0.6 : 
                              activeDevice === 'tablet' ? 0.8 : 1
                            )}px)`
                          }}
                        >
                          {config.heroSubheading}
                        </p>
                      )}
                    </div>
                    
                    {/* Scrolling Text - Always at Bottom */}
                    {config.scrollingText && (
                      <div 
                        className={`flex-shrink-0 ${
                          activeDevice === 'mobile' ? 'mt-4' : 
                          activeDevice === 'tablet' ? 'mt-6' : 'mt-8'
                        }`}
                        style={{
                          transform: `translateY(${config.scrollingTextVerticalPosition * (
                            activeDevice === 'mobile' ? 0.6 : 
                            activeDevice === 'tablet' ? 0.8 : 1
                          )}px)`
                        }}
                      >
                        <ScrollingTextComponent
                          text={config.scrollingText}
                          speed={config.scrollingTextSpeed}
                          style={{
                            ...generateTextStyle('scrollingText'),
                            fontSize: `${config.scrollingTextSize * (
                              activeDevice === 'mobile' ? 0.7 : 
                              activeDevice === 'tablet' ? 0.85 : 1
                            )}px`
                          }}
                          className="text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save App
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};