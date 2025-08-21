import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Copy,
  Home,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Link
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FixedDeliveryAppCreator } from './FixedDeliveryAppCreator';


interface Tab {
  index: number;
  name: string;
  collection_handle: string;
}

interface OccasionButton {
  title: string;
  collection_handle: string;
  enabled: boolean;
}

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  is_active: boolean;
  is_homepage: boolean;
  business_name?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  primary_color?: string;
  secondary_color?: string;
  theme_color?: string;
  delivery_radius?: number;
  delivery_fee?: number;
  announcement_text?: string;
  created_at: string;
  updated_at: string;
  collections_config?: any;
  main_app_config?: any;
}

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  main_app_config: {
    hero_heading: string;
    hero_subheading: string;
  };
  collections_config: {
    tab_count: number;
    tabs: { name: string; collection_handle: string; icon?: string }[];
  };
  is_homepage: boolean;
  is_active: boolean;
}

export const EnhancedDeliveryAppManager: React.FC = () => {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryAppConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadDeliveryApps = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadDeliveryApps();
  }, [loadDeliveryApps]);

  const handleCreateNew = () => {
    setEditingApp(null);
    setShowEditor(true);
  };

  const handleEdit = (app: DeliveryApp) => {
    // Convert DeliveryApp to DeliveryAppConfig format for the editor
    const deliveryAppConfig = {
      id: app.id,
      app_name: app.app_name,
      app_slug: app.app_slug,
      logo_url: app.logo_url || '',
      main_app_config: {
        hero_heading: app.main_app_config?.hero_heading || app.hero_title || app.app_name,
        hero_subheading: app.main_app_config?.hero_subheading || app.hero_subtitle || 'Premium delivery service'
      },
      collections_config: {
        tab_count: app.collections_config?.tab_count || 3,
        tabs: app.collections_config?.tabs || [
          { name: 'Beer', collection_handle: 'beer', icon: '🍺' },
          { name: 'Wine', collection_handle: 'wine', icon: '🍷' },
          { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
        ]
      },
      is_homepage: app.is_homepage,
      is_active: app.is_active
    };
    
    setEditingApp(deliveryAppConfig);
    setShowEditor(true);
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
          is_homepage: false
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

  const copyAppUrl = async (app: DeliveryApp) => {
    const url = `${window.location.origin}/app/${app.app_slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Copied URL for ${app.app_name}`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`Copied URL for ${app.app_name}`);
    }
  };

  const openAppUrl = (app: DeliveryApp) => {
    window.open(`/app/${app.app_slug}`, '_blank');
  };

  const homepageApp = deliveryApps.find(app => app.is_homepage);
  const hasDeliveryApps = deliveryApps.length > 0;

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
        <Button onClick={() => setShowEditor(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Delivery App
        </Button>
      </div>

      {/* Status Banner */}
      {hasDeliveryApps ? (
        homepageApp ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Homepage app is <strong>configured</strong>. Current: "{homepageApp.app_name}"
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800">
                  No homepage app set. Please designate one app as the homepage.
                </span>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">
                No delivery apps created yet. Create your first app to get started.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery App Creator */}
      {showEditor && (
        <FixedDeliveryAppCreator
          open={showEditor}
          onOpenChange={setShowEditor}
          initial={editingApp}
          onSaved={() => {
            setShowEditor(false);
            setEditingApp(null);
            loadDeliveryApps();
          }}
        />
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
              <Button onClick={handleCreateNew} className="gap-2">
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
                          
                          {/* App URL with copy functionality */}
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
                              {window.location.origin}/app/{app.app_slug}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyAppUrl(app)}
                              className="h-6 w-6 p-0"
                              title="Copy URL"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAppUrl(app)}
                              className="h-6 w-6 p-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Fee: ${app.delivery_fee || 0}</span>
                            <span>Radius: {app.delivery_radius || 0}mi</span>
                            <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
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
                            onClick={() => handleEdit(app)}
                            disabled={loading || showEditor}
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

      {/* Editor Modal */}
      {showEditor && (
        <FixedDeliveryAppCreator 
          open={showEditor}
          onOpenChange={setShowEditor}
          initial={editingApp}
          onSaved={() => {
            setShowEditor(false);
            setEditingApp(null);
            loadDeliveryApps();
          }}
        />
      )}
    </div>
  );
};