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
import { FigmaTemplateSelector } from "./FigmaTemplateSelector";
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
        className={`flex items-center justify-center min-h-full p-4 transition-all duration-300 ${
          isMobile ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'
        }`}
        style={{
          background: isMobile ? theme.background : 'rgb(249 250 251)'
        }}
      >
        {/* Phone Frame with Responsive Design */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            isMobile ? 'border-2 border-gray-700 shadow-2xl' : 'border border-gray-200 shadow-lg'
          }`}
          style={{
            width: fullscreenPreview && isMobile ? Math.min(device.previewWidth * 1.2, 420) : Math.min(device.previewWidth, 400),
            height: fullscreenPreview && isMobile ? Math.min(device.previewHeight * 1.2, 800) : Math.min(device.previewHeight, 750),
            borderRadius: isMobile ? '2.5rem' : '1rem',
            background: bgImageUrl ? `url(${bgImageUrl})` : bgVideoUrl ? 'black' : theme.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: isMobile ? 
              `0 0 40px ${theme.glowColor}, 0 20px 60px rgba(0, 0, 0, 0.5)` : 
              '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: isMobile ? 
              `1px solid ${theme.primaryColor}40` : 
              '1px solid rgb(229 231 235)'
          }}
        >
          {/* Video Background */}
          {bgVideoUrl && (
            <video
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
              src={bgVideoUrl}
            />
          )}
          
          {/* Particles Effect */}
          {renderParticles()}
          
          {/* Content Container */}
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

          {/* Phone Frame Overlay Effects */}
          {isMobile && (
            <>
              {/* Glow Effect */}
              <div 
                className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}10 0%, transparent 50%, ${theme.primaryColor}05 100%)`,
                  boxShadow: `inset 0 0 60px ${theme.glowColor}`
                }}
              />
              {/* Frame Highlight */}
              <div 
                className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                style={{
                  border: `1px solid ${theme.primaryColor}20`,
                  background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)'
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!title || !computedSlug) {
      toast({ title: 'Missing required fields', description: 'Title and slug are required', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        slug: computedSlug,
        title,
        subtitle: subtitle || '',
        logo_url: logoUrl || null,
        logo_height: logoHeight || 160,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: checklist.filter(Boolean),
        buttons: buttons,
        is_active: isActive,
        is_default_homepage: false,
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
      console.error('Save error:', e);
      toast({ title: 'Save failed', description: e?.message || 'Unknown error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden">
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

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Controls Panel */}
            <div className="w-80 border-r flex flex-col max-h-full">
              <div className="p-4 overflow-y-auto flex-1 space-y-6 custom-scrollbar max-h-full">
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

          {/* NEW: Figma Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <FigmaTemplateSelector 
              onTemplateSelect={(templateData: any) => {
                // Apply template data to current form
                if (templateData.elements) {
                  const template = templateData;
                  
                  // Set theme based on template data
                  if (template.theme?.primaryColor === '#F5B800') {
                    setSelectedTheme('gold');
                  } else if (template.theme?.primaryColor === '#00d4ff') {
                    setSelectedTheme('ocean');
                  } else if (template.theme?.primaryColor === '#ffffff') {
                    setSelectedTheme('sunset');
                  }
                  
                  // Apply content from template elements
                  const titleElement = template.elements.find((e: any) => e.type === 'text' && (e.id === 'title' || e.content?.includes('ELITE') || e.content?.includes('OCEAN') || e.content?.includes('SUNSET')));
                  const subtitleElement = template.elements.find((e: any) => e.type === 'text' && (e.id === 'subtitle' || e.content?.includes('LUXURY') || e.content?.includes('Fresh') || e.content?.includes('Glow')));
                  const checklistElement = template.elements.find((e: any) => e.type === 'list' || e.id === 'checklist');
                  const primaryButtonElement = template.elements.find((e: any) => e.type === 'button' && (e.id === 'primary_button' || e.content?.includes('ORDER') || e.content?.includes('DIVE')));
                  const secondaryButtonElement = template.elements.find((e: any) => e.type === 'button' && (e.id === 'secondary_button' || e.content?.includes('VIEW') || e.content?.includes('GLOW')));
                  
                  // Apply content
                  if (titleElement?.content) {
                    setTitle(titleElement.content);
                  }
                  if (subtitleElement?.content) {
                    setSubtitle(subtitleElement.content);
                  }
                  if (checklistElement?.items) {
                    setChecklist(checklistElement.items);
                  }
                  
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
                  if (newButtons.length > 0) {
                    setButtons(newButtons);
                  }
                  
                  // Apply element positions if available
                  if (template.elements && Array.isArray(template.elements)) {
                    const newPositions = template.elements
                      .filter((element: any) => element.position)
                      .map((element: any) => ({
                        id: element.id === 'primary_button' || element.id === 'secondary_button' ? 'buttons' : element.id,
                        type: element.id === 'primary_button' || element.id === 'secondary_button' ? 'buttons' : element.type,
                        x: element.position.x || 50,
                        y: element.position.y || 50
                      }));
                    
                    if (newPositions.length > 0) {
                      setElementPositions(newPositions);
                    }
                  }
                  
                  toast({ title: 'Template Applied!', description: `"${template.template_name || 'Figma template'}" loaded successfully` });
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

                  {/* New Advanced Layout Tab */}
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
                              { id: 'logo', type: 'logo', x: 70, y: 15 },
                              { id: 'title', type: 'title', x: 70, y: 30 },
                              { id: 'subtitle', type: 'subtitle', x: 70, y: 40 },
                              { id: 'checklist', type: 'checklist', x: 70, y: 55 },
                              { id: 'buttons', type: 'buttons', x: 70, y: 75 }
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
                              { id: 'title', type: 'title', x: 50, y: 15 },
                              { id: 'subtitle', type: 'subtitle', x: 50, y: 25 },
                              { id: 'logo', type: 'logo', x: 50, y: 40 },
                              { id: 'checklist', type: 'checklist', x: 50, y: 60 },
                              { id: 'buttons', type: 'buttons', x: 50, y: 80 }
                            ]);
                          }}
                          className="text-xs p-2 h-auto flex-col gap-1"
                        >
                          <div className="w-6 h-1 bg-current rounded"></div>
                          <div className="w-5 h-1 bg-current rounded opacity-60"></div>
                          <div className="w-4 h-1 bg-current rounded opacity-60"></div>
                          <div className="w-3 h-1 bg-current rounded opacity-60"></div>
                          <div className="w-4 h-1 bg-current rounded"></div>
                          Title First
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Element Spacing</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setElementPositions(prev => prev.map(el => ({
                                ...el,
                                y: el.y * 0.8
                              })));
                            }}
                          >
                            Compact
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setElementPositions(prev => prev.map(el => ({
                                ...el,
                                y: Math.min(90, el.y * 1.2)
                              })));
                            }}
                          >
                            Spread Out
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-800">
                          💡 Use templates as starting points, then fine-tune with drag mode or manual positioning below.
                        </p>
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
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {renderPreview()}
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
      </DialogContent>
    </Dialog>
  );
};