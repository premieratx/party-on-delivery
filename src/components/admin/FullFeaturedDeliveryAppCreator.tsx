import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FontSelector } from '@/components/ui/font-selector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Star, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
}

interface DeliveryArea {
  name: string;
  coordinates: number[];
  fee: number;
}

interface DeliveryApp {
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url: string;
  is_active: boolean;
  is_homepage?: boolean;
  is_default?: boolean;
  theme_color?: string;
  delivery_radius?: number;
  delivery_fee?: number;
  business_name?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  hero_video_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  announcement_text?: string;
  announcement_type?: string;
  delivery_areas?: DeliveryArea[];
  custom_css?: string;
  styles?: any;
}

const defaultFontStyle: FontStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000'
};

export const FullFeaturedDeliveryAppCreator: React.FC = () => {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<DeliveryApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<DeliveryApp>({
    app_name: '',
    app_slug: '',
    logo_url: '',
    is_active: true,
    is_homepage: false,
    theme_color: '#000000',
    delivery_radius: 10,
    delivery_fee: 5.99,
    styles: {}
  });

  useEffect(() => {
    loadDeliveryApps();
  }, []);

  const loadDeliveryApps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.app_name || !formData.app_slug) {
      toast.error('App name and slug are required');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        app_name: formData.app_name,
        logo_url: formData.logo_url,
        is_active: formData.is_active,
        is_homepage: formData.is_homepage,
        theme_color: formData.theme_color,
        delivery_radius: formData.delivery_radius,
        delivery_fee: formData.delivery_fee,
        hero_title: formData.hero_title,
        hero_subtitle: formData.hero_subtitle,
        hero_image_url: formData.hero_image_url,
        hero_video_url: formData.hero_video_url,
      };
      
      if (selectedApp?.id) {
        // Update existing
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(updateData)
          .eq('id', selectedApp.id);

        if (error) throw error;
        toast.success('Delivery app updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert({
            ...updateData,
            app_slug: formData.app_slug
          });

        if (error) throw error;
        toast.success('Delivery app created successfully');
      }

      loadDeliveryApps();
      resetForm();
    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast.error('Failed to save delivery app');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery app?')) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Delivery app deleted successfully');
      loadDeliveryApps();
      
      if (selectedApp?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Set as default delivery app');
      loadDeliveryApps();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set as default');
    }
  };

  const selectApp = (app: DeliveryApp) => {
    setSelectedApp(app);
    setFormData({ ...app });
  };

  const resetForm = () => {
    setSelectedApp(null);
    setFormData({
      app_name: '',
      app_slug: '',
      logo_url: '',
      is_active: true,
      is_homepage: false,
      theme_color: '#000000',
      delivery_radius: 10,
      delivery_fee: 5.99,
      styles: {}
    });
  };

  const addDeliveryArea = () => {
    setFormData({
      ...formData,
      delivery_areas: [...formData.delivery_areas, { 
        name: '', 
        coordinates: [], 
        fee: 0 
      }]
    });
  };

  const updateDeliveryArea = (index: number, updates: any) => {
    const newAreas = [...formData.delivery_areas];
    newAreas[index] = { ...newAreas[index], ...updates };
    setFormData({ ...formData, delivery_areas: newAreas });
  };

  const removeDeliveryArea = (index: number) => {
    setFormData({
      ...formData,
      delivery_areas: formData.delivery_areas.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="container mx-auto p-6 max-h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Apps List */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              Delivery Apps
              <Button onClick={resetForm} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {deliveryApps.map((app) => (
                    <div
                      key={app.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedApp?.id === app.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => selectApp(app)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{app.app_name}</h4>
                          <p className="text-sm text-muted-foreground">{app.app_slug}</p>
                          {app.is_default && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded mt-1">
                              <Star className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(app.id!);
                            }}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(app.id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              {selectedApp ? 'Edit Delivery App' : 'Create Delivery App'}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">App Name</label>
                      <Input
                        value={formData.app_name}
                        onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                        placeholder="My Delivery App"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">App Slug</label>
                      <Input
                        value={formData.app_slug}
                        onChange={(e) => setFormData({ ...formData, app_slug: e.target.value })}
                        placeholder="my-delivery-app"
                        disabled={!!selectedApp}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Business Name</label>
                      <Input
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="Business Name"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                      />
                      <label className="text-sm font-medium">Set as Default</label>
                    </div>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Hero Section</h3>
                  <div>
                    <label className="text-sm font-medium">Hero Title</label>
                    <Input
                      value={formData.hero_title}
                      onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                      placeholder="Welcome to our delivery service"
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles?.hero_title}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, hero_title: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hero Subtitle</label>
                    <Textarea
                      value={formData.hero_subtitle}
                      onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                      placeholder="Fast, reliable delivery right to your door"
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles?.hero_subtitle}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, hero_subtitle: style }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Hero Image URL</label>
                      <Input
                        value={formData.hero_image_url}
                        onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Hero Video URL</label>
                      <Input
                        value={formData.hero_video_url}
                        onChange={(e) => setFormData({ ...formData, hero_video_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Branding</h3>
                  <div>
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Primary Color</label>
                      <Input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secondary Color</label>
                      <Input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Accent Color</label>
                      <Input
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Announcement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Announcement</h3>
                  <div>
                    <label className="text-sm font-medium">Announcement Text</label>
                    <Textarea
                      value={formData.announcement_text}
                      onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
                      placeholder="Special announcement text"
                    />
                    <div className="mt-2">
                      <FontSelector
                        value={formData.styles.announcement}
                        onChange={(style) => setFormData({
                          ...formData,
                          styles: { ...formData.styles, announcement: style }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Announcement Type</label>
                    <Select
                      value={formData.announcement_type}
                      onValueChange={(value) => setFormData({ ...formData, announcement_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Delivery Areas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Delivery Areas</h3>
                    <Button onClick={addDeliveryArea} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Area
                    </Button>
                  </div>
                  {formData.delivery_areas.map((area, index) => (
                    <div key={index} className="border rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Area {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDeliveryArea(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={area.name || ''}
                          onChange={(e) => updateDeliveryArea(index, { name: e.target.value })}
                          placeholder="Area name"
                        />
                        <Input
                          type="number"
                          value={area.fee || 0}
                          onChange={(e) => updateDeliveryArea(index, { fee: parseFloat(e.target.value) || 0 })}
                          placeholder="Delivery fee"
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom CSS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Custom CSS</h3>
                  <Textarea
                    value={formData.custom_css}
                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                    placeholder="/* Custom CSS styles */"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};