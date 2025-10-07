import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CoverStartScreen from '@/components/cover-pages/CoverStartScreen';
import { EnhancedFigmaTemplateLibrary } from "./EnhancedFigmaTemplateLibrary";
import { AnimatedCoverPreview } from "./AnimatedCoverPreview";
import { MobileFirstCoverPreview } from "./MobileFirstCoverPreview";
import { CANONICAL_DOMAIN } from "@/utils/links";
import Draggable from 'react-draggable';
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  Upload, 
  Save, 
  Eye, 
  RotateCcw, 
  Download,
  FileImage,
  FileVideo,
  Palette,
  Type,
  Layout,
  Settings,
  Plus,
  Trash2,
  Move,
  Wand2,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Enhanced Theme System
const COVER_THEMES = {
  original: {
    name: 'Original Blue',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    textColor: '#ffffff',
    subtitleColor: '#e2e8f0',
    buttonBg: '#ffffff',
    buttonText: '#667eea',
    buttonOutline: '#667eea',
    buttonOutlineText: '#667eea',
    glowColor: 'rgba(102, 126, 234, 0.3)',
    particles: false,
    particleColor: '#667eea'
  },
  gold: {
    name: 'Luxury Gold',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
    primaryColor: '#F5B800',
    secondaryColor: '#FFD700',
    textColor: '#F5B800',
    subtitleColor: '#CCCCCC',
    buttonBg: '#F5B800',
    buttonText: '#000000',
    buttonOutline: '#F5B800',
    buttonOutlineText: '#F5B800',
    glowColor: 'rgba(245, 184, 0, 0.4)',
    particles: true,
    particleColor: '#F5B800'
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
    buttonOutline: '#BDC3C7',
    buttonOutlineText: '#BDC3C7',
    glowColor: 'rgba(189, 195, 199, 0.3)',
    particles: false,
    particleColor: '#BDC3C7'
  },
  ocean: {
    name: 'Ocean Depth',
    background: 'linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #0083b0 100%)',
    primaryColor: '#00d4ff',
    secondaryColor: '#0077be',
    textColor: '#ffffff',
    subtitleColor: '#b3e5fc',
    buttonBg: '#00d4ff',
    buttonText: '#0077be',
    buttonOutline: '#00d4ff',
    buttonOutlineText: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.3)',
    particles: true,
    particleColor: '#00d4ff'
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
    buttonOutline: '#ffffff',
    buttonOutlineText: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.4)',
    particles: false,
    particleColor: '#ffffff'
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
    buttonOutline: '#a8e6cf',
    buttonOutlineText: '#a8e6cf',
    glowColor: 'rgba(168, 230, 207, 0.3)',
    particles: false,
    particleColor: '#a8e6cf'
  }
};

// Enhanced device configurations with proper mobile scaling
const DEVICE_CONFIGS = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    previewWidth: 800,
    previewHeight: 600,
    className: 'w-full max-w-4xl mx-auto'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    previewWidth: 460,
    previewHeight: 614,
    className: 'mx-auto rounded-xl'
  },
  iphone14: {
    name: 'iPhone 14 Pro',
    icon: Smartphone,
    width: 393,
    height: 852,
    previewWidth: 393,
    previewHeight: 700,
    className: 'mx-auto rounded-[2.5rem]'
  },
  galaxyS23: {
    name: 'Galaxy S23',
    icon: Smartphone,
    width: 360,
    height: 780,
    previewWidth: 360,
    previewHeight: 640,
    className: 'mx-auto rounded-[2rem]'
  }
};

