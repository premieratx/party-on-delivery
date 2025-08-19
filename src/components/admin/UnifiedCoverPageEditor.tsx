import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import CoverStartScreen from "@/components/custom-delivery/CoverStartScreen";
import { DraggableCoverPreview } from "./DraggableCoverPreview";
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

// Theme definitions
const COVER_THEMES = {
  original: {
    name: 'Original',
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
    name: 'Gold',
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
    name: 'Platinum',
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
  style?: 'filled' | 'outline';
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
  onSaved 
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
    if (!open) return;
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
  }, [open, initial]);

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
      const ext = file.name.split('.').pop() || 'png';
      const base = (computedSlug || slugify(title) || 'cover').slice(0, 60);
      const fileName = `cover-${base}-${kind}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('cover-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e: any) {
      console.error('Upload failed', e);
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

  const renderParticles = () => {
    const theme = COVER_THEMES[selectedTheme];
    if (!theme.particles) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 8 + 4 + 'px',
              height: Math.random() * 8 + 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              backgroundColor: theme.particleColor,
              animationDelay: Math.random() * 3 + 's',
              animationDuration: (Math.random() * 3 + 2) + 's'
            }}
          />
        ))}
      </div>
    );
  };

  const renderLogo = (position: DraggableElement) => {
    const theme = COVER_THEMES[selectedTheme];
    const content = (
      <div 
        className="flex items-center justify-center"
        style={{
          filter: theme.glowColor ? `drop-shadow(0 0 20px ${theme.glowColor})` : 'none'
        }}
      >
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo" 
            style={{ height: logoHeight }}
            className="object-contain"
          />
        ) : (
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center border-2"
            style={{ 
              borderColor: theme.primaryColor,
              backgroundColor: `${theme.primaryColor}20`,
              color: theme.primaryColor
            }}
          >
            LOGO
          </div>
        )}
      </div>
    );

    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: position.x, y: position.y }}
        onStop={(_, data) => handleElementDrag(position.id, { x: data.x, y: data.y })}
      >
        <div className="absolute cursor-move">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderTitle = (position: DraggableElement) => {
    const theme = COVER_THEMES[selectedTheme];
    const content = (
      <h1 
        className="text-4xl md:text-5xl font-bold text-center px-4"
        style={{ 
          color: theme.textColor,
          textShadow: theme.glowColor ? `0 0 30px ${theme.glowColor}` : 'none'
        }}
      >
        {title}
      </h1>
    );

    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: position.x, y: position.y }}
        onStop={(_, data) => handleElementDrag(position.id, { x: data.x, y: data.y })}
      >
        <div className="absolute cursor-move">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderSubtitle = (position: DraggableElement) => {
    const theme = COVER_THEMES[selectedTheme];
    const content = (
      <p 
        className="text-lg md:text-xl text-center px-4"
        style={{ color: theme.subtitleColor }}
      >
        {subtitle}
      </p>
    );

    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: position.x, y: position.y }}
        onStop={(_, data) => handleElementDrag(position.id, { x: data.x, y: data.y })}
      >
        <div className="absolute cursor-move">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderChecklist = (position: DraggableElement) => {
    const theme = COVER_THEMES[selectedTheme];
    const content = (
      <div className="space-y-3 px-4">
        {checklist.filter(Boolean).map((item, idx) => (
          <div key={idx} className="flex items-center justify-center gap-3">
            <span style={{ color: theme.primaryColor }}>
              {selectedTheme === 'gold' ? '🥂' : '✓'}
            </span>
            <span style={{ color: theme.subtitleColor }}>{item}</span>
          </div>
        ))}
      </div>
    );

    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: position.x, y: position.y }}
        onStop={(_, data) => handleElementDrag(position.id, { x: data.x, y: data.y })}
      >
        <div className="absolute cursor-move">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderButtons = (position: DraggableElement) => {
    const theme = COVER_THEMES[selectedTheme];
    const content = (
      <div className="space-y-3 px-4">
        {buttons.map((button, idx) => (
          <button
            key={idx}
            className="w-full py-4 px-8 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            style={{
              backgroundColor: button.style === 'filled' ? theme.buttonBg : 'transparent',
              color: button.style === 'filled' ? theme.buttonText : (theme.buttonOutlineText || theme.primaryColor),
              border: button.style === 'outline' ? `2px solid ${theme.buttonOutline || theme.primaryColor}` : 'none',
              boxShadow: button.style === 'filled' ? `0 4px 15px ${theme.glowColor}` : 'none'
            }}
          >
            {button.text}
          </button>
        ))}
      </div>
    );

    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: position.x, y: position.y }}
        onStop={(_, data) => handleElementDrag(position.id, { x: data.x, y: data.y })}
      >
        <div className="absolute cursor-move">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderPreview = () => {
    const device = DEVICE_CONFIGS[activeDevice];
    const theme = COVER_THEMES[selectedTheme];
    
    const logoPos = elementPositions.find(e => e.id === 'logo');
    const titlePos = elementPositions.find(e => e.id === 'title');
    const subtitlePos = elementPositions.find(e => e.id === 'subtitle');
    const checklistPos = elementPositions.find(e => e.id === 'checklist');
    const buttonsPos = elementPositions.find(e => e.id === 'buttons');

    const isMobile = ['iphone14', 'galaxyS23', 'tablet'].includes(activeDevice);

    return (
      <div 
        className={`flex items-center justify-center min-h-full p-4 ${
          isMobile ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'
        }`}
      >
        <div
          className={`relative overflow-hidden border ${
            isMobile ? 'border-gray-700 shadow-2xl' : 'border-gray-200 shadow-lg'
          }`}
          style={{
            width: fullscreenPreview && isMobile ? device.previewWidth * 1.2 : device.previewWidth,
            height: fullscreenPreview && isMobile ? device.previewHeight * 1.2 : device.previewHeight,
            borderRadius: isMobile ? '1.5rem' : '0.5rem',
            background: bgImageUrl ? `url(${bgImageUrl})` : bgVideoUrl ? 'black' : theme.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {bgVideoUrl && (
            <video
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
              src={bgVideoUrl}
            />
          )}
          
          {renderParticles()}
          
          <div className="relative z-10 h-full flex flex-col justify-center items-center space-y-6 p-8">
            {!dragMode ? (
              <>
                {renderLogo(logoPos!)}
                {renderTitle(titlePos!)}
                {renderSubtitle(subtitlePos!)}
                {renderChecklist(checklistPos!)}
                {renderButtons(buttonsPos!)}
              </>
            ) : (
              <div className="absolute inset-0">
                {renderLogo(logoPos!)}
                {renderTitle(titlePos!)}
                {renderSubtitle(subtitlePos!)}
                {renderChecklist(checklistPos!)}
                {renderButtons(buttonsPos!)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!title || !slugOk) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        slug: computedSlug,
        title,
        subtitle,
        logo_url: logoUrl || null,
        logo_height: logoHeight,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: checklist.filter(Boolean) as any,
        buttons: buttons as any,
        is_active: isActive,
        styles: {
          theme: selectedTheme,
          element_positions: elementPositions
        }
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('cover_pages').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cover_pages').insert(payload);
        if (error) throw error;
      }

      toast({ title: 'Saved successfully!' });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {isEditing ? `Edit: ${initial?.title}` : 'Create Cover Page'}
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
                  disabled={saving || !title}
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
            {/* Controls Panel */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Theme</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(COVER_THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTheme(key as keyof typeof COVER_THEMES)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedTheme === key 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div 
                          className="w-full h-4 rounded mb-2"
                          style={{ background: theme.background }}
                        />
                        <div className="text-left">
                          <div className="font-semibold">{theme.name}</div>
                        </div>
                      </button>
                    ))}
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

                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                  </TabsList>

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
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label>Logo</Label>
                      <div className="space-y-2">
                        <Input
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="Logo URL"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload('logo')}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Logo Height: {logoHeight}px</Label>
                      <Slider
                        value={[logoHeight]}
                        onValueChange={([value]) => setLogoHeight(value)}
                        min={50}
                        max={300}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Background</Label>
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
                          placeholder="Background URL"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload('background')}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Background
                        </Button>
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
            <div className="flex-1 overflow-auto bg-gray-50">
              {renderPreview()}
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
      </DialogContent>
    </Dialog>
  );
};