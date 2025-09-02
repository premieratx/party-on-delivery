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
  Link,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// CRITICAL: Always use UnifiedDeliveryAppCreator - NEVER UnifiedDeliveryAppEditor!
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
  is_homepage?: boolean;
  theme?: string; // Changed to string to match database
  main_app_config?: any;
  collections_config?: any;
  custom_branding?: any;
  bg_image_url?: string;
  bg_video_url?: string;
  hero_config?: any;
  custom_post_checkout_config?: any;
  sort_order: number;
  prefill_delivery_address?: any;
  prefill_address_enabled?: boolean;
  free_delivery_enabled?: boolean;
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
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = deliveryApps.findIndex((app) => app.id === active.id);
    const newIndex = deliveryApps.findIndex((app) => app.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newDeliveryApps = arrayMove(deliveryApps, oldIndex, newIndex);
    
    // Update local state immediately for responsive UI
    setDeliveryApps(newDeliveryApps);

    // Update sort_order in database
    try {
      // Use individual updates instead of upsert to avoid schema conflicts
      for (let i = 0; i < newDeliveryApps.length; i++) {
        const app = newDeliveryApps[i];
        const { error } = await supabase
          .from('delivery_app_variations')
          .update({ sort_order: i })
          .eq('id', app.id);
        
        if (error) throw error;
      }

      toast.success('Tab order updated successfully');
    } catch (error) {
      console.error('Error updating tab order:', error);
      toast.error('Failed to update tab order');
      // Revert the local state on error
      loadDeliveryApps();
    }
  };

  useEffect(() => {
    loadDeliveryApps();
  }, [loadDeliveryApps]);

  const handleCreateNew = () => {
    setEditingApp(null);
    setShowEditor(true);
  };

  const handleEdit = (app: DeliveryApp) => {
    console.log('🔄 Editing delivery app:', app);
    console.log('🚚 Delivery settings to include:', {
      prefill_address_enabled: app.prefill_address_enabled,
      free_delivery_enabled: app.free_delivery_enabled,
      prefill_delivery_address: app.prefill_delivery_address
    });
    // Convert DeliveryApp to DeliveryAppConfig format for the editor
    // Use the actual saved configuration data instead of hardcoded values
    const deliveryAppConfig = {
      id: app.id.toString(),
      app_name: app.app_name,
      app_slug: app.app_slug,
      logo_url: app.logo_url || '',
      // Use the actual saved main_app_config or provide sensible defaults
      main_app_config: app.main_app_config || {
        hero_heading: app.app_name,
        hero_subheading: app.description || 'Premium delivery service',
        logo_size: 50,
        headline_size: 24,
        subheadline_size: 14,
        logo_vertical_pos: 0,
        headline_vertical_pos: 0,
        subheadline_vertical_pos: 0,
        background_image_url: '',
        background_opacity: 0.7,
        overlay_color: '#000000',
        headline_font: 'Inter',
        headline_color: '#ffffff',
        subheadline_font: 'Inter',
        subheadline_color: '#ffffff'
      },
      // Use the actual saved collections_config or provide defaults
      collections_config: app.collections_config || {
        tab_count: 3,
        tabs: [
          { name: 'Beer', collection_handle: 'beer', icon: '🍺' },
          { name: 'Wine', collection_handle: 'wine', icon: '🍷' },
          { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
        ]
      },
      theme: (app.theme as 'original' | 'gold' | 'platinum') || 'gold',
      is_homepage: app.is_homepage || false,
      is_active: app.is_active,
      // Include delivery settings
      prefill_address_enabled: app.prefill_address_enabled || false,
      free_delivery_enabled: app.free_delivery_enabled || false,
      prefill_delivery_address: app.prefill_delivery_address || null
    };
    
    console.log('📝 Passing config to editor:', deliveryAppConfig);
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

  // Removed handleSetHomepage - homepage is now managed in Settings tab only

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
          logo_url: app.logo_url,
          collections_config: app.collections_config,
          custom_branding: app.custom_branding,
          is_active: false,
          // Include delivery settings in duplicate
          prefill_address_enabled: app.prefill_address_enabled || false,
          free_delivery_enabled: app.free_delivery_enabled || false,
          prefill_delivery_address: app.prefill_delivery_address || null
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

  // Sortable Item Component
  const SortableDeliveryAppItem = ({ app }: { app: DeliveryApp }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: app.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card 
        key={app.id} 
        className="border" 
        ref={setNodeRef} 
        style={style}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 flex-1">
              {/* Drag Handle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{app.app_name}</h4>
                  <Badge variant={app.is_active ? 'default' : 'secondary'}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {app.prefill_address_enabled && (
                    <Badge variant="outline" className="text-xs">
                      📍 Pre-fill Address
                    </Badge>
                  )}
                  {app.free_delivery_enabled && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      🚚 Free Delivery
                    </Badge>
                  )}
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
                  <span>Collections: {Array.isArray(app.collections_config) ? app.collections_config.length : 0}</span>
                  <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
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
    );
  };

  const hasDeliveryApps = deliveryApps.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Delivery App Manager</h3>
          <p className="text-muted-foreground">
            Create and manage delivery applications. To set a homepage app, use the Settings tab.
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

      {/* CRITICAL: Use UnifiedDeliveryAppCreator - NEVER UnifiedDeliveryAppEditor! */}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={deliveryApps.map((app) => app.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {deliveryApps.map((app) => (
                      <SortableDeliveryAppItem key={app.id} app={app} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL: Use UnifiedDeliveryAppCreator - NEVER UnifiedDeliveryAppEditor! */}
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