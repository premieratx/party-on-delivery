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
  Sparkles
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

// Device configurations
const DEVICE_CONFIGS = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    className: 'w-full max-w-4xl mx-auto'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    className: 'w-[768px] h-[600px] mx-auto'
  },
  iphone14: {
    name: 'iPhone 14 Pro',
    icon: Smartphone,
    width: 393,
    height: 852,
    className: 'w-[393px] h-[600px] mx-auto'
  },
  galaxyS23: {
    name: 'Galaxy S23',
    icon: Smartphone,
    width: 360,
    height: 780,
    className: 'w-[360px] h-[600px] mx-auto'
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

    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <div
          className="relative overflow-hidden rounded-xl border"
          style={{
            width: device.width / 2,
            height: device.height / 2,
            maxWidth: '100%',
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
      <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Cover Page Creator - Figma Design System
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Controls Panel */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Figma Theme Selection */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">Figma Design Themes</Label>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(COVER_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key as keyof typeof COVER_THEMES)}
                    className={`p-4 rounded-lg border text-sm font-medium transition-all group ${
                      selectedTheme === key 
                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30' 
                        : 'border-border hover:bg-muted hover:border-primary/50'
                    }`}
                  >
                    <div 
                      className="w-full h-8 rounded mb-3 shadow-sm"
                      style={{ background: theme.background }}
                    />
                    <div className="text-left">
                      <div className="font-semibold">{theme.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {key === 'gold' && '✨ Premium Luxury Design'}
                        {key === 'platinum' && '💎 Elegant Professional'}
                        {key === 'original' && '🎨 Modern Classic'}
                      </div>
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
                      className={`p-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                        activeDevice === key 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {device.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Controls */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Editor Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={!previewMode && !dragMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setPreviewMode(false); setDragMode(false); }}
                >
                  <Settings className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant={dragMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setDragMode(!dragMode); setPreviewMode(false); }}
                >
                  <Move className="w-4 h-4" />
                  Position
                </Button>
                <Button
                  variant={previewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setPreviewMode(!previewMode); setDragMode(false); }}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            </div>

            <Tabs defaultValue="content" className="flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Page Slug</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="page-slug"
                    />
                  </div>
                  
                  <div>
                    <Label>Title</Label>
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
                    {checklist.map((item, idx) => (
                      <div key={idx} className="flex gap-2 mt-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newChecklist = [...checklist];
                            newChecklist[idx] = e.target.value;
                            setChecklist(newChecklist);
                          }}
                          placeholder={`Feature ${idx + 1}`}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChecklist([...checklist, ""])}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Logo</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Logo URL"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('logo')}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Background Image/Video</Label>
                    <div className="flex gap-2 mt-2">
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
                      >
                        <Upload className="w-4 h-4" />
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
                </div>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {buttons.map((button, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="font-semibold">Button {idx + 1}</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeButton(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Input
                          value={button.text}
                          onChange={(e) => updateButton(idx, { text: e.target.value })}
                          placeholder="Button Text"
                        />
                        
                        <Select
                          value={button.style || 'filled'}
                          onValueChange={(value) => updateButton(idx, { style: value as 'filled' | 'outline' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filled">Filled</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={button.type}
                          onValueChange={(value) => updateButton(idx, { type: value as CoverButtonType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delivery_app">Delivery App</SelectItem>
                            <SelectItem value="checkout">Checkout</SelectItem>
                            <SelectItem value="url">Custom URL</SelectItem>
                          </SelectContent>
                        </Select>

                        {button.type === 'delivery_app' && (
                          <Select
                            value={button.app_slug}
                            onValueChange={(value) => updateButton(idx, { app_slug: value })}
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
                            value={button.url}
                            onChange={(e) => updateButton(idx, { url: e.target.value })}
                            placeholder="https://example.com"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addButton}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4" />
                    Add Button
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Save Button - Fixed at bottom */}
            <div className="p-6 border-t bg-background">
              <Button
                onClick={handleSave}
                disabled={saving || !title || !slugOk}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : isEditing ? 'Update Cover Page' : 'Create Cover Page'}
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1">
            {renderPreview()}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'background')}
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'logo')}
        />
      </DialogContent>
    </Dialog>
  );
};