import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Copy, 
  Save,
  Home,
  Truck,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  is_active: boolean;
  is_homepage: boolean;
  is_default?: boolean;
  theme_color?: string;
  delivery_radius?: number;
  delivery_fee?: number;
  business_name?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  primary_color?: string;
  secondary_color?: string;
  announcement_text?: string;
  created_at: string;
  updated_at: string;
  collections_config?: any;
  main_app_config?: any;
}

interface DeliveryAppFormData {
  app_name: string;
  app_slug: string;
  logo_url: string;
  business_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  primary_color: string;
  secondary_color: string;
  theme_color: string;
  delivery_radius: number;
  delivery_fee: number;
  announcement_text: string;
  is_active: boolean;
  is_homepage: boolean;
}

export const EnhancedDeliveryAppManager: React.FC = () => {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<DeliveryAppFormData>({
    app_name: '',
    app_slug: '',
    logo_url: '',
    business_name: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    theme_color: '#3B82F6',
    delivery_radius: 10,
    delivery_fee: 5.99,
    announcement_text: '',
    is_active: true,
    is_homepage: false
  });

  const loadDeliveryApps = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryApps((data || []).map(app => ({ ...app, is_default: false })));
    } catch (error) {
      console.error('Error loading delivery apps:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryApps();
  }, [loadDeliveryApps]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleCreate = async () => {
    if (!formData.app_name.trim()) {
      toast.error('Please enter an app name');
      return;
    }

    if (!formData.app_slug.trim()) {
      setFormData(prev => ({ ...prev, app_slug: generateSlug(formData.app_name) }));
    }

    try {
      setLoading(true);
      
      const appData = {
        ...formData,
        app_slug: formData.app_slug || generateSlug(formData.app_name),
        collections_config: {
          tab_count: 4,
          tabs: [
            { name: 'Beer', collection_handle: 'beer', icon: '🍺' },
            { name: 'Wine', collection_handle: 'wine', icon: '🍷' },
            { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
            { name: 'Mixers', collection_handle: 'mixers', icon: '🥤' }
          ]
        },
        main_app_config: {
          hero_heading: formData.hero_title || formData.app_name,
          hero_subheading: formData.hero_subtitle || 'Premium delivery service',
          hero_scrolling_text: 'Fast & Reliable'
        }
      };

      const { data, error } = await supabase
        .from('delivery_app_variations')
        .insert([appData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Delivery app created successfully');
      setShowCreateForm(false);
      resetForm();
      loadDeliveryApps();
    } catch (error) {
      console.error('Error creating delivery app:', error);
      toast.error('Failed to create delivery app');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingApp) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({
          app_name: formData.app_name,
          app_slug: formData.app_slug,
          logo_url: formData.logo_url,
          business_name: formData.business_name,
          hero_title: formData.hero_title,
          hero_subtitle: formData.hero_subtitle,
          hero_image_url: formData.hero_image_url,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          theme_color: formData.theme_color,
          delivery_radius: formData.delivery_radius,
          delivery_fee: formData.delivery_fee,
          announcement_text: formData.announcement_text,
          is_active: formData.is_active,
          is_homepage: formData.is_homepage,
          updated_at: new Date().toISOString(),
          main_app_config: {
            hero_heading: formData.hero_title || formData.app_name,
            hero_subheading: formData.hero_subtitle || 'Premium delivery service',
            hero_scrolling_text: 'Fast & Reliable'
          }
        })
        .eq('id', editingApp.id);

      if (error) throw error;

      toast.success('Delivery app updated successfully');
      setEditingApp(null);
      resetForm();
      loadDeliveryApps();
    } catch (error) {
      console.error('Error updating delivery app:', error);
      toast.error('Failed to update delivery app');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (app: DeliveryApp) => {
    if (app.is_homepage) {
      toast.error('Cannot delete the homepage app. Set another app as homepage first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${app.app_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', app.id);

      if (error) throw error;

      toast.success('Delivery app deleted successfully');
      loadDeliveryApps();
    } catch (error) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
    } finally {
      setLoading(false);
    }
  };

  const handleSetHomepage = async (app: DeliveryApp) => {
    try {
      setLoading(true);
      
      // First remove homepage status from all apps
      await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: false })
        .neq('id', app.id);

      // Then set this app as homepage
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: true, is_active: true })
        .eq('id', app.id);

      if (error) throw error;

      toast.success(`"${app.app_name}" is now the homepage delivery app`);
      loadDeliveryApps();
    } catch (error) {
      console.error('Error setting homepage app:', error);
      toast.error('Failed to set homepage app');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (app: DeliveryApp) => {
    if (app.is_homepage && app.is_active) {
      toast.error('Cannot deactivate the homepage app. Set another app as homepage first.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);

      if (error) throw error;

      toast.success(`Delivery app ${!app.is_active ? 'activated' : 'deactivated'}`);
      loadDeliveryApps();
    } catch (error) {
      console.error('Error toggling delivery app status:', error);
      toast.error('Failed to update delivery app status');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (app: DeliveryApp) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_app_variations')
        .insert([{
          app_name: `${app.app_name} (Copy)`,
          app_slug: `${app.app_slug}-copy-${Date.now()}`,
          logo_url: app.logo_url,
          business_name: app.business_name,
          hero_title: app.hero_title,
          hero_subtitle: app.hero_subtitle,
          hero_image_url: app.hero_image_url,
          primary_color: app.primary_color,
          secondary_color: app.secondary_color,
          theme_color: app.theme_color,
          delivery_radius: app.delivery_radius,
          delivery_fee: app.delivery_fee,
          announcement_text: app.announcement_text,
          collections_config: app.collections_config,
          main_app_config: app.main_app_config,
          is_active: false,
          is_homepage: false,
          is_default: false
        }]);

      if (error) throw error;

      toast.success('Delivery app duplicated successfully');
      loadDeliveryApps();
    } catch (error) {
      console.error('Error duplicating delivery app:', error);
      toast.error('Failed to duplicate delivery app');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (app: DeliveryApp) => {
    setEditingApp(app);
    setFormData({
      app_name: app.app_name,
      app_slug: app.app_slug,
      logo_url: app.logo_url || '',
      business_name: app.business_name || '',
      hero_title: app.hero_title || '',
      hero_subtitle: app.hero_subtitle || '',
      hero_image_url: app.hero_image_url || '',
      primary_color: app.primary_color || '#3B82F6',
      secondary_color: app.secondary_color || '#1E40AF',
      theme_color: app.theme_color || '#3B82F6',
      delivery_radius: app.delivery_radius || 10,
      delivery_fee: app.delivery_fee || 5.99,
      announcement_text: app.announcement_text || '',
      is_active: app.is_active,
      is_homepage: app.is_homepage
    });
  };

  const resetForm = () => {
    setFormData({
      app_name: '',
      app_slug: '',
      logo_url: '',
      business_name: '',
      hero_title: '',
      hero_subtitle: '',
      hero_image_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      theme_color: '#3B82F6',
      delivery_radius: 10,
      delivery_fee: 5.99,
      announcement_text: '',
      is_active: true,
      is_homepage: false
    });
  };

  const cancelEdit = () => {
    setEditingApp(null);
    setShowCreateForm(false);
    resetForm();
  };

  const homepageApp = deliveryApps.find(app => app.is_homepage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Delivery App Manager</h3>
          <p className="text-muted-foreground">
            Create and manage delivery applications and configure homepage settings
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
          disabled={showCreateForm || editingApp !== null}
        >
          <Plus className="h-4 w-4" />
          Create Delivery App
        </Button>
      </div>

      {/* Homepage Status */}
      {homepageApp && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                Current homepage app: <strong>"{homepageApp.app_name}"</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingApp) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingApp ? `Edit Delivery App: ${editingApp.app_name}` : 'Create New Delivery App'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">App Name *</Label>
                <Input
                  id="app_name"
                  value={formData.app_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    app_name: e.target.value,
                    app_slug: generateSlug(e.target.value)
                  }))}
                  placeholder="Enter app name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_slug">URL Slug</Label>
                <Input
                  id="app_slug"
                  value={formData.app_slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, app_slug: e.target.value }))}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Hero Title</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
                  placeholder="Main headline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                <Input
                  id="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                  placeholder="Subheading text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_image_url">Hero Image URL</Label>
              <Input
                id="hero_image_url"
                value={formData.hero_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_image_url: e.target.value }))}
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme_color">Theme Color</Label>
                <Input
                  id="theme_color"
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_radius">Delivery Radius (miles)</Label>
                <Input
                  id="delivery_radius"
                  type="number"
                  value={formData.delivery_radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_radius: parseFloat(e.target.value) || 0 }))}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
                  placeholder="5.99"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement_text">Announcement Text</Label>
              <Textarea
                id="announcement_text"
                value={formData.announcement_text}
                onChange={(e) => setFormData(prev => ({ ...prev, announcement_text: e.target.value }))}
                placeholder="Special announcements or promotions"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_homepage"
                  checked={formData.is_homepage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_homepage: checked }))}
                />
                <Label htmlFor="is_homepage">Set as Homepage</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingApp ? handleUpdate : handleCreate}
                disabled={loading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {editingApp ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Apps List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Apps ({deliveryApps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && deliveryApps.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading delivery apps...</p>
            </div>
          ) : deliveryApps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No delivery apps created yet</p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Delivery App
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {deliveryApps.map((app) => (
                  <Card key={app.id} className={`${app.is_homepage ? 'border-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{app.app_name}</h4>
                            {app.is_homepage && (
                              <Badge variant="default" className="gap-1">
                                <Home className="h-3 w-3" />
                                Homepage
                              </Badge>
                            )}
                            <Badge variant={app.is_active ? 'default' : 'secondary'}>
                              {app.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {app.business_name && (
                            <p className="text-sm text-muted-foreground mb-1">Business: {app.business_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Slug: /app/{app.app_slug} • Fee: ${app.delivery_fee} • Radius: {app.delivery_radius}mi
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(app)}
                            disabled={loading}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(app)}
                            disabled={loading || editingApp !== null || showCreateForm}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(app)}
                            disabled={loading}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {!app.is_homepage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetHomepage(app)}
                              disabled={loading}
                            >
                              <Home className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(app)}
                            disabled={loading || app.is_homepage}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};