// Types
export type CoverButtonType = 'delivery_app' | 'checkout' | 'url' | 'concierge_app'
export interface CoverButtonConfig {
  text: string;
  type: CoverButtonType;
  app_slug?: string;
  openCart?: boolean;
  url?: string;
  bg_color?: string;
  text_color?: string;
  affiliate_code?: string;
  free_shipping?: boolean;
  markup_percent?: number;
  prefill_enabled?: boolean;
  prefill_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    instructions?: string;
  };
  offset_y?: number;
  spacing_below?: number;
  style: 'filled' | 'outline';
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
  affiliate_id?: string;
  affiliate_slug?: string;
  theme?: keyof typeof COVER_THEMES;
  styles?: { 
    title_size?: number; 
    subtitle_size?: number; 
    checklist_size?: number; 
    title_font?: string;
    subtitle_font?: string;
    spacing_y?: number;
    background_color?: string;
    title_offset_y?: number;
    subtitle_offset_y?: number;
    checklist_offset_y?: number;
    buttons_offset_y?: number;
    buttons_bottom_offset?: number;
    buttons_spacing?: number;
    checklist_to_buttons_offset?: number;
    dot_spacing?: number;
    dot_size?: number;
    logo_offset_y?: number;
    logo_bg_color?: string;
    logo_bg_mode?: 'auto' | 'rectangle' | 'none';
    element_positions?: DraggableElement[];
    theme?: string;
    // NEW: Animation properties
    entrance_animation?: boolean;
    animation_duration?: number;
  };
  is_default_homepage?: boolean;
  flow_name?: string;
  is_multi_flow?: boolean;
  free_shipping_enabled?: boolean;
}

interface DraggableElement {
  id: string;
  type: 'logo' | 'title' | 'subtitle' | 'checklist' | 'buttons';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface UnifiedCoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
  embedded?: boolean;
}

const slugify = (s: string) => s
  .toLowerCase()
  .replace(/[^a-z0-9\-\s]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/\-+/g, "-");

