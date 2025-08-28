// ⚠️ DEPRECATED COMPONENT - DO NOT USE ⚠️
// This is an outdated version of the cover page editor.
// Use UnifiedCoverPageEditor instead for all cover page functionality.
// Located at: src/components/admin/UnifiedCoverPageEditor.tsx
//
// This file is kept for reference only and should not be imported.

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
export type CoverButtonType = 'delivery_app' | 'checkout' | 'url'
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

  // Form state
  const [slug, setSlug] = useState(initial?.slug || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(initial?.logo_height ?? 160);
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["Premium Alcohol Delivery", "White-Glove Service", "Exclusive Member Access"]);
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(initial?.buttons || [
    { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
    { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
  ]);
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState<boolean>(initial?.free_shipping_enabled ?? false);
  const [templateData, setTemplateData] = useState<any>(null);

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

  // Debug logging
  console.log('🔍 Cover Editor render - title:', title, 'subtitle:', subtitle, 'previewMode:', previewMode);

  // Form management
  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugOk, setSlugOk] = useState(true);

  const computedSlug = useMemo(() => slugify(slug || title), [slug, title]);

  useEffect(() => {
    if (!open && !embedded) return;
    setSelectedTheme(initial?.theme || 'gold');
    setTitle(initial?.title || "Elite Concierge");
    setSubtitle(initial?.subtitle || "Luxury Lifestyle Services");
    setLogoUrl(initial?.logo_url || "");
    setBgImageUrl(initial?.bg_image_url || "");
    setBgVideoUrl(initial?.bg_video_url || "");
    setChecklist(initial?.checklist || ["Premium Alcohol Delivery", "White-Glove Service", "Exclusive Member Access"]);
    setButtons(initial?.buttons || [
      { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
      { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
    ]);
    setFreeShippingEnabled(initial?.free_shipping_enabled ?? false);
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
      const payload = {
        slug: computedSlug,
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
        theme: selectedTheme || 'default',
        styles: {
          element_positions: elementPositions,
          title_size: 48,
          subtitle_size: 20,
          checklist_size: 16
        } as any,
        created_by: 'admin',
        flow_name: title.trim(),
        flow_description: subtitle.trim() || null
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
    <div className="flex h-full overflow-hidden">
      {/* Editor Panel */}
      <div className={`${previewMode ? 'w-0 overflow-hidden' : 'w-96'} transition-all duration-300 border-r bg-background flex-shrink-0`}>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {/* Page Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Page Settings</Label>
            
            <div>
              <Label className="text-xs">Page Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    console.log('🔄 Main Title changing from:', title, 'to:', e.target.value);
                    setTitle(e.target.value);
                  }}
                  placeholder="Elite Concierge"
                />
            </div>

            <div>
              <Label className="text-xs">Custom Page Slug</Label>
              <div className="space-y-2">
                  <Input
                    value={slug}
                    onChange={(e) => {
                      console.log('🔄 Slug changing from:', slug, 'to:', e.target.value);
                      setSlug(e.target.value);
                    }}
                    placeholder="custom-slug-name"
                    className="text-sm"
                  />
                <div className="text-xs text-muted-foreground">
                  Preview URL: {CANONICAL_DOMAIN}/cover/{computedSlug}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/cover/${computedSlug}`, '_blank')}
                  className="w-full gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Subtitle</Label>
              <div className="space-y-2">
                  <Textarea
                    value={subtitle}
                    onChange={(e) => {
                      console.log('🔄 Subtitle changing from:', subtitle, 'to:', e.target.value);
                      setSubtitle(e.target.value);
                    }}
                    placeholder="Luxury Lifestyle Services"
                    rows={2}
                    className="text-sm"
                  />
                <div>
                  <Label className="text-xs">Width: {subtitle.length > 40 ? 'Full' : 'Auto'}</Label>
                  <div className="text-xs text-muted-foreground">
                    Keep under 40 characters for single line
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Logo Height: {logoHeight}px</Label>
              <Slider
                value={[logoHeight]}
                onValueChange={([value]) => setLogoHeight(value)}
                min={50}
                max={300}
                step={10}
                className="mt-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active" className="text-xs">Active & Published</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="free-shipping"
                checked={freeShippingEnabled}
                onCheckedChange={setFreeShippingEnabled}
              />
              <Label htmlFor="free-shipping" className="text-xs">Enable Free Shipping for this cover page</Label>
            </div>
          </div>

          {/* Device Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Device Preview</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DEVICE_CONFIGS).map(([key, device]) => {
                const Icon = device.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                      activeDevice === key 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <div>{device.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Visual Builder Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Visual Builder</Label>
              <Button
                variant={dragMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDragMode(!dragMode)}
              >
                <Move className="w-4 h-4 mr-2" />
                {dragMode ? 'Exit Drag' : 'Drag Mode'}
              </Button>
            </div>
            {dragMode && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  💡 Drag elements in the preview to reposition them. Click "Exit Drag" when done.
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
            </TabsList>

            {/* Enhanced Figma Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <EnhancedFigmaTemplateLibrary 
                category="cover_page"
                onSelectTemplate={(template) => {
                  // Apply enhanced template with animations
                  const templateData = template.design_data;
                  
                  if (templateData) {
                    // Set theme
                    const themeKey = template.theme as keyof typeof COVER_THEMES;
                    if (themeKey && COVER_THEMES[themeKey]) {
                      setSelectedTheme(themeKey);
                    } else {
                      setSelectedTheme('gold');
                    }
                    
                    // Apply content from template elements
                    const elements = templateData.elements || [];
                    const titleElement = elements.find((e: any) => e.id === 'title');
                    const subtitleElement = elements.find((e: any) => e.id === 'subtitle');
                    const checklistElement = elements.find((e: any) => e.id === 'checklist');
                    const primaryButtonElement = elements.find((e: any) => e.id === 'primary_button');
                    const secondaryButtonElement = elements.find((e: any) => e.id === 'secondary_button');
                    
                    // Apply content
                    if (titleElement?.content) setTitle(titleElement.content);
                    if (subtitleElement?.content) setSubtitle(subtitleElement.content);
                    if (checklistElement?.items) setChecklist(checklistElement.items);
                    
                    // Apply buttons
                    const newButtons: CoverButtonConfig[] = [];
                    if (primaryButtonElement?.content) {
                      newButtons.push({ 
                        text: primaryButtonElement.content, 
                        type: 'delivery_app' as CoverButtonType,
                        style: 'filled' as const
                      });
                    }
                    if (secondaryButtonElement?.content) {
                      newButtons.push({ 
                        text: secondaryButtonElement.content, 
                        type: 'url' as CoverButtonType,
                        url: '#collection',
                        style: 'outline' as const
                      });
                    }
                    if (newButtons.length > 0) setButtons(newButtons);
                    
                    // Apply element positions
                    if (elements.length > 0) {
                      const newPositions = elements
                        .filter((element: any) => element.position)
                        .map((element: any) => ({
                          id: element.id === 'primary_button' || element.id === 'secondary_button' ? 'buttons' : element.id,
                          type: element.id === 'primary_button' || element.id === 'secondary_button' ? 'buttons' : element.type,
                          x: element.position.x || 50,
                          y: element.position.y || 50
                        }));
                      
                      if (newPositions.length > 0) setElementPositions(newPositions);
                    }
                    
                    // Store template data for animations
                    setTemplateData(template);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Page Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="page-slug"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Preview URL: {CANONICAL_DOMAIN}/cover/{computedSlug}
                </div>
              </div>
              
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Elite Concierge"
                />
              </div>
              
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Luxury Lifestyle Services"
                />
              </div>

              <div>
                <Label>Features List</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newChecklist = [...checklist];
                          newChecklist[idx] = e.target.value;
                          setChecklist(newChecklist);
                        }}
                        placeholder={`Feature ${idx + 1}`}
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChecklist([...checklist, ""])}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is-active">Page Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="free-shipping"
                  checked={freeShippingEnabled}
                  onCheckedChange={setFreeShippingEnabled}
                />
                <Label htmlFor="free-shipping">Enable Free Shipping for users from this cover page</Label>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              {/* Enhanced Logo Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  Logo
                </Label>
                
                {logoUrl && (
                  <div className="p-3 bg-muted rounded-lg">
                    <img 
                      src={logoUrl} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain mx-auto border rounded"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Logo URL or upload file below"
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('logo')}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo File
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs">Logo Height: {logoHeight}px</Label>
                  <Slider
                    value={[logoHeight]}
                    onValueChange={([value]) => setLogoHeight(value)}
                    min={50}
                    max={300}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Enhanced Background Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileVideo className="w-4 h-4" />
                  Background
                </Label>
                
                {(bgImageUrl || bgVideoUrl) && (
                  <div className="p-3 bg-muted rounded-lg">
                    {bgVideoUrl ? (
                      <video 
                        src={bgVideoUrl} 
                        className="w-full h-20 object-cover rounded border"
                        muted
                      />
                    ) : (
                      <img 
                        src={bgImageUrl} 
                        alt="Background preview" 
                        className="w-full h-20 object-cover rounded border"
                      />
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    value={bgImageUrl || bgVideoUrl}
                    onChange={(e) => {
                      if (e.target.value.includes('.mp4') || e.target.value.includes('.webm')) {
                        setBgVideoUrl(e.target.value);
                        setBgImageUrl('');
                      } else {
                        setBgImageUrl(e.target.value);
                        setBgVideoUrl('');
                      }
                    }}
                    placeholder="Background URL or upload file below"
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('background')}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Background File
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border">
                  💡 Supports images (JPG, PNG, WebP) and videos (MP4, WebM)
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab with Positioning Sliders */}
            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Layout Templates
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setElementPositions([
                        { id: 'logo', type: 'logo', x: 50, y: 10 },
                        { id: 'title', type: 'title', x: 50, y: 25 },
                        { id: 'subtitle', type: 'subtitle', x: 50, y: 35 },
                        { id: 'checklist', type: 'checklist', x: 50, y: 50 },
                        { id: 'buttons', type: 'buttons', x: 50, y: 75 }
                      ]);
                    }}
                    className="text-xs p-2 h-auto flex-col gap-1"
                  >
                    <div className="w-4 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-6 h-1 bg-current rounded"></div>
                    <div className="w-5 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-3 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-4 h-1 bg-current rounded"></div>
                    Center Classic
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setElementPositions([
                        { id: 'logo', type: 'logo', x: 20, y: 15 },
                        { id: 'title', type: 'title', x: 20, y: 30 },
                        { id: 'subtitle', type: 'subtitle', x: 20, y: 40 },
                        { id: 'checklist', type: 'checklist', x: 20, y: 55 },
                        { id: 'buttons', type: 'buttons', x: 20, y: 75 }
                      ]);
                    }}
                    className="text-xs p-2 h-auto flex-col gap-1"
                  >
                    <div className="w-3 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-5 h-1 bg-current rounded"></div>
                    <div className="w-4 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-2 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-3 h-1 bg-current rounded"></div>
                    Left Aligned
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setElementPositions([
                        { id: 'logo', type: 'logo', x: 80, y: 15 },
                        { id: 'title', type: 'title', x: 80, y: 30 },
                        { id: 'subtitle', type: 'subtitle', x: 80, y: 40 },
                        { id: 'checklist', type: 'checklist', x: 80, y: 55 },
                        { id: 'buttons', type: 'buttons', x: 80, y: 75 }
                      ]);
                    }}
                    className="text-xs p-2 h-auto flex-col gap-1"
                  >
                    <div className="w-3 h-1 bg-current rounded opacity-60 ml-auto"></div>
                    <div className="w-5 h-1 bg-current rounded ml-auto"></div>
                    <div className="w-4 h-1 bg-current rounded opacity-60 ml-auto"></div>
                    <div className="w-2 h-1 bg-current rounded opacity-60 ml-auto"></div>
                    <div className="w-3 h-1 bg-current rounded ml-auto"></div>
                    Right Aligned
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setElementPositions([
                        { id: 'logo', type: 'logo', x: 50, y: 5 },
                        { id: 'title', type: 'title', x: 50, y: 20 },
                        { id: 'subtitle', type: 'subtitle', x: 50, y: 30 },
                        { id: 'checklist', type: 'checklist', x: 50, y: 45 },
                        { id: 'buttons', type: 'buttons', x: 50, y: 85 }
                      ]);
                    }}
                    className="text-xs p-2 h-auto flex-col gap-1"
                  >
                    <div className="w-4 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-6 h-1 bg-current rounded"></div>
                    <div className="w-5 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-3 h-1 bg-current rounded opacity-60"></div>
                    <div className="w-4 h-1 bg-current rounded mt-2"></div>
                    Bottom CTA
                  </Button>
                </div>
              </div>

              {/* Precision Position Sliders */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Precision Positioning
                </Label>
                
                {elementPositions.map((element) => (
                  <div key={element.id} className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium capitalize">
                        {element.type === 'buttons' ? 'Action Buttons' : element.type}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(element.x)}, {Math.round(element.y)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Horizontal: {Math.round(element.x)}%
                        </Label>
                        <Slider
                          value={[element.x]}
                          onValueChange={([value]) => {
                            setElementPositions(prev => 
                              prev.map(el => el.id === element.id ? { ...el, x: value } : el)
                            );
                          }}
                          min={0}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Vertical: {Math.round(element.y)}%
                        </Label>
                        <Slider
                          value={[element.y]}
                          onValueChange={([value]) => {
                            setElementPositions(prev => 
                              prev.map(el => el.id === element.id ? { ...el, y: value } : el)
                            );
                          }}
                          min={0}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border">
                  💡 Use sliders for precise positioning or enable drag mode to move elements visually
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4">
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {buttons.map((button, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-sm">Button {idx + 1}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeButton(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Button Text</Label>
                        <Input
                          value={button.text}
                          onChange={(e) => updateButton(idx, { text: e.target.value })}
                          placeholder="Button Text"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Button Style</Label>
                        <Select
                          value={button.style || 'filled'}
                          onValueChange={(value: 'filled' | 'outline') => updateButton(idx, { style: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filled">Filled</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Action Type</Label>
                        <Select
                          value={button.type}
                          onValueChange={(value: CoverButtonType) => updateButton(idx, { type: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delivery_app">Delivery App</SelectItem>
                            <SelectItem value="checkout">Checkout</SelectItem>
                            <SelectItem value="url">Custom URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {button.type === 'delivery_app' && (
                        <>
                          <div>
                            <Label className="text-xs">App</Label>
                            <Select
                              value={button.app_slug || ''}
                              onValueChange={(value) => updateButton(idx, { app_slug: value })}
                            >
                              <SelectTrigger className="text-sm">
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
                          </div>
                          
                          <div>
                            <Label className="text-xs">Markup Percentage</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={button.markup_percent || ''}
                                onChange={(e) => updateButton(idx, { markup_percent: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                                type="number"
                                min="0"
                                max="100"
                                className="text-sm"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Price markup for this delivery app destination
                            </div>
                          </div>
                        </>
                      )}

                      {button.type === 'url' && (
                        <div>
                          <Label className="text-xs">URL</Label>
                          <Input
                            value={button.url || ''}
                            onChange={(e) => updateButton(idx, { url: e.target.value })}
                            placeholder="https://example.com"
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addButton}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Button
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
          {activeDevice === 'iphone14' || activeDevice === 'galaxyS23' ? (
            <MobileFirstCoverPreview
              title={title}
              subtitle={subtitle}
              logoUrl={logoUrl}
              checklist={checklist}
              buttons={buttons.map(btn => ({ ...btn, style: btn.style || 'filled' as const }))}
              selectedTheme={selectedTheme}
              elementPositions={elementPositions}
              dragMode={dragMode}
            />
          ) : (
            <AnimatedCoverPreview
              title={title}
              subtitle={subtitle}
              logoUrl={logoUrl}
              bgImageUrl={bgImageUrl}
              bgVideoUrl={bgVideoUrl}
              checklist={checklist}
              buttons={buttons.map(btn => ({ ...btn, style: btn.style || 'filled' as const }))}
              selectedTheme={selectedTheme}
              activeDevice={activeDevice}
              titleSize={48}
              subtitleSize={20}
              checklistSize={16}
              titleOffsetY={0}
              subtitleOffsetY={0}
              checklistOffsetY={0}
              buttonsOffsetY={0}
              logoOffsetY={0}
              logoHeight={160}
              fullscreenPreview={fullscreenPreview}
              templateData={templateData || {}}
            />
          )}
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

  if (embedded) {
    return (
      <div className="h-full">
        {/* Header for embedded mode */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {isEditing ? 'Edit' : 'Create'} Cover Page
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview'}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </div>
        <div className="h-[calc(100%-80px)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0" aria-describedby="dialog-description">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogDescription id="dialog-description" className="sr-only">
            Create and customize cover pages with visual editor, themes, and responsive design.
          </DialogDescription>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {isEditing ? 'Edit' : 'Create'} Cover Page
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview'}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="h-[calc(95vh-80px)] overflow-y-auto">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};