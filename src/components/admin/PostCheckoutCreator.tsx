import React, { useState, useEffect } from 'react';
import { AdminFormLayout, AdminFormSection } from './AdminFormLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Upload, Eye } from 'lucide-react';

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
  logo_position?: { x: number; y: number };
  title_position?: { x: number; y: number };
  subtitle_position?: { x: number; y: number };
  buttons_position?: { x: number; y: number };
  buttons: PostCheckoutButton[];
  background_color?: string;
  text_color?: string;
  cover_page_id?: string;
  affiliate_id?: string;
  is_template?: boolean;
  theme?: string;
}

interface PostCheckoutCreatorProps {
  onBack?: () => void;
  initial?: PostCheckoutConfig | null;
  onSaved?: () => void;
}

export const PostCheckoutCreator: React.FC<PostCheckoutCreatorProps> = ({
  onBack,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<PostCheckoutConfig>({
    title: 'Order Confirmed!',
    subtitle: 'Thank you for your order. We\'ll send you updates on your delivery.',
    logo_url: '',
    buttons: [
      { text: 'Track Your Order', url: '/orders', style: 'primary' },
      { text: 'Continue Shopping', url: '/', style: 'secondary' }
    ],
    background_color: '#ffffff',
    text_color: '#000000',
    cover_page_id: '',
    affiliate_id: '',
    is_template: false,
    theme: 'success'
  });

  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditing = !!initial?.id;

  useEffect(() => {
    loadRelatedData();
    if (initial) {
      setConfig(initial);
    }
  }, [initial]);

  const loadRelatedData = async () => {
    try {
      // Load cover pages only (affiliates will be loaded via admin dashboard context)
      const [coverPagesRes] = await Promise.all([
        supabase.from('cover_pages').select('id, title, slug').order('created_at', { ascending: false })
      ]);
      
      setCoverPages(coverPagesRes.data || []);
      // For now, use empty affiliates until proper edge function integration
      setAffiliates([]);
    } catch (error) {
      console.error('Error loading related data:', error);
      // Set empty arrays as fallback
      setCoverPages([]);
      setAffiliates([]);
    }
  };

  const addButton = () => {
    if (config.buttons.length < 4) {
      setConfig(prev => ({
        ...prev,
        buttons: [...prev.buttons, { text: 'New Button', url: '#', style: 'secondary' }]
      }));
    }
  };

  const removeButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, updates: Partial<PostCheckoutButton>) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => i === index ? { ...button, ...updates } : button)
    }));
  };

  const handleSave = async () => {
    if (!config.title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure admin context is set before any database operations
      const { data: authData, error: authError } = await supabase.functions.invoke('verify-admin-google', {
        body: { email: 'brian@partyondelivery.com' }
      });
      
      if (authError || !authData?.isAdmin) {
        console.error('Admin verification failed:', authError);
        throw new Error('Admin verification failed');
      }

      // Fix table name and data structure for post_checkout_pages
      const pageData = {
        name: config.title,
        slug: isEditing ? config.id || 'post-checkout' : `${config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
        content: JSON.parse(JSON.stringify({
          title: config.title,
          subtitle: config.subtitle,
          logo_url: config.logo_url,
          buttons: config.buttons,
          background_color: config.background_color,
          text_color: config.text_color,
          theme: config.theme
        })),
        is_active: true,
        is_default: config.is_template || false
      };

      console.log('Saving post-checkout page data:', pageData);

      let result;
      if (isEditing && config.id) {
        console.log('Updating existing post-checkout page:', config.id);
        result = await supabase
          .from('post_checkout_pages')
          .update(pageData)
          .eq('id', config.id);
      } else {
        console.log('Creating new post-checkout page');
        result = await supabase
          .from('post_checkout_pages')
          .insert(pageData);
      }

      console.log('Database result:', result);

      if (result.error) {
        console.error('Supabase error details:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });
        throw result.error;
      }

      toast({
        title: "Success",
        description: `Post-checkout page ${isEditing ? 'updated' : 'created'} successfully`,
      });

      onSaved?.();

    } catch (error: any) {
      console.error('Error saving post-checkout page:', error);
      toast({
        title: "Error", 
        description: `Failed to save post-checkout page: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new tab
    window.open('/post-checkout/preview', '_blank');
  };

  return (
    <AdminFormLayout
      title={isEditing ? 'Edit Post-Checkout Screen' : 'Create Post-Checkout Screen'}
      subtitle="Design the confirmation screen customers see after completing their order"
      onBack={onBack}
      onSave={handleSave}
      onPreview={handlePreview}
      saving={saving}
      canSave={!!config.title}
    >
      <AdminFormSection
        title="Content"
        description="Set up the main content for your post-checkout screen"
      >
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={config.title}
            onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Order Confirmed!"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Textarea
            id="subtitle"
            value={config.subtitle}
            onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Thank you for your order. We'll send you updates on your delivery."
            rows={3}
          />
        </div>

          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo_url"
                value={config.logo_url}
                onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="flex-1"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  // Create a temporary file input for upload
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    
                    try {
                      const ext = file.name.split('.').pop() || 'png';
                      const fileName = `post-checkout-${Date.now()}-logo.${ext}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from('delivery-app-assets')
                        .upload(fileName, file, { cacheControl: '3600', upsert: true });
                      
                      if (uploadError) throw uploadError;
                      
                      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
                      setConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
                      toast({ title: 'Logo uploaded successfully!' });
                    } catch (error) {
                      console.error('Upload failed:', error);
                      toast({ title: 'Upload failed', variant: 'destructive' });
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {config.logo_url && (
              <div className="mt-2">
                <img src={config.logo_url} alt="Logo preview" className="h-12 object-contain rounded border p-1" />
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection
          title="Element Positioning"
          description="Control the position of elements on your post-checkout screen"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Logo:</span>
                <Slider
                  value={[config.logo_position?.y || 10]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    logo_position: { x: prev.logo_position?.x || 50, y: value }
                  }))}
                  max={90}
                  min={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{config.logo_position?.y || 10}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Title:</span>
                <Slider
                  value={[config.title_position?.y || 30]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    title_position: { x: prev.title_position?.x || 50, y: value }
                  }))}
                  max={90}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{config.title_position?.y || 30}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Subtitle:</span>
                <Slider
                  value={[config.subtitle_position?.y || 40]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    subtitle_position: { x: prev.subtitle_position?.x || 50, y: value }
                  }))}
                  max={90}
                  min={15}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{config.subtitle_position?.y || 40}%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Buttons:</span>
                <Slider
                  value={[config.buttons_position?.y || 70]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    buttons_position: { x: prev.buttons_position?.x || 50, y: value }
                  }))}
                  max={95}
                  min={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{config.buttons_position?.y || 70}%</span>
              </div>
            </div>
          </div>
      </AdminFormSection>

      <AdminFormSection
        title="Design"
        description="Customize the visual appearance of your post-checkout screen"
      >
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={config.theme}
            onValueChange={(value) => setConfig(prev => ({ ...prev, theme: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="success">Success (Green)</SelectItem>
              <SelectItem value="celebration">Celebration (Gold)</SelectItem>
              <SelectItem value="elegant">Elegant (Purple)</SelectItem>
              <SelectItem value="minimal">Minimal (Gray)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="background_color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="background_color"
                type="color"
                value={config.background_color}
                onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                className="w-16"
              />
              <Input
                value={config.background_color}
                onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="text_color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="text_color"
                type="color"
                value={config.text_color}
                onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                className="w-16"
              />
              <Input
                value={config.text_color}
                onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Action Buttons"
        description="Configure the action buttons on your post-checkout screen"
      >
        <div className="space-y-4">
          {config.buttons.map((button, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={button.text}
                    onChange={(e) => updateButton(index, { text: e.target.value })}
                    placeholder="Button Text"
                  />
                </div>
                <div>
                  <Label>Button Style</Label>
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
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  value={button.url}
                  onChange={(e) => updateButton(index, { url: e.target.value })}
                  placeholder="https://example.com or /page"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeButton(index)}
                  disabled={config.buttons.length <= 1}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Button
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addButton}
            disabled={config.buttons.length >= 4}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Associations"
        description="Link this post-checkout screen to cover pages and affiliates"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cover_page_id">Associated Cover Page</Label>
            <Select
              value={config.cover_page_id}
              onValueChange={(value) => setConfig(prev => ({ ...prev, cover_page_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cover page..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {coverPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.title} ({page.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="affiliate_id">Associated Affiliate</Label>
            <Select
              value={config.affiliate_id}
              onValueChange={(value) => setConfig(prev => ({ ...prev, affiliate_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select affiliate..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {affiliates.map((affiliate) => (
                  <SelectItem key={affiliate.id} value={affiliate.id}>
                    {affiliate.name} ({affiliate.company_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_template"
            checked={config.is_template}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_template: checked }))}
          />
          <Label htmlFor="is_template">Use as Template</Label>
        </div>
      </AdminFormSection>
    </AdminFormLayout>
  );
};