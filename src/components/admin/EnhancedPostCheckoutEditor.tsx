import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import Draggable from 'react-draggable';
import { 
  Save, 
  Eye, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Plus,
  Trash2,
  Move,
  Type,
  Palette,
  Settings,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const POST_CHECKOUT_THEMES = {
  success: {
    name: 'Success',
    colors: { 
      primary: '#22c55e', 
      secondary: '#16a34a', 
      accent: '#15803d',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      text: '#14532d'
    }
  },
  celebration: {
    name: 'Celebration',
    colors: { 
      primary: '#f59e0b', 
      secondary: '#d97706', 
      accent: '#b45309',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      text: '#78350f'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#7c3aed', 
      accent: '#6d28d9',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      text: '#581c87'
    }
  },
  minimal: {
    name: 'Minimal',
    colors: { 
      primary: '#6b7280', 
      secondary: '#4b5563', 
      accent: '#374151',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      text: '#111827'
    }
  }
};

const DEVICE_CONFIGS = {
  mobile: { 
    name: 'Mobile', 
    width: 375, 
    height: 667, 
    className: 'w-[375px] h-[600px]',
    icon: Smartphone
  },
  tablet: { 
    name: 'Tablet', 
    width: 768, 
    height: 1024, 
    className: 'w-[400px] h-[533px]',
    icon: Tablet
  },
  desktop: { 
    name: 'Desktop', 
    width: 1200, 
    height: 800, 
    className: 'w-[600px] h-[400px]',
    icon: Monitor
  }
};

interface PostCheckoutButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

interface PostCheckoutConfig {
  id?: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  custom_text_lines: string[];
  buttons: PostCheckoutButton[];
  background_color?: string;
  text_color?: string;
  // Removed cover_page_id - standalone architecture
  affiliate_id?: string;
  is_template?: boolean;
  theme?: string;
  styles?: any;
}

interface DraggableElement {
  id: string;
  type: 'logo' | 'title' | 'subtitle' | 'custom_text' | 'buttons';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface EnhancedPostCheckoutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PostCheckoutConfig | null;
  onSaved?: () => void;
}

export const EnhancedPostCheckoutEditor: React.FC<EnhancedPostCheckoutEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const isEditing = !!initial?.id;

  // Device and theme state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  const [selectedTheme, setSelectedTheme] = useState('success');
  const [previewMode, setPreviewMode] = useState(false);
  const [dragMode, setDragMode] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [customTextLines, setCustomTextLines] = useState<string[]>(['']);
  const [buttons, setButtons] = useState<PostCheckoutButton[]>([
    { text: 'Track Your Order', url: '/orders', style: 'primary' },
    { text: 'Continue Shopping', url: '/', style: 'secondary' }
  ]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  // Removed coverPageId - standalone architecture
  const [affiliateId, setAffiliateId] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Element positions for drag mode
  const [elementPositions, setElementPositions] = useState<DraggableElement[]>([
    { id: 'logo', type: 'logo', x: 50, y: 10 },
    { id: 'title', type: 'title', x: 50, y: 25 },
    { id: 'subtitle', type: 'subtitle', x: 50, y: 35 },
    { id: 'custom_text', type: 'custom_text', x: 50, y: 50 },
    { id: 'buttons', type: 'buttons', x: 50, y: 75 }
  ]);

  // Available options
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    
    // Load cover pages only (affiliates will be loaded via admin dashboard context)
    Promise.all([
      supabase.from('cover_pages').select('id, title, slug').order('created_at', { ascending: false })
    ]).then(([coverPagesRes]) => {
      setCoverPages(coverPagesRes.data || []);
      // For now, use empty affiliates until proper edge function integration
      setAffiliates([]);
    }).catch(error => {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setCoverPages([]);
      setAffiliates([]);
    });

    if (initial) {
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setLogoUrl(initial.logo_url || '');
      setCustomTextLines(initial.custom_text_lines || ['']);
      setButtons(initial.buttons || []);
      setBackgroundColor(initial.background_color || '#ffffff');
      setTextColor(initial.text_color || '#000000');
      // Removed cover page ID setting - standalone architecture
      setAffiliateId(initial.affiliate_id || '');
      setIsTemplate(initial.is_template ?? false);
      setSelectedTheme(initial.theme || 'success');
    } else {
      // Reset for new screen
      setTitle('Order Confirmed!');
      setSubtitle('Thank you for your order. We\'ll send you updates on your delivery.');
      setLogoUrl('');
      setCustomTextLines(['Your order has been processed successfully.']);
      setButtons([
        { text: 'Track Your Order', url: '/orders', style: 'primary' },
        { text: 'Continue Shopping', url: '/', style: 'secondary' }
      ]);
      setBackgroundColor('#ffffff');
      setTextColor('#000000');
      // Removed cover page ID reset - standalone architecture
      setAffiliateId('');
      setIsTemplate(false);
      setSelectedTheme('success');
    }
  }, [open, initial]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `post-checkout-${Date.now()}-logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-checkout-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('post-checkout-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
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

  const handleSave = async () => {
    if (!title) {
      toast({ title: 'Missing required fields', description: 'Title is required', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        title,
        subtitle: subtitle || '',
        logo_url: logoUrl || null,
        button_1_text: buttons[0]?.text || '',
        button_1_url: buttons[0]?.url || '',
        button_2_text: buttons[1]?.text || '',
        button_2_url: buttons[1]?.url || '',
        background_color: backgroundColor,
        text_color: textColor,
        cover_page_id: null, // Always null for standalone architecture
        affiliate_id: affiliateId || null,
        is_template: isTemplate,
        styles: JSON.parse(JSON.stringify({
          theme: selectedTheme,
          custom_text_lines: customTextLines.filter(line => line.trim()),
          all_buttons: buttons,
          element_positions: elementPositions.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width || 0,
            height: el.height || 0
          }))
        }))
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('post_checkout_screens').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_checkout_screens').insert(payload);
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

  const addButton = () => {
    if (buttons.length < 6) {
      setButtons([...buttons, { text: 'New Button', url: '#', style: 'secondary' }]);
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, updates: Partial<PostCheckoutButton>) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], ...updates };
    setButtons(updated);
  };

  const addCustomTextLine = () => {
    setCustomTextLines([...customTextLines, '']);
  };

  const updateCustomTextLine = (index: number, value: string) => {
    const updated = [...customTextLines];
    updated[index] = value;
    setCustomTextLines(updated);
  };

  const removeCustomTextLine = (index: number) => {
    setCustomTextLines(customTextLines.filter((_, i) => i !== index));
  };

  const handleElementDrag = (elementId: string, position: { x: number; y: number }) => {
    setElementPositions(prev => 
      prev.map(el => el.id === elementId ? { ...el, ...position } : el)
    );
  };

  const renderElement = (element: DraggableElement, content: React.ReactNode) => {
    if (!dragMode) return content;

    return (
      <Draggable
        position={{ x: (element.x / 100) * 300 - 150, y: (element.y / 100) * 400 - 200 }}
        onStop={(e, data) => {
          const x = ((data.x + 150) / 300) * 100;
          const y = ((data.y + 200) / 400) * 100;
          handleElementDrag(element.id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        }}
      >
        <div className="cursor-move border-2 border-dashed border-primary/50 rounded p-1">
          {content}
        </div>
      </Draggable>
    );
  };

  const renderPreview = () => {
    const theme = POST_CHECKOUT_THEMES[selectedTheme as keyof typeof POST_CHECKOUT_THEMES];
    const device = DEVICE_CONFIGS[activeDevice];

    const logoElement = elementPositions.find(el => el.id === 'logo');
    const titleElement = elementPositions.find(el => el.id === 'title');
    const subtitleElement = elementPositions.find(el => el.id === 'subtitle');
    const customTextElement = elementPositions.find(el => el.id === 'custom_text');
    const buttonsElement = elementPositions.find(el => el.id === 'buttons');

    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Device Frame Selection */}
        <div className="flex items-center space-x-2 mb-4">
          {Object.entries(DEVICE_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={key}
                variant={activeDevice === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
              >
                <Icon className="w-4 h-4 mr-1" />
                {config.name}
              </Button>
            );
          })}
        </div>

        {/* Drag Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={dragMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDragMode(!dragMode)}
          >
            <Move className="w-4 h-4 mr-2" />
            {dragMode ? 'Exit Drag' : 'Drag Mode'}
          </Button>
          {dragMode && (
            <Badge variant="outline" className="text-xs">
              Drag elements to reposition
            </Badge>
          )}
        </div>

        {/* Preview Frame */}
        <div 
          className={`${device.className} border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white relative`}
          style={{ background: theme.colors.background }}
        >
          <div className="absolute inset-0 p-8 flex flex-col justify-center items-center">
            {/* Success Icon */}
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Logo */}
            {logoUrl && renderElement(
              logoElement!,
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-12 h-12 mx-auto mb-4 object-contain rounded"
              />
            )}

            {/* Title */}
            {renderElement(
              titleElement!,
              <h1 
                className="text-2xl font-bold mb-4 text-center"
                style={{ color: theme.colors.text }}
              >
                {title || 'Order Confirmed!'}
              </h1>
            )}

            {/* Subtitle */}
            {subtitle && renderElement(
              subtitleElement!,
              <p 
                className="text-sm opacity-80 max-w-xs text-center mb-4"
                style={{ color: theme.colors.text }}
              >
                {subtitle}
              </p>
            )}

            {/* Custom Text Lines */}
            {customTextLines.filter(line => line.trim()).length > 0 && renderElement(
              customTextElement!,
              <div className="text-center mb-6 space-y-2 max-w-xs">
                {customTextLines
                  .filter(line => line.trim())
                  .map((line, idx) => (
                    <p 
                      key={idx}
                      className="text-sm"
                      style={{ color: theme.colors.text }}
                    >
                      {line}
                    </p>
                  ))
                }
              </div>
            )}

            {/* Buttons */}
            {renderElement(
              buttonsElement!,
              <div className="space-y-3 w-full px-4">
                {buttons.map((button, idx) => (
                  <button
                    key={idx}
                    className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all"
                    style={{
                      backgroundColor: button.style === 'primary' ? theme.colors.primary : 'transparent',
                      color: button.style === 'primary' ? 'white' : theme.colors.primary,
                      border: button.style === 'secondary' ? `2px solid ${theme.colors.primary}` : 'none'
                    }}
                  >
                    {button.text}
                    {button.url.startsWith('http') && (
                      <ExternalLink className="w-4 h-4 ml-2 inline" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
                {isEditing ? `Edit: ${initial?.title}` : 'Create Enhanced Post-Checkout Screen'}
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
            <DialogDescription id="dialog-description" className="sr-only">
              Design and configure your post-checkout screen content and appearance.
            </DialogDescription>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Panel */}
            <div className={`${previewMode ? 'w-0 overflow-hidden' : 'w-96'} border-r flex-shrink-0 overflow-hidden`}>
              <div className="h-full overflow-y-auto p-4">
                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Order Confirmed!"
                      />
                    </div>
                    
                    <div>
                      <Label>Subtitle</Label>
                      <Textarea
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Thank you for your order. We'll send you updates on your delivery."
                        rows={3}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Custom Text Lines</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addCustomTextLine}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Line
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {customTextLines.map((line, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={line}
                              onChange={(e) => updateCustomTextLine(idx, e.target.value)}
                              placeholder={`Custom text line ${idx + 1}`}
                              className="text-sm"
                            />
                            {customTextLines.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomTextLine(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Associated Cover Page (Disabled - Standalone)</Label>
                      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">
                        Cover pages and post-checkout screens are now independent components.
                      </div>
                    </div>

                    <div>
                      <Label>Associated Affiliate</Label>
                      <Select value={affiliateId} onValueChange={setAffiliateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select affiliate..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {affiliates.map((affiliate) => (
                            <SelectItem key={affiliate.id} value={affiliate.id}>
                              {affiliate.name || affiliate.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-template"
                        checked={isTemplate}
                        onCheckedChange={setIsTemplate}
                      />
                      <Label htmlFor="is-template">Save as Template</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(POST_CHECKOUT_THEMES).map(([key, theme]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedTheme(key)}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              selectedTheme === key 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <div 
                              className="w-full h-4 rounded mb-2"
                              style={{ background: theme.colors.background }}
                            />
                            <div className="text-left">
                              <div className="font-semibold">{theme.name}</div>
                            </div>
                          </button>
                        ))}
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
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>

                    <div>
                      <Label>Text Color</Label>
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2 mb-4">
                        <Settings className="w-4 h-4" />
                        Element Positioning
                      </Label>
                      
                      {elementPositions.map((element) => (
                        <div key={element.id} className="space-y-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium capitalize">
                              {element.type === 'custom_text' ? 'Custom Text' : element.type}
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
                    </div>
                  </TabsContent>

                  <TabsContent value="buttons" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Action Buttons</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addButton}
                        disabled={buttons.length >= 6}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Button
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-64 overflow-y-auto">
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
                              <Label className="text-xs">Button Link</Label>
                              <Input
                                value={button.url}
                                onChange={(e) => updateButton(idx, { url: e.target.value })}
                                placeholder="https://example.com or /path"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Button Style</Label>
                              <Select
                                value={button.style}
                                onValueChange={(value: 'primary' | 'secondary') => updateButton(idx, { style: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="primary">Primary (Filled)</SelectItem>
                                  <SelectItem value="secondary">Secondary (Outline)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div className="h-full overflow-y-auto p-4">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};