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

interface CoverButton {
  text: string;
  type: 'delivery_app' | 'checkout' | 'url';
  app_slug?: string;
  url?: string;
  style?: 'filled' | 'outline';
}

interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: CoverButton[];
  is_active: boolean;
  theme?: string;
}

interface CoverPageCreatorProps {
  onBack?: () => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

export const CoverPageCreator: React.FC<CoverPageCreatorProps> = ({
  onBack,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<CoverPageConfig>({
    slug: '',
    title: '',
    subtitle: '',
    logo_url: '',
    bg_image_url: '',
    bg_video_url: '',
    checklist: ['Premium Alcohol Delivery', 'White-Glove Service', 'Exclusive Member Access'],
    buttons: [
      { text: 'ORDER NOW', type: 'delivery_app', style: 'filled' },
      { text: 'VIEW COLLECTION', type: 'url', url: '#collection', style: 'outline' }
    ],
    is_active: true,
    theme: 'gold'
  });

  const [apps, setApps] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditing = !!initial?.id;

  useEffect(() => {
    loadApps();
    if (initial) {
      setConfig(initial);
    }
  }, [initial]);

  const loadApps = async () => {
    try {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('app_slug, app_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setApps(data || []);
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const generateSlug = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setConfig(prev => ({ ...prev, slug }));
  };

  const addChecklistItem = () => {
    setConfig(prev => ({
      ...prev,
      checklist: [...prev.checklist, 'New Feature']
    }));
  };

  const removeChecklistItem = (index: number) => {
    setConfig(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => i === index ? value : item)
    }));
  };

  const addButton = () => {
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: 'New Button', type: 'url', url: '#', style: 'filled' }]
    }));
  };

  const removeButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, updates: Partial<CoverButton>) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => i === index ? { ...button, ...updates } : button)
    }));
  };

  const handleSave = async () => {
    if (!config.title || !config.slug) {
      toast({
        title: "Error",
        description: "Title and slug are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure admin context is set before any database operations
      const { data: authData, error: authError } = await supabase.functions.invoke('verify-admin-google', {
        body: { email: 'brian@partyondelivery.com' } // TODO: Get from auth context
      });
      
      if (authError || !authData?.isAdmin) {
        console.error('Admin verification failed:', authError);
        throw new Error('Admin verification failed');
      }

      const pageData = {
        slug: config.slug,
        title: config.title,
        subtitle: config.subtitle,
        logo_url: config.logo_url,
        bg_image_url: config.bg_image_url,
        bg_video_url: config.bg_video_url,
        checklist: JSON.parse(JSON.stringify(config.checklist)),
        buttons: JSON.parse(JSON.stringify(config.buttons)),
        is_active: config.is_active,
        styles: JSON.parse(JSON.stringify({
          theme: config.theme
        }))
      };

      console.log('Saving cover page data:', pageData);

      let result;
      if (isEditing && config.id) {
        console.log('Updating existing cover page:', config.id);
        result = await supabase
          .from('cover_pages')
          .update(pageData)
          .eq('id', config.id);
      } else {
        console.log('Creating new cover page');
        result = await supabase
          .from('cover_pages')
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
        description: `Cover page ${isEditing ? 'updated' : 'created'} successfully`,
      });

      onSaved?.();

    } catch (error: any) {
      console.error('Error saving cover page:', error);
      toast({
        title: "Error",
        description: `Failed to save cover page: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (config.slug) {
      window.open(`/${config.slug}`, '_blank');
    }
  };

  return (
    <AdminFormLayout
      title={isEditing ? 'Edit Cover Page' : 'Create Cover Page'}
      subtitle="Design your cover page with custom branding and call-to-action buttons"
      onBack={onBack}
      onSave={handleSave}
      onPreview={handlePreview}
      saving={saving}
      canSave={!!config.title && !!config.slug}
    >
      <AdminFormSection
        title="Basic Information"
        description="Set up the basic details for your cover page"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, title: e.target.value }));
                if (!isEditing) generateSlug(e.target.value);
              }}
              placeholder="Elite Concierge"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={config.slug}
              onChange={(e) => setConfig(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="elite-concierge"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={config.subtitle}
            onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Luxury Lifestyle Services"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Media Assets"
        description="Upload logo and background media for your cover page"
      >
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="bg_image_url">Background Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="bg_image_url"
                value={config.bg_image_url}
                onChange={(e) => setConfig(prev => ({ ...prev, bg_image_url: e.target.value }))}
                placeholder="https://example.com/background.jpg"
                className="flex-1"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="bg_video_url">Background Video URL</Label>
          <Input
            id="bg_video_url"
            value={config.bg_video_url}
            onChange={(e) => setConfig(prev => ({ ...prev, bg_video_url: e.target.value }))}
            placeholder="https://example.com/background.mp4"
          />
        </div>

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
              <SelectItem value="gold">Luxury Gold</SelectItem>
              <SelectItem value="platinum">Modern Platinum</SelectItem>
              <SelectItem value="ocean">Ocean Depth</SelectItem>
              <SelectItem value="sunset">Sunset Glow</SelectItem>
              <SelectItem value="forest">Forest Green</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Feature Checklist"
        description="Add key features or benefits to highlight on your cover page"
      >
        <div className="space-y-2">
          {config.checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => updateChecklistItem(index, e.target.value)}
                placeholder="Feature description"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeChecklistItem(index)}
                disabled={config.checklist.length <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addChecklistItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Action Buttons"
        description="Configure call-to-action buttons for your cover page"
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
                    onValueChange={(value) => updateButton(index, { style: value as 'filled' | 'outline' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button Type</Label>
                  <Select
                    value={button.type}
                    onValueChange={(value) => updateButton(index, { type: value as any })}
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
                </div>
                <div>
                  {button.type === 'delivery_app' ? (
                    <div>
                      <Label>Select App</Label>
                      <Select
                        value={button.app_slug}
                        onValueChange={(value) => updateButton(index, { app_slug: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select app" />
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
                  ) : (
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={button.url}
                        onChange={(e) => updateButton(index, { url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                </div>
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
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        </div>
      </AdminFormSection>
    </AdminFormLayout>
  );
};