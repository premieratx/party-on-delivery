import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Copy,
  AlertTriangle,
  CheckCircle,
  Settings,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedCoverPageEditor, type CoverPageConfig } from './UnifiedCoverPageEditor';
// CRITICAL: Use UnifiedDeliveryAppCreator - NEVER UnifiedDeliveryAppEditor!
import { UnifiedDeliveryAppCreator } from './UnifiedDeliveryAppCreator';
import { UnifiedPostCheckoutEditor } from './UnifiedPostCheckoutEditor';

interface CoverPage {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  bg_image_url?: string;
  bg_video_url?: string;
  logo_url?: string;
  logo_height?: number;
  buttons?: any;
  checklist?: any;
  is_active: boolean;
  is_default_homepage: boolean;
  created_at: string;
  updated_at: string;
  styles: any;
  affiliate_slug?: string;
}

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config?: any;
  start_screen_config?: any;
  main_app_config?: any;
  post_checkout_config?: any;
  custom_post_checkout_config?: any;
  is_active: boolean;
  is_homepage: boolean;
  created_at: string;
  updated_at: string;
  short_path?: string;
}

interface PostCheckoutScreen {
  id: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  button_1_text?: string;
  button_1_url?: string;
  button_2_text?: string;
  button_2_url?: string;
  background_color: string;
  text_color: string;
  cover_page_id: string;
  affiliate_id?: string;
  flow_id?: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  styles?: any;
}

