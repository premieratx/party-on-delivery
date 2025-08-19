import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
  Wand2
} from 'lucide-react';

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

// Template configurations
const COVER_TEMPLATES = {
  modern: {
    name: 'Modern Minimal',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleStyle: { fontSize: 40, fontWeight: 'bold', color: '#ffffff' },
    subtitleStyle: { fontSize: 18, color: '#e2e8f0' },
    buttonStyle: { bg_color: '#ffffff', text_color: '#667eea' }
  },
  vibrant: {
    name: 'Vibrant Energy',
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
    titleStyle: { fontSize: 48, fontWeight: '900', color: '#ffffff' },
    subtitleStyle: { fontSize: 16, color: '#f8f9fa' },
    buttonStyle: { bg_color: '#ffffff', text_color: '#ff6b6b' }
  },
  elegant: {
    name: 'Elegant Dark',
    background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
    titleStyle: { fontSize: 44, fontWeight: '600', color: '#ecf0f1' },
    subtitleStyle: { fontSize: 20, color: '#bdc3c7' },
    buttonStyle: { bg_color: '#e74c3c', text_color: '#ffffff' }
  },
  party: {
    name: 'Party Vibes',
    background: 'linear-gradient(45deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    titleStyle: { fontSize: 44, fontWeight: '900', color: '#ffffff' },
    subtitleStyle: { fontSize: 16, color: '#f7fafc' },
    buttonStyle: { bg_color: '#ffffff', text_color: '#833ab4' }
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
  markup_percent?: number; // 0-50
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

  // Device and preview state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('iphone14');
  const [previewMode, setPreviewMode] = useState(false);
  const [showDraggablePreview, setShowDraggablePreview] = useState(false);

  // Basic form state
  const [slug, setSlug] = useState(initial?.slug || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(initial?.logo_height ?? 160);
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["", "", "", "", ""]);
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(initial?.buttons || []);
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [isDefaultHomepage, setIsDefaultHomepage] = useState<boolean>((initial as any)?.is_default_homepage ?? false);
  const [flowName, setFlowName] = useState<string>((initial as any)?.flow_name || "");
  const [isMultiFlow, setIsMultiFlow] = useState<boolean>((initial as any)?.is_multi_flow ?? false);

  // Style state
  const [titleSize, setTitleSize] = useState<number>((initial as any)?.styles?.title_size ?? 32);
  const [subtitleSize, setSubtitleSize] = useState<number>((initial as any)?.styles?.subtitle_size ?? 18);
  const [checklistSize, setChecklistSize] = useState<number>((initial as any)?.styles?.checklist_size ?? 14);
  const [titleOffsetY, setTitleOffsetY] = useState<number>((initial as any)?.styles?.title_offset_y ?? 0);
  const [subtitleOffsetY, setSubtitleOffsetY] = useState<number>((initial as any)?.styles?.subtitle_offset_y ?? 0);
  const [checklistOffsetY, setChecklistOffsetY] = useState<number>((initial as any)?.styles?.checklist_offset_y ?? 0);
  const [buttonsOffsetY, setButtonsOffsetY] = useState<number>((initial as any)?.styles?.buttons_offset_y ?? 0);
  const [logoOffsetY, setLogoOffsetY] = useState<number>((initial as any)?.styles?.logo_offset_y ?? 0);
  const [backgroundColor, setBackgroundColor] = useState<string>((initial as any)?.styles?.background_color ?? "");
  const [logoBgColor, setLogoBgColor] = useState<string>((initial as any)?.styles?.logo_bg_color ?? "");
  const [logoBgMode, setLogoBgMode] = useState<'auto' | 'rectangle' | 'none'>((initial as any)?.styles?.logo_bg_mode ?? 'auto');
  const [buttonsBottomOffset, setButtonsBottomOffset] = useState<number>((initial as any)?.styles?.buttons_bottom_offset ?? 0);
  const [buttonsSpacing, setButtonsSpacing] = useState<number>((initial as any)?.styles?.buttons_spacing ?? 12);
  const [checklistToButtonsOffset, setChecklistToButtonsOffset] = useState<number>((initial as any)?.styles?.checklist_to_buttons_offset ?? 30);
  const [dotSpacing, setDotSpacing] = useState<number>((initial as any)?.styles?.dot_spacing ?? 8);
  const [dotSize, setDotSize] = useState<number>((initial as any)?.styles?.dot_size ?? 14);

  // Form management state
  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);
  const [affiliates, setAffiliates] = useState<{ id: string; affiliate_code: string; company_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugOk, setSlugOk] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    (async () => {
      const [appsResult, affiliatesResult] = await Promise.all([
        supabase
          .from('delivery_app_variations')
          .select('app_slug, app_name')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('affiliates')
          .select('id, affiliate_code, company_name')
          .eq('status', 'active')
          .order('company_name')
      ]);
      
      setApps(appsResult.data as any[] || []);
      setAffiliates(affiliatesResult.data as any[] || []);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    // Hydrate from initial when opening
    setSlug(initial?.slug || "");
    setTitle(initial?.title || "");
    setSubtitle(initial?.subtitle || "");
    setLogoUrl(initial?.logo_url || "");
    setLogoHeight(initial?.logo_height ?? 160);
    setBgImageUrl(initial?.bg_image_url || "");
    setBgVideoUrl(initial?.bg_video_url || "");
    setChecklist(initial?.checklist && initial.checklist.length ? initial.checklist : ["", "", "", "", ""]);
    setButtons(initial?.buttons || []);
    setIsActive(initial?.is_active ?? true);
    setIsDefaultHomepage((initial as any)?.is_default_homepage ?? false);
    setFlowName((initial as any)?.flow_name || "");
    setIsMultiFlow((initial as any)?.is_multi_flow ?? false);
    setSlugOk(true);
    
    // Hydrate styles
    setTitleSize((initial as any)?.styles?.title_size ?? 32);
    setSubtitleSize((initial as any)?.styles?.subtitle_size ?? 18);
    setChecklistSize((initial as any)?.styles?.checklist_size ?? 14);
    setTitleOffsetY((initial as any)?.styles?.title_offset_y ?? 0);
    setSubtitleOffsetY((initial as any)?.styles?.subtitle_offset_y ?? 0);
    setChecklistOffsetY((initial as any)?.styles?.checklist_offset_y ?? 0);
    setButtonsOffsetY((initial as any)?.styles?.buttons_offset_y ?? 0);
    setLogoOffsetY((initial as any)?.styles?.logo_offset_y ?? 0);
    setBackgroundColor((initial as any)?.styles?.background_color ?? "");
    setLogoBgColor((initial as any)?.styles?.logo_bg_color ?? "");
    setLogoBgMode((initial as any)?.styles?.logo_bg_mode ?? 'auto');
    setButtonsBottomOffset((initial as any)?.styles?.buttons_bottom_offset ?? 0);
    setButtonsSpacing((initial as any)?.styles?.buttons_spacing ?? 12);
    setChecklistToButtonsOffset((initial as any)?.styles?.checklist_to_buttons_offset ?? 30);
    setDotSpacing((initial as any)?.styles?.dot_spacing ?? 8);
    setDotSize((initial as any)?.styles?.dot_size ?? 14);
  }, [open, initial]);

  const computedSlug = useMemo(() => slugify(slug || title), [slug, title]);

  const checkSlug = async (value: string) => {
    if (!value) { setSlugOk(false); return; }
    setCheckingSlug(true);
    try {
      const { data: cp } = await supabase
        .from('cover_pages')
        .select('id')
        .eq('slug', value)
        .maybeSingle();
      if (cp && (!isEditing || cp.id !== initial?.id)) { setSlugOk(false); return; }
      
      const { data: app } = await supabase
        .from('delivery_app_variations')
        .select('id')
        .eq('short_path', value)
        .maybeSingle();
      if (app) { setSlugOk(false); return; }
      
      const { data: aff } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', value)
        .maybeSingle();
      if (aff) { setSlugOk(false); return; }
      
      setSlugOk(true);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => { checkSlug(computedSlug); }, [computedSlug]);

  const addButton = () => setButtons((prev) => [...prev, { text: `Button ${prev.length + 1}`, type: 'delivery_app' }]);
  const removeButton = (idx: number) => setButtons((prev) => prev.filter((_, i) => i !== idx));

  const updateButton = (idx: number, patch: Partial<CoverButtonConfig>) => {
    setButtons((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const applyTemplate = (templateKey: keyof typeof COVER_TEMPLATES) => {
    const template = COVER_TEMPLATES[templateKey];
    setBackgroundColor(template.background);
    setTitleSize(template.titleStyle.fontSize);
    setSubtitleSize(template.subtitleStyle.fontSize);
    // Apply template button style to all buttons
    setButtons(prev => prev.map(btn => ({
      ...btn,
      bg_color: template.buttonStyle.bg_color,
      text_color: template.buttonStyle.text_color
    })));
    toast({ title: 'Template Applied', description: `${template.name} template has been applied` });
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

  const handleSave = async () => {
    if (!title) {
      toast({ title: 'Missing title', description: 'Please enter a title', variant: 'destructive' });
      return;
    }
    if (!slugOk) {
      toast({ title: 'Slug not available', description: 'Choose a different slug', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        slug: computedSlug,
        title,
        subtitle,
        logo_url: logoUrl || null,
        logo_height: logoHeight || null,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: (checklist || []).filter(Boolean).slice(0, 5),
        buttons: buttons as any,
        is_active: isActive,
        is_default_homepage: isDefaultHomepage,
        flow_name: flowName || null,
        is_multi_flow: isMultiFlow,
        styles: { 
          title_size: titleSize, 
          subtitle_size: subtitleSize, 
          checklist_size: checklistSize, 
          spacing_y: 20,
          title_offset_y: titleOffsetY,
          subtitle_offset_y: subtitleOffsetY,
          checklist_offset_y: checklistOffsetY,
          buttons_offset_y: buttonsOffsetY,
          buttons_bottom_offset: buttonsBottomOffset,
          buttons_spacing: buttonsSpacing,
          checklist_to_buttons_offset: checklistToButtonsOffset,
          dot_spacing: dotSpacing,
          dot_size: dotSize,
          logo_offset_y: logoOffsetY,
          background_color: backgroundColor || null,
          logo_bg_color: logoBgColor || null,
          logo_bg_mode: logoBgMode,
        },
      };

      if (isDefaultHomepage) {
        await supabase
          .from('cover_pages')
          .update({ is_default_homepage: false } as any)
          .neq('id', initial?.id || 'none');
      }

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('cover_pages').update(payload as any).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cover_pages').insert(payload as any);
        if (error) throw error;
      }

      toast({ title: 'Saved', description: `Cover page saved successfully${isDefaultHomepage ? ' and set as default homepage' : ''}` });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    const device = DEVICE_CONFIGS[activeDevice];
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="mb-4">
          <Badge variant="outline">{device.name} Preview</Badge>
        </div>
        
        <div className={device.className} style={{ 
          background: backgroundColor || bgImageUrl ? `url(${bgImageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '400px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {bgVideoUrl && (
            <video
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
              src={bgVideoUrl}
            />
          )}
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ 
                  height: `${logoHeight}px`,
                  transform: `translateY(${logoOffsetY}px)`
                }}
                className="mb-4"
              />
            )}
            
            <h1
              style={{
                fontSize: `${titleSize}px`,
                color: '#ffffff',
                fontWeight: 'bold',
                transform: `translateY(${titleOffsetY}px)`,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              className="mb-4"
            >
              {title || 'Your Title Here'}
            </h1>
            
            {subtitle && (
              <p
                style={{
                  fontSize: `${subtitleSize}px`,
                  color: '#e2e8f0',
                  transform: `translateY(${subtitleOffsetY}px)`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
                className="mb-6"
              >
                {subtitle}
              </p>
            )}
            
            {checklist.filter(Boolean).length > 0 && (
              <div 
                style={{ transform: `translateY(${checklistOffsetY}px)` }}
                className="mb-6"
              >
                {checklist.filter(Boolean).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-center mb-2">
                    <div 
                      style={{ 
                        width: `${dotSize}px`, 
                        height: `${dotSize}px`,
                        marginRight: `${dotSpacing}px`
                      }}
                      className="bg-white rounded-full"
                    />
                    <span 
                      style={{ 
                        fontSize: `${checklistSize}px`,
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div 
              style={{ 
                transform: `translateY(${buttonsOffsetY}px)`,
                gap: `${buttonsSpacing}px`
              }}
              className="flex flex-col"
            >
              {buttons.map((button, idx) => (
                <button
                  key={idx}
                  style={{
                    backgroundColor: button.bg_color || '#ffffff',
                    color: button.text_color || '#333333',
                    marginBottom: idx < buttons.length - 1 ? `${buttonsSpacing}px` : '0',
                    transform: button.offset_y ? `translateY(${button.offset_y}px)` : undefined
                  }}
                  className="px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {button.text || `Button ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6" />
            {isEditing ? 'Edit Cover Page' : 'Create Cover Page'}
          </DialogTitle>
          <p className="text-muted-foreground">
            Unified editor with visual preview, device testing, and advanced markup features
          </p>
        </DialogHeader>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Settings Panel */}
          <div className="w-80 border-r overflow-y-auto p-4">
            {/* Device Selector */}
            <div className="space-y-3 mb-6">
              <Label className="text-sm font-semibold">Preview Device</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DEVICE_CONFIGS).map(([key, device]) => {
                  const IconComponent = device.icon;
                  return (
                    <Button
                      key={key}
                      variant={activeDevice === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                      className="flex items-center gap-1"
                    >
                      <IconComponent className="w-3 h-3" />
                      <span className="text-xs">{device.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-3 mb-6">
              <Label className="text-sm font-semibold">Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(COVER_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key as keyof typeof COVER_TEMPLATES)}
                    className="text-xs"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
                <TabsTrigger value="buttons" className="text-xs">Buttons</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="title" className="font-medium">Page Title *</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter cover page title"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle" className="font-medium">Subtitle</Label>
                  <Textarea 
                    id="subtitle" 
                    value={subtitle} 
                    onChange={(e) => setSubtitle(e.target.value)} 
                    placeholder="Enter subtitle (optional)"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <Input 
                    value={slug || computedSlug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-slug"
                    className={!slugOk ? 'border-red-500' : ''}
                  />
                  {!slugOk && <p className="text-sm text-red-500 mt-1">Slug not available</p>}
                </div>

                <div>
                  <Label>Flow Name</Label>
                  <Input 
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Optional flow identifier"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={isDefaultHomepage} onCheckedChange={setIsDefaultHomepage} />
                  <Label>Default Homepage</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={isMultiFlow} onCheckedChange={setIsMultiFlow} />
                  <Label>Multi-Flow Page</Label>
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <div>
                  <Label>Background Color/Gradient</Label>
                  <Input 
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="CSS background (color, gradient, etc.)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFileUpload('background')}
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Background
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFileUpload('logo')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Logo
                  </Button>
                </div>

                {logoUrl && (
                  <div>
                    <Label>Logo Height: {logoHeight}px</Label>
                    <Slider
                      value={[logoHeight]}
                      onValueChange={(value) => setLogoHeight(value[0])}
                      max={300}
                      min={40}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Title: {titleSize}px</Label>
                    <Slider
                      value={[titleSize]}
                      onValueChange={(value) => setTitleSize(value[0])}
                      max={60}
                      min={16}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Subtitle: {subtitleSize}px</Label>
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
                    <Label>Checklist: {checklistSize}px</Label>
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

                <div>
                  <Label>Checklist Items</Label>
                  {checklist.map((item, idx) => (
                    <Input
                      key={idx}
                      value={item}
                      onChange={(e) => {
                        const newChecklist = [...checklist];
                        newChecklist[idx] = e.target.value;
                        setChecklist(newChecklist);
                      }}
                      placeholder={`Checklist item ${idx + 1}`}
                      className="mt-1"
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">Buttons</Label>
                  <Button size="sm" onClick={addButton}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {buttons.map((button, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Button {idx + 1}</Label>
                        {buttons.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeButton(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Input
                        value={button.text}
                        onChange={(e) => updateButton(idx, { text: e.target.value })}
                        placeholder="Button text"
                      />

                      <Select
                        value={button.type}
                        onValueChange={(value: CoverButtonType) => updateButton(idx, { type: value })}
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
                          value={button.app_slug || ''}
                          onValueChange={(value) => updateButton(idx, { app_slug: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery app" />
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
                        />
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Background</Label>
                          <Input
                            type="color"
                            value={button.bg_color || '#ffffff'}
                            onChange={(e) => updateButton(idx, { bg_color: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={button.text_color || '#000000'}
                            onChange={(e) => updateButton(idx, { text_color: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Markup %</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={50} 
                          step={1} 
                          value={button.markup_percent ?? 0} 
                          onChange={(e) => updateButton(idx, { markup_percent: Number(e.target.value) })} 
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Logo Y: {logoOffsetY}px</Label>
                    <Slider
                      value={[logoOffsetY]}
                      onValueChange={(value) => setLogoOffsetY(value[0])}
                      max={120}
                      min={-120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Title Y: {titleOffsetY}px</Label>
                    <Slider
                      value={[titleOffsetY]}
                      onValueChange={(value) => setTitleOffsetY(value[0])}
                      max={120}
                      min={-120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Subtitle Y: {subtitleOffsetY}px</Label>
                    <Slider
                      value={[subtitleOffsetY]}
                      onValueChange={(value) => setSubtitleOffsetY(value[0])}
                      max={120}
                      min={-120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Checklist Y: {checklistOffsetY}px</Label>
                    <Slider
                      value={[checklistOffsetY]}
                      onValueChange={(value) => setChecklistOffsetY(value[0])}
                      max={120}
                      min={-120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Buttons Y: {buttonsOffsetY}px</Label>
                    <Slider
                      value={[buttonsOffsetY]}
                      onValueChange={(value) => setButtonsOffsetY(value[0])}
                      max={120}
                      min={-120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Button Spacing: {buttonsSpacing}px</Label>
                    <Slider
                      value={[buttonsSpacing]}
                      onValueChange={(value) => setButtonsSpacing(value[0])}
                      max={40}
                      min={0}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Dot Size: {dotSize}px</Label>
                    <Slider
                      value={[dotSize]}
                      onValueChange={(value) => setDotSize(value[0])}
                      max={20}
                      min={6}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Dot Spacing: {dotSpacing}px</Label>
                    <Slider
                      value={[dotSpacing]}
                      onValueChange={(value) => setDotSpacing(value[0])}
                      max={20}
                      min={4}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setShowDraggablePreview(true)}
                  className="w-full"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Open Draggable Editor
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {renderPreview()}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`/${computedSlug}`, '_blank')}
              disabled={!slugOk || !title}
            >
              Test Live
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !title || !slugOk}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Cover Page
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => handleFileChange(e, 'background')}
        />
        <input
          ref={logoInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'logo')}
        />

      </DialogContent>
    </Dialog>
  );
};

export default UnifiedCoverPageEditor;