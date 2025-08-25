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
import { UnifiedDeliveryAppCreator } from './UnifiedDeliveryAppCreator';


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
  description?: string;
  logo_url?: string;
  is_active: boolean;
  tab_config?: any;
  custom_branding?: any;
  created_at: string;
  updated_at: string;
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
  theme: 'original' | 'gold' | 'platinum';
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
      id: app.id.toString(),
      app_name: app.app_name,
      app_slug: app.app_slug,
      logo_url: app.logo_url || '',
      main_app_config: {
        hero_heading: app.app_name,
        hero_subheading: app.description || 'Premium delivery service'
      },
      collections_config: {
        tab_count: 3,
        tabs: [
          { name: 'Beer', collection_handle: 'beer', icon: '🍺' },
          { name: 'Wine', collection_handle: 'wine', icon: '🍷' },
          { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
        ]
      },
      theme: 'gold' as const,
      is_homepage: false,
      is_active: app.is_active
    };
    
    setEditingApp(deliveryAppConfig);
    setShowEditor(true);
  };

  const handleDelete = async (app: DeliveryApp) => {
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
      
      // Just activate this app for now (no homepage concept in current schema)
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_active: true })
        .eq('id', app.id);

      if (error) throw error;

      toast.success(`"${app.app_name}" is now active`);
      loadDeliveryApps();
    } catch (error) {
      console.error('Error setting active app:', error);
      toast.error('Failed to update app');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (app: DeliveryApp) => {
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
          description: app.description,
          logo_url: app.logo_url,
          tab_config: app.tab_config,
          custom_branding: app.custom_branding,
          is_active: false
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
        {/* Button removed - AdminDashboard tab has the main create button */}
      </div>

      {/* Status Banner */}
      {hasDeliveryApps ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                Delivery apps are <strong>configured</strong>. You have {deliveryApps.length} active app(s).
              </span>
            </div>
          </CardContent>
        </Card>
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
        <UnifiedDeliveryAppCreator
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
                  <Card key={app.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{app.app_name}</h4>
                            <Badge variant={app.is_active ? 'default' : 'secondary'}>
                              {app.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {app.description && (
                            <p className="text-sm text-muted-foreground mb-1">Description: {app.description}</p>
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
                            <span>Tabs: {Array.isArray(app.tab_config) ? app.tab_config.length : 0}</span>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetHomepage(app)}
                            disabled={loading}
                          >
                            <Home className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(app)}
                            disabled={loading}
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
        <UnifiedDeliveryAppCreator 
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