export const UnifiedFlowManager: React.FC = () => {
  // Data states
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [postCheckoutScreens, setPostCheckoutScreens] = useState<PostCheckoutScreen[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Editor states
  const [activeTab, setActiveTab] = useState('cover-pages');
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showDeliveryEditor, setShowDeliveryEditor] = useState(false);
  const [showPostCheckoutEditor, setShowPostCheckoutEditor] = useState(false);
  
  // Editing items
  const [editingCoverPage, setEditingCoverPage] = useState<CoverPageConfig | null>(null);
  const [editingDeliveryApp, setEditingDeliveryApp] = useState<any>(null);
  const [editingPostCheckout, setEditingPostCheckout] = useState<any>(null);

  const { toast } = useToast();

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [coverPagesRes, deliveryAppsRes, postCheckoutRes] = await Promise.all([
        supabase.from('cover_pages').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_app_variations').select('*').order('created_at', { ascending: false }),
        supabase.from('post_checkout_screens').select('*').order('created_at', { ascending: false })
      ]);

      if (coverPagesRes.error) throw coverPagesRes.error;
      if (deliveryAppsRes.error) throw deliveryAppsRes.error;
      if (postCheckoutRes.error) throw postCheckoutRes.error;

      setCoverPages(coverPagesRes.data || []);
      setDeliveryApps(deliveryAppsRes.data || []);
      setPostCheckoutScreens(postCheckoutRes.data || []);
    } catch (error) {
      console.error('Error loading flow data:', error);
      toast({
        title: "Error",
        description: "Failed to load flow components",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Cover Page handlers
  const handleCreateCoverPage = () => {
    setEditingCoverPage(null);
    setShowCoverEditor(true);
  };

  const handleEditCoverPage = (page: CoverPage) => {
    const coverPageConfig: CoverPageConfig = {
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle || '',
      logo_url: page.logo_url || '',
      logo_height: page.logo_height || 160,
      bg_image_url: page.bg_image_url || '',
      bg_video_url: page.bg_video_url || '',
      checklist: Array.isArray(page.checklist) ? page.checklist : [],
      buttons: Array.isArray(page.buttons) ? page.buttons : [],
      is_active: page.is_active,
      is_default_homepage: page.is_default_homepage,
      styles: page.styles || {}
    };
    
    setEditingCoverPage(coverPageConfig);
    setShowCoverEditor(true);
  };

  const handleSetDefaultCoverPage = async (page: CoverPage) => {
    try {
      setLoading(true);
      
      // Remove default from all cover pages
      await supabase
        .from('cover_pages')
        .update({ is_default_homepage: false })
        .neq('id', page.id);

      // Set this page as default
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_default_homepage: true, is_active: true })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${page.title}" is now the default cover page`
      });
      loadAllData();
    } catch (error) {
      console.error('Error setting default cover page:', error);
      toast({
        title: "Error", 
        description: "Failed to set default cover page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delivery App handlers
  const handleCreateDeliveryApp = () => {
    setEditingDeliveryApp(null);
    setShowDeliveryEditor(true);
  };

  const handleEditDeliveryApp = (app: DeliveryApp) => {
    setEditingDeliveryApp(app);
    setShowDeliveryEditor(true);
  };

  const handleSetDefaultDeliveryApp = async (app: DeliveryApp) => {
    try {
      setLoading(true);

      // Remove homepage flag from all apps
      await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: false })
        .neq('id', app.id);

      // Set this app as homepage
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_homepage: true, is_active: true })
        .eq('id', app.id);

      if (error) throw error;

      toast({
        title: "Success", 
        description: `"${app.app_name}" is now the default delivery app`
      });
      loadAllData();
    } catch (error) {
      console.error('Error setting default delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to set default delivery app", 
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Post-Checkout handlers
  const handleCreatePostCheckout = () => {
    setEditingPostCheckout(null);
    setShowPostCheckoutEditor(true);
  };

  const handleEditPostCheckout = (screen: PostCheckoutScreen) => {
    const postCheckoutConfig = {
      id: screen.id,
      title: screen.title,
      subtitle: screen.subtitle || '',
      logo_url: screen.logo_url || '',
      buttons: [
        { text: screen.button_1_text || '', url: screen.button_1_url || '', style: 'primary' as const },
        { text: screen.button_2_text || '', url: screen.button_2_url || '', style: 'secondary' as const }
      ].filter(btn => btn.text),
      background_color: screen.background_color,
      text_color: screen.text_color,
      cover_page_id: screen.cover_page_id,
      affiliate_id: screen.affiliate_id || '',
      is_template: screen.is_template,
      theme: screen.styles?.theme || 'success',
      styles: screen.styles || {}
    };
    
    setEditingPostCheckout(postCheckoutConfig);
    setShowPostCheckoutEditor(true);
  };

  // Generic delete handler
  const handleDelete = async (tableName: 'cover_pages' | 'delivery_app_variations' | 'post_checkout_screens', id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Success",
        description: `${name} deleted successfully`
      });
      loadAllData();
    } catch (error) {
      console.error(`Error deleting ${name}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${name}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get default items
  const defaultCoverPage = coverPages.find(page => page.is_default_homepage);
  const defaultDeliveryApp = deliveryApps.find(app => app.is_homepage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Customer Flow Manager</h3>
          <p className="text-muted-foreground">
            Create and manage all components of your customer flows
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAllData} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Flow Component Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cover Pages Status */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Cover Pages</h4>
              <div className="text-2xl font-bold mb-1">{coverPages.length}</div>
              <div className="text-sm text-muted-foreground">
                {defaultCoverPage ? (
                  <span className="text-green-600">Default: {defaultCoverPage.title}</span>
                ) : (
                  <span className="text-orange-600">No default set</span>
                )}
              </div>
            </div>

            {/* Delivery Apps Status */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Delivery Apps</h4>
              <div className="text-2xl font-bold mb-1">{deliveryApps.length}</div>
              <div className="text-sm text-muted-foreground">
                {defaultDeliveryApp ? (
                  <span className="text-green-600">Default: {defaultDeliveryApp.app_name}</span>
                ) : (
                  <span className="text-orange-600">No default set</span>
                )}
              </div>
            </div>

            {/* Post-Checkout Status */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Post-Checkout</h4>
              <div className="text-2xl font-bold mb-1">{postCheckoutScreens.length}</div>
              <div className="text-sm text-muted-foreground">
                {postCheckoutScreens.filter(s => s.is_template).length} templates
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cover-pages">Cover Pages</TabsTrigger>
          <TabsTrigger value="delivery-apps">Delivery Apps</TabsTrigger>
          <TabsTrigger value="post-checkout">Post-Checkout</TabsTrigger>
        </TabsList>

        {/* Cover Pages Tab */}
        <TabsContent value="cover-pages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Cover Pages ({coverPages.length})</h4>
            <Button onClick={handleCreateCoverPage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Cover Page
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {coverPages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No cover pages created yet</p>
                <Button onClick={handleCreateCoverPage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Cover Page
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {coverPages.map((page) => (
                  <Card key={page.id} className={page.is_default_homepage ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold">{page.title}</h5>
                            {page.is_default_homepage && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={page.is_active ? 'default' : 'secondary'}>
                              {page.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">/{page.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCoverPage(page)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!page.is_default_homepage && (
                            <Button size="sm" variant="outline" onClick={() => handleSetDefaultCoverPage(page)}>
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleDelete('cover_pages', page.id, page.title)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Delivery Apps Tab */}
        <TabsContent value="delivery-apps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Delivery Apps ({deliveryApps.length})</h4>
            <Button onClick={handleCreateDeliveryApp}>
              <Plus className="w-4 h-4 mr-2" />
              Create Delivery App
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {deliveryApps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No delivery apps created yet</p>
                <Button onClick={handleCreateDeliveryApp}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First App
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryApps.map((app) => (
                  <Card key={app.id} className={app.is_homepage ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold">{app.app_name}</h5>
                            {app.is_homepage && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Homepage
                              </Badge>
                            )}
                            <Badge variant={app.is_active ? 'default' : 'secondary'}>
                              {app.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">/{app.app_slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditDeliveryApp(app)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!app.is_homepage && (
                            <Button size="sm" variant="outline" onClick={() => handleSetDefaultDeliveryApp(app)}>
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleDelete('delivery_app_variations', app.id, app.app_name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Post-Checkout Tab */}
        <TabsContent value="post-checkout" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Post-Checkout Screens ({postCheckoutScreens.length})</h4>
            <Button onClick={handleCreatePostCheckout}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post-Checkout Screen
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {postCheckoutScreens.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No post-checkout screens created yet</p>
                <Button onClick={handleCreatePostCheckout}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Screen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {postCheckoutScreens.map((screen) => (
                  <Card key={screen.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold">{screen.title}</h5>
                            {screen.is_template && (
                              <Badge variant="secondary">Template</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{screen.subtitle}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditPostCheckout(screen)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete('post_checkout_screens', screen.id, screen.title)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Editors */}
      {showCoverEditor && (
        <UnifiedCoverPageEditor
          open={showCoverEditor}
          onOpenChange={setShowCoverEditor}
          initial={editingCoverPage}
          onSaved={() => {
            loadAllData();
            setShowCoverEditor(false);
            setEditingCoverPage(null);
          }}
        />
      )}

      {showDeliveryEditor && (
        <UnifiedDeliveryAppCreator
          open={showDeliveryEditor}
          onOpenChange={setShowDeliveryEditor}
          initial={editingDeliveryApp}
          onSaved={() => {
            loadAllData();
            setShowDeliveryEditor(false);
            setEditingDeliveryApp(null);
          }}
        />
      )}

      {showPostCheckoutEditor && (
        <UnifiedPostCheckoutEditor
          open={showPostCheckoutEditor}
          onOpenChange={setShowPostCheckoutEditor}
          initial={editingPostCheckout}
          onSaved={() => {
            loadAllData();
            setShowPostCheckoutEditor(false);
            setEditingPostCheckout(null);
          }}
        />
      )}
    </div>
  );
};