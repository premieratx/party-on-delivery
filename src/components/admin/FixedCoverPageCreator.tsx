import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Trash2, Layout, Eye, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverPageButton {
  id: string;
  text: string;
  type: 'delivery_app' | 'checkout' | 'url';
  target_value: string;
  style: string;
}

interface CoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

const BUTTON_STYLES = [
  { value: 'primary', label: 'Primary Button' },
  { value: 'secondary', label: 'Secondary Button' },
  { value: 'outline', label: 'Outline Button' },
  { value: 'ghost', label: 'Ghost Button' }
];

const BUTTON_TYPES = [
  { value: 'delivery_app', label: 'Delivery App' },
  { value: 'checkout', label: 'Direct Checkout' },
  { value: 'url', label: 'Custom URL' }
];

export const FixedCoverPageCreator: React.FC<CoverPageCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgVideoUrl, setBgVideoUrl] = useState('');
  const [buttons, setButtons] = useState<CoverPageButton[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isDefaultHomepage, setIsDefaultHomepage] = useState(false);
  
  // Loading state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deliveryApps, setDeliveryApps] = useState<Array<{id: string, app_name: string, app_slug: string}>>([]);

  // Load delivery apps for button targets
  useEffect(() => {
    if (open) {
      loadDeliveryApps();
    }
  }, [open]);

  const loadDeliveryApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug')
        .eq('is_active', true);

      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    }
  };

  // Auto-clear form when dialog opens for new creation
  useEffect(() => {
    if (open) {
      if (initial) {
        // Load existing data for editing
        setTitle(initial.title || '');
        setSubtitle(initial.subtitle || '');
        setSlug(initial.slug || '');
        setLogoUrl(initial.logo_url || '');
        setBgImageUrl(initial.bg_image_url || '');
        setBgVideoUrl(initial.bg_video_url || '');
        setButtons(Array.isArray(initial.buttons) ? initial.buttons : []);
        setIsActive(initial.is_active ?? true);
        setIsDefaultHomepage(initial.is_default_homepage ?? false);
      } else {
        // Clear form for new creation
        setTitle('');
        setSubtitle('');
        setSlug('');
        setLogoUrl('');
        setBgImageUrl('');
        setBgVideoUrl('');
        setButtons([]);
        setIsActive(true);
        setIsDefaultHomepage(false);
      }
    }
  }, [open, initial]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setTitle(title);
    if (!initial) {
      setSlug(generateSlug(title));
    }
  };

  const addButton = () => {
    const newButton: CoverPageButton = {
      id: Date.now().toString(),
      text: '',
      type: 'delivery_app',
      target_value: '',
      style: 'primary'
    };
    setButtons([...buttons, newButton]);
  };

  const updateButton = (index: number, updates: Partial<CoverPageButton>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setButtons(newButtons);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and slug",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const coverPageData = {
        title,
        subtitle,
        slug,
        logo_url: logoUrl,
        bg_image_url: bgImageUrl,
        bg_video_url: bgVideoUrl,
        buttons: buttons as any,
        is_active: isActive,
        is_default_homepage: isDefaultHomepage,
        styles: {} as any,
        checklist: [] as any,
        updated_at: new Date().toISOString()
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('cover_pages')
          .update(coverPageData)
          .eq('id', initial.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Cover page updated successfully"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('cover_pages')
          .insert(coverPageData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Cover page created successfully"
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving cover page:', error);
      toast({
        title: "Error",
        description: "Failed to save cover page",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cover-assets')
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-full overflow-hidden" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            {initial ? 'Edit' : 'Create'} Cover Page
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Design and build custom cover pages with drag-and-drop components and live preview.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="basic" className="space-y-4 h-full overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Welcome to Party On Delivery"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g., party-on-delivery"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., Premium alcohol and party supplies delivered fast"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoUrl">Logo</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png or upload below"
                        className="flex-1"
                      />
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLogoUrl('')}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <Button type="button" variant="outline" size="sm" disabled={uploading}>
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                      </label>
                      
                      {logoUrl && (
                        <div className="flex items-center gap-2">
                          <img src={logoUrl} alt="Logo preview" className="w-8 h-8 object-contain rounded" />
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bgImageUrl">Background Image URL</Label>
                  <Input
                    id="bgImageUrl"
                    value={bgImageUrl}
                    onChange={(e) => setBgImageUrl(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bgVideoUrl">Background Video URL</Label>
                <Input
                  id="bgVideoUrl"
                  value={bgVideoUrl}
                  onChange={(e) => setBgVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isDefaultHomepage}
                    onCheckedChange={setIsDefaultHomepage}
                  />
                  <Label>Set as Default Homepage</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buttons" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Action Buttons</h3>
                  <Button onClick={addButton} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </div>

                <div className="space-y-4">
                  {buttons.map((button, index) => (
                    <Card key={button.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">Button {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeButton(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Button Text</Label>
                            <Input
                              value={button.text}
                              onChange={(e) => updateButton(index, { text: e.target.value })}
                              placeholder="e.g., Order Now"
                            />
                          </div>
                          <div>
                            <Label>Button Style</Label>
                            <Select
                              value={button.style}
                              onValueChange={(value) => updateButton(index, { style: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUTTON_STYLES.map((style) => (
                                  <SelectItem key={style.value} value={style.value}>
                                    {style.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Button Type</Label>
                          <Select
                            value={button.type}
                            onValueChange={(value: any) => updateButton(index, { type: value, target_value: '' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUTTON_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Target</Label>
                          {button.type === 'delivery_app' ? (
                            <Select
                              value={button.target_value}
                              onValueChange={(value) => updateButton(index, { target_value: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a delivery app" />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryApps.map((app) => (
                                  <SelectItem key={app.id} value={app.app_slug}>
                                    {app.app_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={button.target_value}
                              onChange={(e) => updateButton(index, { target_value: e.target.value })}
                              placeholder={button.type === 'url' ? 'https://example.com' : '/checkout'}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center space-y-2">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Preview will be available after saving</p>
                </div>
              </div>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Cover Page
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};