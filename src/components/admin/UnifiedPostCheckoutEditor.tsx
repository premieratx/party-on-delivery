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
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CANONICAL_DOMAIN } from '@/utils/links';
import Draggable from 'react-draggable';
// import { EnhancedPostCheckoutEditor } from './EnhancedPostCheckoutEditor';

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
  mobile: { name: 'Mobile', width: 375, height: 667, className: 'w-[375px] h-[667px]' },
  tablet: { name: 'Tablet', width: 768, height: 1024, className: 'w-[384px] h-[512px]' },
  desktop: { name: 'Desktop', width: 1200, height: 800, className: 'w-[600px] h-[400px]' }
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
  buttons: PostCheckoutButton[];
  background_color?: string;
  text_color?: string;
  cover_page_id?: string;
  affiliate_id?: string;
  flow_id?: string;
  is_template?: boolean;
  theme?: string;
  styles?: any;
}

interface UnifiedPostCheckoutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PostCheckoutConfig | null;
  onSaved?: () => void;
}

export const UnifiedPostCheckoutEditor: React.FC<UnifiedPostCheckoutEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {

  // Device and theme state
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('mobile');
  const [selectedTheme, setSelectedTheme] = useState('success');
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [buttons, setButtons] = useState<PostCheckoutButton[]>([
    { text: 'Track Your Order', url: '/orders', style: 'primary' },
    { text: 'Continue Shopping', url: '/', style: 'secondary' }
  ]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [coverPageId, setCoverPageId] = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available options
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!initial?.id;

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
      setButtons(initial.buttons || []);
      setBackgroundColor(initial.background_color || '#ffffff');
      setTextColor(initial.text_color || '#000000');
      setCoverPageId(initial.cover_page_id || '');
      setAffiliateId(initial.affiliate_id || '');
      setIsTemplate(initial.is_template ?? false);
      setSelectedTheme(initial.theme || 'success');
    } else {
      // Reset for new screen
      setTitle('Order Confirmed!');
      setSubtitle('Thank you for your order. We\'ll send you updates on your delivery.');
      setLogoUrl('');
      setButtons([
        { text: 'Track Your Order', url: '/orders', style: 'primary' },
        { text: 'Continue Shopping', url: '/', style: 'secondary' }
      ]);
      setBackgroundColor('#ffffff');
      setTextColor('#000000');
      setCoverPageId('');
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
      // Get a cover page ID if none is selected
      let finalCoverPageId = coverPageId;
      if (!finalCoverPageId && coverPages.length > 0) {
        finalCoverPageId = coverPages[0].id;
      }

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
        cover_page_id: finalCoverPageId,
        affiliate_id: affiliateId || null,
        is_template: isTemplate,
        styles: JSON.parse(JSON.stringify({
          theme: selectedTheme,
          buttons: buttons
        }))
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('post_checkout_screens').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        if (!finalCoverPageId) {
          toast({ 
            title: 'Missing cover page', 
            description: 'No cover pages available. Please create a cover page first.',
            variant: 'destructive' 
          });
          return;
        }
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
    if (buttons.length < 4) {
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

  const renderPreview = () => {
    const theme = POST_CHECKOUT_THEMES[selectedTheme as keyof typeof POST_CHECKOUT_THEMES];
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
          className={`${device.className} border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white relative flex flex-col justify-center items-center p-8`}
          style={{ background: theme.colors.background }}
        >
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
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-12 h-12 mx-auto mb-4 object-contain rounded"
            />
          )}

          {/* Content */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl font-bold mb-4"
              style={{ color: theme.colors.text }}
            >
              {title || 'Order Confirmed!'}
            </h1>
            <p 
              className="text-sm opacity-80 max-w-xs"
              style={{ color: theme.colors.text }}
            >
              {subtitle || 'Thank you for your order. We\'ll send you updates on your delivery.'}
            </p>
          </div>

          {/* Buttons */}
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
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {isEditing ? `Edit: ${initial?.title}` : 'Create Post-Checkout Screen'}
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
          {/* Editor Panel */}
            <div className="w-96 border-r flex-shrink-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
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
                      <Label>Associated Cover Page</Label>
                      <Select value={coverPageId} onValueChange={setCoverPageId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cover page..." />
                        </SelectTrigger>
                        <SelectContent>
                          {coverPages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title} ({page.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        checked={isTemplate}
                        onCheckedChange={setIsTemplate}
                      />
                      <Label>Save as Template</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {Object.entries(POST_CHECKOUT_THEMES).map(([key, theme]) => (
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

                    <div>
                      <Label>Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="buttons" className="space-y-4">
                    <div>
                      <Label>Action Buttons</Label>
                      <div className="space-y-3 mt-2">
                        {buttons.map((button, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <Label className="font-semibold text-sm">Button {idx + 1}</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeButton(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
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
                                <Label className="text-xs">URL</Label>
                                <Input
                                  value={button.url}
                                  onChange={(e) => updateButton(idx, { url: e.target.value })}
                                  placeholder="https://example.com"
                                  className="text-sm"
                                />
                              </div>

                              <div>
                                <Label className="text-xs">Style</Label>
                                <Select
                                  value={button.style}
                                  onValueChange={(value: 'primary' | 'secondary') => updateButton(idx, { style: value })}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="secondary">Secondary</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      {buttons.length < 4 && (
                        <Button
                          variant="outline"
                          onClick={addButton}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Button
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
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