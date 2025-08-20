import React, { useState, useEffect } from 'react';
import { AdminFormLayout, AdminFormSection } from './AdminFormLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
      const [coverPagesRes, affiliatesRes] = await Promise.all([
        supabase.from('cover_pages').select('id, title, slug').order('created_at', { ascending: false }),
        supabase.from('affiliates').select('id, name, company_name').order('created_at', { ascending: false })
      ]);
      
      setCoverPages(coverPagesRes.data || []);
      setAffiliates(affiliatesRes.data || []);
    } catch (error) {
      console.error('Error loading related data:', error);
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
      const payload = {
        title: config.title,
        subtitle: config.subtitle || '',
        logo_url: config.logo_url || null,
        button_1_text: config.buttons[0]?.text || '',
        button_1_url: config.buttons[0]?.url || '',
        button_2_text: config.buttons[1]?.text || '',
        button_2_url: config.buttons[1]?.url || '',
        background_color: config.background_color,
        text_color: config.text_color,
        cover_page_id: config.cover_page_id || null,
        affiliate_id: config.affiliate_id || null,
        is_template: config.is_template,
        styles: JSON.parse(JSON.stringify({
          theme: config.theme,
          buttons: config.buttons
        }))
      };

      let result;
      if (isEditing && config.id) {
        result = await supabase
          .from('post_checkout_screens')
          .update(payload)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('post_checkout_screens')
          .insert(payload);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Post-checkout screen ${isEditing ? 'updated' : 'created'} successfully`,
      });

      onSaved?.();

    } catch (error) {
      console.error('Error saving post-checkout screen:', error);
      toast({
        title: "Error",
        description: "Failed to save post-checkout screen",
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
            <Button variant="outline">
              <Upload className="h-4 w-4" />
            </Button>
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
                <SelectItem value="">None</SelectItem>
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
                <SelectItem value="">None</SelectItem>
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