export const UnifiedCoverPageEditor: React.FC<UnifiedCoverPageEditorProps> = ({ 
  open, 
  onOpenChange, 
  initial, 
  onSaved,
  embedded = false
}) => {
  const isEditing = !!initial?.id;
  const { toast } = useToast();

  // Core state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('iphone14');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COVER_THEMES>('gold');
  const [previewMode, setPreviewMode] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);

  // Form state with better defaults for new cover pages
  const [slug, setSlug] = useState(initial?.slug || "");
  const [title, setTitle] = useState(initial?.title || "Elite Concierge");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "Luxury Lifestyle Services");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(initial?.logo_height ?? 120);
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["Premium Alcohol Delivery", "White-Glove Service", "Exclusive Member Access"]);
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(initial?.buttons || [
    { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
    { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
  ]);

  // Enhanced positioning and sizing controls - optimized for fixed iPhone frame (390x844)
  // Centered positioning with all elements visible in frame by default - ADJUSTED FOR SINGLE SCREEN
  const [titleSize, setTitleSize] = useState<number>(initial?.styles?.title_size ?? 24);
  const [subtitleSize, setSubtitleSize] = useState<number>(initial?.styles?.subtitle_size ?? 14);
  const [checklistSize, setChecklistSize] = useState<number>(initial?.styles?.checklist_size ?? 12);
  const [titleFont, setTitleFont] = useState<string>(initial?.styles?.title_font ?? 'system-ui');
  const [subtitleFont, setSubtitleFont] = useState<string>(initial?.styles?.subtitle_font ?? 'system-ui');
  const [titleOffsetY, setTitleOffsetY] = useState<number>(initial?.styles?.title_offset_y ?? -30);
  const [subtitleOffsetY, setSubtitleOffsetY] = useState<number>(initial?.styles?.subtitle_offset_y ?? -10);
  const [checklistOffsetY, setChecklistOffsetY] = useState<number>(initial?.styles?.checklist_offset_y ?? 10);
  const [buttonsOffsetY, setButtonsOffsetY] = useState<number>(initial?.styles?.buttons_offset_y ?? 0);
  const [logoOffsetY, setLogoOffsetY] = useState<number>(initial?.styles?.logo_offset_y ?? -40);
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState<boolean>(initial?.free_shipping_enabled ?? false);
  const [templateData, setTemplateData] = useState<any>(null);

  // NEW: Entrance Animation Controls
  const [entranceAnimation, setEntranceAnimation] = useState<boolean>(initial?.styles?.entrance_animation ?? false);
  const [animationDuration, setAnimationDuration] = useState<number>(initial?.styles?.animation_duration ?? 2000);

  // Element positions for drag mode
  const [elementPositions, setElementPositions] = useState<DraggableElement[]>([
    { id: 'logo', type: 'logo', x: 50, y: 20 },
    { id: 'title', type: 'title', x: 50, y: 35 },
    { id: 'subtitle', type: 'subtitle', x: 50, y: 45 },
    { id: 'checklist', type: 'checklist', x: 50, y: 55 },
    { id: 'buttons', type: 'buttons', x: 50, y: 75 }
  ]);

  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form management
  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugOk, setSlugOk] = useState(true);

  const computedSlug = useMemo(() => slugify(slug || title), [slug, title]);

  useEffect(() => {
    if (!open && !embedded) return;
    
    console.log('🔄 Loading initial data:', initial);
    
    if (initial) {
      setSelectedTheme((initial.theme as keyof typeof COVER_THEMES) || 'gold');
      setSlug(initial.slug || "");
      setTitle(initial.title || "");
      setSubtitle(initial.subtitle || "");
      setLogoUrl(initial.logo_url || "");
      setLogoHeight(initial.logo_height || 160);
      setBgImageUrl(initial.bg_image_url || "");
      setBgVideoUrl(initial.bg_video_url || "");
      setChecklist(Array.isArray(initial.checklist) ? initial.checklist : ["Premium Alcohol Delivery", "White-Glove Service", "Exclusive Member Access"]);
      setButtons(Array.isArray(initial.buttons) ? initial.buttons : [
        { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
        { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
      ]);
      
      // Load positioning controls
      setTitleSize(initial.styles?.title_size ?? 48);
      setSubtitleSize(initial.styles?.subtitle_size ?? 20);
      setChecklistSize(initial.styles?.checklist_size ?? 16);
      setTitleFont(initial.styles?.title_font ?? 'system-ui');
      setSubtitleFont(initial.styles?.subtitle_font ?? 'system-ui');
      setTitleOffsetY(initial.styles?.title_offset_y ?? 0);
      setSubtitleOffsetY(initial.styles?.subtitle_offset_y ?? 0);
      setChecklistOffsetY(initial.styles?.checklist_offset_y ?? 0);
      setButtonsOffsetY(initial.styles?.buttons_offset_y ?? 0);
      setLogoOffsetY(initial.styles?.logo_offset_y ?? 0);
      setIsActive(initial.is_active ?? true);
      setFreeShippingEnabled(initial.free_shipping_enabled ?? false);
      
      // Load animation settings
      setEntranceAnimation(initial.styles?.entrance_animation ?? false);
      setAnimationDuration(initial.styles?.animation_duration ?? 2000);
      
      // Load element positions if available
      if (initial.styles?.element_positions) {
        setElementPositions(initial.styles.element_positions);
      }
    } else {
      // Reset to defaults for new cover page - optimized for fixed iPhone frame
      setSelectedTheme('gold');
      setSlug("");
      setTitle("Elite Concierge");
      setSubtitle("Luxury Lifestyle Services");
      setLogoUrl("");
      setLogoHeight(120); // Reduced for better fit
      setBgImageUrl("");
      setBgVideoUrl("");
      setChecklist(["Premium Alcohol Delivery", "White-Glove Service", "Exclusive Member Access"]);
      setButtons([
        { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
        { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
      ]);
      // Apply optimized positioning defaults for perfect phone frame fit
      setTitleSize(28);           // Slightly smaller for better fit
      setSubtitleSize(16);
      setChecklistSize(14);
      setTitleFont('system-ui');
      setSubtitleFont('system-ui');
      // Centered layout with minimal offsets - all elements now properly contained
      setLogoOffsetY(-20);        // Slight upward adjustment from center
      setTitleOffsetY(-10);       // Title slightly above center
      setSubtitleOffsetY(0);      // Subtitle at center
      setChecklistOffsetY(5);     // Features slightly below center
      setButtonsOffsetY(10);      // Buttons at bottom but visible
      setIsActive(true);
      setFreeShippingEnabled(false);
      
      // Animation defaults
      setEntranceAnimation(false);
      setAnimationDuration(2000);
    }
  }, [open, embedded, initial]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('app_slug, app_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setApps(data || []);
    })();
  }, []);

  const uploadAsset = async (file: File, kind: 'logo' | 'bg'): Promise<string | null> => {
    try {
      console.log(`🔄 Starting upload for ${kind}:`, file.name, file.size, 'bytes');
      const ext = file.name.split('.').pop() || 'png';
      const base = (computedSlug || slugify(title) || 'cover').slice(0, 60);
      const fileName = `cover-${base}-${kind}.${ext}`;
      console.log(`📁 Uploading to cover-assets bucket as: ${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('cover-assets').getPublicUrl(fileName);
      console.log('✅ Upload successful! Public URL:', data.publicUrl);
      toast({ title: 'Upload successful!', description: `${kind} uploaded successfully` });
      return data.publicUrl;
    } catch (e: any) {
      console.error('❌ Upload failed:', e);
      toast({ title: 'Upload failed', description: e?.message || 'Try a smaller image', variant: 'destructive' });
      return null;
    }
  };

  const handleFileUpload = (type: 'background' | 'logo') => {
    const input = type === 'background' ? fileInputRef.current : logoInputRef.current;
    if (!input) return;
    input.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadAsset(file, type === 'background' ? 'bg' : 'logo');
    if (url) {
      if (type === 'background') {
        if (file.type.startsWith('video/')) {
          setBgVideoUrl(url);
          setBgImageUrl('');
        } else {
          setBgImageUrl(url);
          setBgVideoUrl('');
        }
      } else {
        setLogoUrl(url);
      }
    }
  };

  const addButton = () => setButtons(prev => [...prev, { 
    text: `Button ${prev.length + 1}`, 
    type: 'delivery_app',
    style: 'filled'
  }]);

  const removeButton = (idx: number) => setButtons(prev => prev.filter((_, i) => i !== idx));

  const updateButton = (idx: number, patch: Partial<CoverButtonConfig>) => {
    setButtons(prev => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const handleElementDrag = (elementId: string, position: { x: number; y: number }) => {
    setElementPositions(prev => 
      prev.map(el => el.id === elementId ? { ...el, ...position } : el)
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Missing title', description: 'Please add a title for your cover page', variant: 'destructive' });
      return;
    }

    if (!computedSlug) {
      toast({ title: 'Invalid slug', description: 'Please provide a valid slug', variant: 'destructive' });
      return;
    }

    setSaving(true);
    console.log('🔄 Saving cover page...', { title, slug: computedSlug, isEditing, initialId: initial?.id });
    try {
      // Check for existing slug and auto-increment if needed
      let finalSlug = computedSlug;
      let counter = 1;
      
      while (true) {
        const { data: existing } = await supabase
          .from('cover_pages')
          .select('id')
          .eq('slug', finalSlug)
          .maybeSingle();
        
        // If no existing record, or if we're editing and it's our own record
        if (!existing || (isEditing && initial?.id && existing.id === initial.id)) {
          break;
        }
        
        // If slug exists, try with counter
        finalSlug = `${computedSlug}-${counter}`;
        counter++;
      }
      
      console.log(`💾 Using final slug: ${finalSlug}`);

      // Clean payload - remove unnecessary flow references
      const payload = {
        slug: finalSlug,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        logo_url: logoUrl || null,
        logo_height: logoHeight,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: checklist.filter(item => item.trim()) as any,
        buttons: buttons as any,
        is_active: isActive,
        free_shipping_enabled: freeShippingEnabled,
        theme: selectedTheme,
        styles: {
          element_positions: elementPositions,
          title_size: titleSize,
          subtitle_size: subtitleSize,
          checklist_size: checklistSize,
          title_font: titleFont,
          subtitle_font: subtitleFont,
          // Save device-specific positions
          desktop_title_offset_y: titleOffsetY,
          desktop_subtitle_offset_y: subtitleOffsetY,
          desktop_checklist_offset_y: checklistOffsetY,
          desktop_buttons_offset_y: buttonsOffsetY,
          desktop_logo_offset_y: logoOffsetY,
          tablet_title_offset_y: titleOffsetY,
          tablet_subtitle_offset_y: subtitleOffsetY,
          tablet_checklist_offset_y: checklistOffsetY,
          tablet_buttons_offset_y: buttonsOffsetY,
          tablet_logo_offset_y: logoOffsetY,
          mobile_title_offset_y: titleOffsetY,
          mobile_subtitle_offset_y: subtitleOffsetY,
          mobile_checklist_offset_y: checklistOffsetY,
          mobile_buttons_offset_y: buttonsOffsetY,
          mobile_logo_offset_y: logoOffsetY,
          // Keep legacy fields for backward compatibility
          title_offset_y: titleOffsetY,
          subtitle_offset_y: subtitleOffsetY,
          checklist_offset_y: checklistOffsetY,
          buttons_offset_y: buttonsOffsetY,
          logo_offset_y: logoOffsetY,
          // NEW: Save animation settings
          entrance_animation: entranceAnimation,
          animation_duration: animationDuration,
          theme: selectedTheme
        } as any,
        created_by: 'admin',
        updated_at: new Date().toISOString()
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase
          .from('cover_pages')
          .update(payload)
          .eq('id', initial.id);
        if (error) throw error;
        console.log('✅ Cover page updated successfully');
        toast({ title: 'Success', description: 'Cover page updated successfully' });
      } else {
        const { error, data } = await supabase
          .from('cover_pages')
          .insert(payload)
          .select();
        if (error) throw error;
        console.log('✅ Cover page created successfully:', data);
        toast({ title: 'Success', description: 'Cover page created successfully' });
      }

      onSaved?.();
      if (!embedded) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('❌ Cover page save error:', error);
      toast({ 
        title: 'Save failed', 
        description: error?.message || 'Please check all fields and try again', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="flex h-full overflow-hidden border border-border/50 rounded-lg bg-background/50 backdrop-blur-sm">
      {/* Editor Panel */}
      <div className={`${controlsExpanded ? 'w-1/2' : 'w-16'} border-r border-border/30 transition-all duration-300 bg-card/30`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/30 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                {isEditing ? 'Edit Cover Page' : 'Create Cover Page'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setControlsExpanded(!controlsExpanded)}
              >
                {controlsExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {controlsExpanded && (
            <div className="flex-1 overflow-y-auto p-4">
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                  <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                  <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Elite Concierge"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subtitle" className="text-sm font-medium">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Luxury Lifestyle Services"
                        className="bg-background/50 border-border/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug" className="text-sm font-medium">
                        Custom URL Slug 
                        <Badge variant="secondary" className="ml-2 text-xs">Editable</Badge>
                      </Label>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="Leave empty to auto-generate from title"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Live URL:</strong> {CANONICAL_DOMAIN}/cover/{computedSlug}
                      </p>
                      <p className="text-xs text-slate-500">
                        💡 Tip: Use short, memorable slugs for easier sharing (e.g., "vip-party", "boat-delivery")
                      </p>
                    </div>

                    {/* Checklist */}
                    <div>
                      <Label className="text-sm font-medium">Checklist Items</Label>
                      <div className="space-y-2">
                        {checklist.map((item, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newList = [...checklist];
                                newList[idx] = e.target.value;
                                setChecklist(newList);
                              }}
                              className="bg-background/50 border-border/50 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChecklist(prev => [...prev, 'New item'])}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div>
                      <Label className="text-sm font-medium">Action Buttons</Label>
                      <div className="space-y-3">
                        {buttons.map((button, idx) => (
                          <Card key={idx} className="p-3 bg-muted/20 border-border/30">
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={button.text}
                                  onChange={(e) => updateButton(idx, { text: e.target.value })}
                                  placeholder="Button text"
                                  className="bg-background/50 border-border/50 text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeButton(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={button.type} onValueChange={(value: any) => updateButton(idx, { type: value })}>
                                  <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-border z-50">
                                    <SelectItem value="delivery_app">Delivery App</SelectItem>
                                    <SelectItem value="concierge_app">Concierge App</SelectItem>
                                    <SelectItem value="checkout">Checkout</SelectItem>
                                    <SelectItem value="url">Custom URL</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select value={button.style} onValueChange={(value: any) => updateButton(idx, { style: value })}>
                                  <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="filled">Filled</SelectItem>
                                    <SelectItem value="outline">Outline</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {button.type === 'delivery_app' && (
                                <Select value={button.app_slug} onValueChange={(value) => updateButton(idx, { app_slug: value })}>
                                  <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select app" />
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
                                  onChange={(e) => updateButton(idx, { url: e.target.value })}
                                  placeholder="https://..."
                                  className="bg-background/50 border-border/50 text-sm"
                                />
                              )}
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addButton}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-4">
                  <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Theme</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(COVER_THEMES).map(([key, theme]) => (
                          <Card
                            key={key}
                            className={`cursor-pointer transition-all border-2 ${
                              selectedTheme === key 
                                ? 'border-primary shadow-lg scale-105' 
                                : 'border-border/30 hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTheme(key as keyof typeof COVER_THEMES)}
                          >
                            <div className="p-3">
                              <div
                                className="w-full h-12 rounded mb-2"
                                style={{ background: theme.background }}
                              />
                              <p className="text-xs font-medium">{theme.name}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Assets */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Logo</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileUpload('logo')}
                            className="flex-1"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </Button>
                          {logoUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogoUrl('')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {logoUrl && (
                          <div className="mt-2">
                            <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded border" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Background</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileUpload('background')}
                            className="flex-1"
                          >
                            <FileImage className="w-4 h-4 mr-2" />
                            Upload Media
                          </Button>
                          {(bgImageUrl || bgVideoUrl) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBgImageUrl('');
                                setBgVideoUrl('');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {(bgImageUrl || bgVideoUrl) && (
                          <div className="mt-2">
                            {bgImageUrl && <img src={bgImageUrl} alt="Background" className="h-16 w-full object-cover rounded border" />}
                            {bgVideoUrl && <video src={bgVideoUrl} className="h-16 w-full object-cover rounded border" muted />}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground">Size Controls</h4>
                      
                      <div>
                        <Label className="text-sm font-medium">Logo Size: {logoHeight}px</Label>
                        <Slider
                          value={[logoHeight]}
                          onValueChange={(value) => setLogoHeight(value[0])}
                          max={300}
                          min={30}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Headline Size: {titleSize}px</Label>
                        <Slider
                          value={[titleSize]}
                          onValueChange={(value) => setTitleSize(value[0])}
                          max={72}
                          min={16}
                          step={2}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Subheadline Size: {subtitleSize}px</Label>
                        <Slider
                          value={[subtitleSize]}
                          onValueChange={(value) => setSubtitleSize(value[0])}
                          max={32}
                          min={12}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Checklist Size: {checklistSize}px</Label>
                        <Slider
                          value={[checklistSize]}
                          onValueChange={(value) => setChecklistSize(value[0])}
                          max={24}
                          min={10}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground">Font Controls</h4>
                      
                      <div>
                        <Label className="text-sm font-medium">Headline Font</Label>
                        <Select value={titleFont} onValueChange={setTitleFont}>
                          <SelectTrigger className="bg-background/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system-ui">System UI</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                            <SelectItem value="sans-serif">Sans Serif</SelectItem>
                            <SelectItem value="monospace">Monospace</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Subheadline Font</Label>
                        <Select value={subtitleFont} onValueChange={setSubtitleFont}>
                          <SelectTrigger className="bg-background/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system-ui">System UI</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                            <SelectItem value="sans-serif">Sans Serif</SelectItem>
                            <SelectItem value="monospace">Monospace</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Positioning Controls - Universal */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground">Position Controls</h4>
                      
                      <div>
                        <Label className="text-sm font-medium">Logo Position: {logoOffsetY}px from top</Label>
                        <Slider
                          value={[logoOffsetY]}
                          onValueChange={(value) => setLogoOffsetY(value[0])}
                          max={200}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Headline Position: {titleOffsetY}px from center</Label>
                        <Slider
                          value={[titleOffsetY]}
                          onValueChange={(value) => setTitleOffsetY(value[0])}
                          max={200}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Subheadline Position: {subtitleOffsetY}px from center</Label>
                        <Slider
                          value={[subtitleOffsetY]}
                          onValueChange={(value) => setSubtitleOffsetY(value[0])}
                          max={200}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Checklist Position: {checklistOffsetY}px from center</Label>
                        <Slider
                          value={[checklistOffsetY]}
                          onValueChange={(value) => setChecklistOffsetY(value[0])}
                          max={200}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Buttons Position: {buttonsOffsetY}px from bottom</Label>
                        <Slider
                          value={[buttonsOffsetY]}
                          onValueChange={(value) => setButtonsOffsetY(value[0])}
                          max={200}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Enhanced Figma Templates Tab */}
                <TabsContent value="templates" className="space-y-4">
                  <EnhancedFigmaTemplateLibrary 
                    category="cover_page"
                    onSelectTemplate={(template) => {
                      // Apply Figma template silently
                      setTemplateData(template);
                      
                      // Apply template data to form
                      if (template.design_data) {
                        const data = template.design_data;
                        
                        // Apply theme if available
                        if (data.theme && COVER_THEMES[data.theme as keyof typeof COVER_THEMES]) {
                          setSelectedTheme(data.theme as keyof typeof COVER_THEMES);
                        }
                        
                        // Apply content from elements
                        if (data.elements) {
                          const titleElement = data.elements.find((el: any) => el.id === 'title');
                          const subtitleElement = data.elements.find((el: any) => el.id === 'subtitle');
                          const checklistElement = data.elements.find((el: any) => el.id === 'checklist');
                          
                          if (titleElement?.content) setTitle(titleElement.content);
                          if (subtitleElement?.content) setSubtitle(subtitleElement.content);
                          if (checklistElement?.items) setChecklist(checklistElement.items);
                        }
                      }
                      
                      toast({ 
                        title: 'Template Applied!', 
                        description: `Successfully applied ${template.name} with animations and styling.` 
                      });
                    }}
                  />
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Active</Label>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Free Shipping</Label>
                      <Switch
                        checked={freeShippingEnabled}
                        onCheckedChange={setFreeShippingEnabled}
                      />
                    </div>

                    {/* NEW: Entrance Animation Controls */}
                    <div className="space-y-4 pt-4 border-t border-border/30">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Entrance Animations
                      </Label>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Enable Sequential Animation</Label>
                          <p className="text-xs text-muted-foreground">Logo → Title → Subtitle → Features → Buttons</p>
                        </div>
                        <Switch
                          checked={entranceAnimation}
                          onCheckedChange={setEntranceAnimation}
                        />
                      </div>

                      {entranceAnimation && (
                        <div>
                          <Label className="text-sm font-medium">
                            Animation Duration: {animationDuration}ms
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Total time for all elements to animate in
                          </p>
                          <Slider
                            value={[animationDuration]}
                            onValueChange={(value) => setAnimationDuration(value[0])}
                            max={5000}
                            min={1000}
                            step={250}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>

                    {/* Removed drag mode - elements are centered with vertical positioning only */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 border-t border-border/30 bg-muted/20">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setFullscreenPreview(true)}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-gradient-to-br from-muted/30 to-background/30 pl-6 pr-6 pb-6">
        <div className="h-full flex flex-col pt-2">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h4 className="text-sm font-medium text-muted-foreground">
              Live Preview • Universal Cover
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant={previewMode ? "default" : "secondary"} className="text-xs">
                {previewMode ? 'Preview Mode' : 'Edit Mode'}
              </Badge>
              {/* Removed drag mode indicator */}
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center py-8">
            <div className="w-[393px] h-[852px] transition-all duration-300 shadow-2xl bg-black relative border border-gray-700">
              <div className="absolute inset-0 overflow-hidden">
                <CoverStartScreen
                title={title}
                subtitle={subtitle}
                logoUrl={logoUrl}
                logoHeight={logoHeight}
                backgroundImageUrl={bgImageUrl}
                backgroundVideoUrl={bgVideoUrl}
                checklistItems={checklist}
                buttons={buttons.map(btn => ({
                  text: btn.text,
                  bgColor: btn.style === 'filled' ? undefined : 'transparent',
                  textColor: btn.style === 'outline' ? '#FFFFFF' : undefined,
                  onClick: () => console.log(`Button clicked: ${btn.text}`)
                }))}
                titleSize={titleSize}
                subtitleSize={subtitleSize}
                checklistSize={checklistSize}
                titleFont={titleFont}
                subtitleFont={subtitleFont}
                backgroundColor={COVER_THEMES[selectedTheme]?.background}
                entranceAnimation={entranceAnimation}
                animationDuration={animationDuration}
                logoOffsetY={logoOffsetY}
                titleOffsetY={titleOffsetY}
                subtitleOffsetY={subtitleOffsetY}
                checklistOffsetY={checklistOffsetY}
                buttonsOffsetY={buttonsOffsetY}
              />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => handleFileChange(e, 'background')}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'logo')}
        className="hidden"
      />
    </div>
  );

  // Fullscreen Preview Modal
  if (fullscreenPreview) {
    return (
      <Dialog open={fullscreenPreview} onOpenChange={setFullscreenPreview}>
        <DialogContent className="max-w-screen-xl h-[90vh] p-0 border-2 border-border/50" aria-describedby="dialog-description">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border/30 bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fullscreen Preview</h3>
                <Button variant="ghost" onClick={() => setFullscreenPreview(false)}>
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center p-4">
              <div className="w-[393px] h-[852px] relative overflow-hidden border border-gray-700 shadow-2xl bg-black">
                <CoverStartScreen
                title={title}
                subtitle={subtitle}
                logoUrl={logoUrl}
                logoHeight={logoHeight}
                backgroundImageUrl={bgImageUrl}
                backgroundVideoUrl={bgVideoUrl}
                checklistItems={checklist}
                buttons={buttons.map(btn => ({
                  text: btn.text,
                  bgColor: btn.style === 'filled' ? undefined : 'transparent',
                  textColor: btn.style === 'outline' ? '#FFFFFF' : undefined,
                  onClick: () => console.log(`Button clicked: ${btn.text}`)
                }))}
                titleSize={titleSize}
                subtitleSize={subtitleSize}
                checklistSize={checklistSize}
                titleFont={titleFont}
                subtitleFont={subtitleFont}
                backgroundColor={COVER_THEMES[selectedTheme]?.background}
                entranceAnimation={entranceAnimation}
                animationDuration={animationDuration}
                logoOffsetY={logoOffsetY}
                titleOffsetY={titleOffsetY}
                subtitleOffsetY={subtitleOffsetY}
                checklistOffsetY={checklistOffsetY}
                buttonsOffsetY={buttonsOffsetY}
              />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return embedded ? content : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-2xl h-[95vh] p-0 border-2 border-border/50" aria-describedby="dialog-description">
        <DialogHeader className="p-6 border-b border-border/30 bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="w-6 h-6 text-primary animate-pulse" />
            Enhanced Cover Page Creator
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Create stunning cover pages with advanced animations, Figma templates, and professional designs
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
