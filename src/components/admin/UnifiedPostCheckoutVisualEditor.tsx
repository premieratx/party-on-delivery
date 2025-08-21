import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Eye, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Move,
  Type,
  Image as ImageIcon
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
  mobile: { name: 'Mobile', width: 375, height: 667 },
  tablet: { name: 'Tablet', width: 768, height: 1024 },
  desktop: { name: 'Desktop', width: 1200, height: 800 }
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
  canvas_elements?: any[];
}

interface UnifiedPostCheckoutVisualEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PostCheckoutConfig | null;
  onSaved?: () => void;
}

export const UnifiedPostCheckoutVisualEditor: React.FC<UnifiedPostCheckoutVisualEditorProps> = ({
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
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  // Available options
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!initial?.id;
  const theme = POST_CHECKOUT_THEMES[selectedTheme as keyof typeof POST_CHECKOUT_THEMES];
  const device = DEVICE_CONFIGS[activeDevice];

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
      setCanvasElements(initial.canvas_elements || []);
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
      setCanvasElements([]);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!title) {
      toast({ title: 'Missing required fields', description: 'Title is required', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const pageData = {
        name: title,
        slug: isEditing ? initial?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post-checkout' : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
        content: JSON.parse(JSON.stringify({
          title,
          subtitle: subtitle || '',
          logo_url: logoUrl || null,
          buttons,
          background_color: backgroundColor,
          text_color: textColor,
          theme: selectedTheme,
          canvas_elements: canvasElements
        })),
        is_active: true,
        is_default: isTemplate || false
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('post_checkout_pages').update(pageData).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_checkout_pages').insert(pageData);
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `post-checkout-${Date.now()}-logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-checkout-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('post-checkout-assets').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
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
                <div>
                  <h3>{isEditing ? `Edit: ${initial?.title}` : 'Create Post-Checkout Screen'}</h3>
                  <DialogDescription id="dialog-description" className="text-sm text-muted-foreground">
                    Design custom post-purchase experiences with visual editor
                  </DialogDescription>
                </div>
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
            {/* Left Panel - Settings */}
            <div className="w-80 border-r flex-shrink-0 bg-background">
              <div className="h-full overflow-y-auto p-4">
                <Tabs defaultValue="content" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                  </TabsList>
                  
                     <TabsContent value="content" className="space-y-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
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

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is_template"
                              checked={isTemplate}
                              onCheckedChange={setIsTemplate}
                            />
                            <Label htmlFor="is_template">Use as Template</Label>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                   <TabsContent value="design" className="space-y-4">
                     <ScrollArea className="h-[400px] pr-4">
                       <div className="space-y-4">
                         <div>
                           <Label>Theme</Label>
                           <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {Object.entries(POST_CHECKOUT_THEMES).map(([key, theme]) => (
                                 <SelectItem key={key} value={key}>
                                   {theme.name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>

                         <div>
                           <Label>Device Preview</Label>
                           <div className="grid grid-cols-3 gap-2 mt-2">
                             {Object.entries(DEVICE_CONFIGS).map(([key, config]) => (
                               <Button
                                 key={key}
                                 variant={activeDevice === key ? 'default' : 'outline'}
                                 size="sm"
                                 onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                               >
                                 {key === 'mobile' && <Smartphone className="w-4 h-4" />}
                                 {key === 'tablet' && <Tablet className="w-4 h-4" />}
                                 {key === 'desktop' && <Monitor className="w-4 h-4" />}
                               </Button>
                             ))}
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <Label>Background Color</Label>
                             <Input
                               type="color"
                               value={backgroundColor}
                               onChange={(e) => setBackgroundColor(e.target.value)}
                             />
                           </div>
                           <div>
                             <Label>Text Color</Label>
                             <Input
                               type="color"
                               value={textColor}
                               onChange={(e) => setTextColor(e.target.value)}
                             />
                           </div>
                         </div>
                       </div>
                     </ScrollArea>
                   </TabsContent>

                   <TabsContent value="buttons" className="space-y-4">
                     <ScrollArea className="h-[400px] pr-4">
                       <div className="space-y-4">
                         {buttons.map((button, index) => (
                           <Card key={index}>
                             <CardContent className="p-4 space-y-3">
                               <div className="flex justify-between items-center">
                                 <Badge variant="outline">Button {index + 1}</Badge>
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => removeButton(index)}
                                   disabled={buttons.length <= 1}
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                               
                               <div>
                                 <Label>Text</Label>
                                 <Input
                                   value={button.text}
                                   onChange={(e) => updateButton(index, { text: e.target.value })}
                                   placeholder="Button Text"
                                 />
                               </div>
                               
                               <div>
                                 <Label>URL</Label>
                                 <Input
                                   value={button.url}
                                   onChange={(e) => updateButton(index, { url: e.target.value })}
                                   placeholder="https://example.com or /page"
                                 />
                               </div>
                               
                               <div>
                                 <Label>Style</Label>
                                 <Select
                                   value={button.style}
                                   onValueChange={(value) => updateButton(index, { style: value as 'primary' | 'secondary' })}
                                 >
                                   <SelectTrigger>
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="primary">Primary</SelectItem>
                                     <SelectItem value="secondary">Secondary</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                         
                         <Button
                           onClick={addButton}
                           disabled={buttons.length >= 4}
                           className="w-full"
                         >
                           <Plus className="w-4 h-4 mr-2" />
                           Add Button
                         </Button>
                       </div>
                     </ScrollArea>
                   </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="flex-1 bg-gray-50 p-4">
              <div className="text-center text-muted-foreground">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8" style={{ width: device.width, height: device.height, maxWidth: '100%', maxHeight: '100%', margin: '0 auto' }}>
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {device.name} View ({device.width}×{device.height})
                  </p>
                  <div className="space-y-2 text-left">
                    <p><strong>Title:</strong> {title || 'Title'}</p>
                    <p><strong>Subtitle:</strong> {subtitle || 'Subtitle'}</p>
                    <p><strong>Theme:</strong> {theme.name}</p>
                    <p><strong>Buttons:</strong> {buttons.length} configured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
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