import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ExternalLink, Copy, Save, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomPostCheckoutEditor } from './CustomPostCheckoutEditor';

interface DeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  custom_post_checkout_config?: {
    enabled: boolean;
    title: string;
    message: string;
    cta_button_text: string;
    cta_button_url: string;
    background_color: string;
    text_color: string;
  };
  is_active: boolean;
  created_at: string;
}

interface Collection {
  id: string;
  handle: string;
  title: string;
}

export function DeliveryAppManager() {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [selectedAppForConfig, setSelectedAppForConfig] = useState<DeliveryApp | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [appName, setAppName] = useState('');
  const [tabCount, setTabCount] = useState(5);
  const [tabs, setTabs] = useState<Array<{ name: string; collection_handle: string }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load delivery apps
      const { data: appsData, error: appsError } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Error loading delivery apps:', appsError);
        throw appsError;
      } else {
        // Type cast the data to match our interface
        const typedApps = (appsData || []).map(app => ({
          ...app,
          collections_config: app.collections_config as {
            tab_count: number;
            tabs: Array<{
              name: string;
              collection_handle: string;
              icon?: string;
            }>;
          },
          custom_post_checkout_config: app.custom_post_checkout_config as {
            enabled: boolean;
            title: string;
            message: string;
            cta_button_text: string;
            cta_button_url: string;
            background_color: string;
            text_color: string;
          } | undefined
        }));
        setDeliveryApps(typedApps);
      }

      // Load collections
      const { data: collectionsResponse, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
      
      if (collectionsError) throw collectionsError;
      
      if (collectionsResponse?.collections) {
        const collectionsData = collectionsResponse.collections.map((c: any) => ({
          id: c.id,
          handle: c.handle,
          title: c.title
        }));
        setCollections(collectionsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load delivery apps');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewApp = () => {
    setAppName('');
    setTabCount(5);
    setTabs(Array.from({ length: 5 }, () => ({
      name: '',
      collection_handle: ''
    })));
    setIsCreating(true);
  };

  const handleTabCountChange = (count: number) => {
    setTabCount(count);
    const newTabs = Array.from({ length: count }, (_, index) => 
      tabs[index] || { name: '', collection_handle: '' }
    );
    setTabs(newTabs);
  };

  const updateTab = (index: number, field: string, value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setTabs(newTabs);
  };

  const createDeliveryApp = async () => {
    if (!appName.trim()) {
      toast.error('App name is required');
      return;
    }

    const validTabs = tabs.filter(tab => tab.name.trim() && tab.collection_handle);
    if (validTabs.length === 0) {
      toast.error('At least one valid tab is required');
      return;
    }

    try {
      const appSlug = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if slug already exists
      const { data: existingApp } = await supabase
        .from('delivery_app_variations')
        .select('id')
        .eq('app_slug', appSlug)
        .maybeSingle();

      if (existingApp) {
        toast.error('A delivery app with this name already exists');
        return;
      }
      
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .insert([{
          app_name: appName,
          app_slug: appSlug,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          },
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Type cast the new app data
      const typedApp = {
        ...data,
        collections_config: data.collections_config as {
          tab_count: number;
          tabs: Array<{
            name: string;
            collection_handle: string;
            icon?: string;
          }>;
        },
        custom_post_checkout_config: data.custom_post_checkout_config as {
          enabled: boolean;
          title: string;
          message: string;
          cta_button_text: string;
          cta_button_url: string;
          background_color: string;
          text_color: string;
        } | undefined
      };
      setDeliveryApps(prev => [typedApp, ...prev]);
      setIsCreating(false);
      toast.success(`Delivery app created! URL: /delivery-app/${appSlug}`);

    } catch (error: any) {
      console.error('Error creating delivery app:', error);
      toast.error(error.message || 'Failed to create delivery app');
    }
  };

  const updateDeliveryApp = async () => {
    if (!editingApp || !appName.trim()) {
      toast.error('App name is required');
      return;
    }

    const validTabs = tabs.filter(tab => tab.name.trim() && tab.collection_handle);
    if (validTabs.length === 0) {
      toast.error('At least one valid tab is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .update({
          app_name: appName,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          }
        })
        .eq('id', editingApp.id)
        .select()
        .single();

      if (error) throw error;

      // Update the app in the list
      setDeliveryApps(prev => prev.map(app => 
        app.id === editingApp.id 
          ? {
              ...data,
              collections_config: data.collections_config as {
                tab_count: number;
                tabs: Array<{
                  name: string;
                  collection_handle: string;
                  icon?: string;
                }>;
              },
              custom_post_checkout_config: data.custom_post_checkout_config as {
                enabled: boolean;
                title: string;
                message: string;
                cta_button_text: string;
                cta_button_url: string;
                background_color: string;
                text_color: string;
              } | undefined
            }
          : app
      ));
      
      setIsCreating(false);
      setEditingApp(null);
      setAppName('');
      setTabs([]);
      toast.success('Delivery app updated successfully!');

    } catch (error: any) {
      console.error('Error updating delivery app:', error);
      toast.error(error.message || 'Failed to update delivery app');
    }

  };

  const deleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this delivery app?')) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      setDeliveryApps(prev => prev.filter(app => app.id !== appId));
      toast.success('Delivery app deleted');

    } catch (error) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
    }
  };

  const copyAppUrl = (appSlug: string) => {
    const url = `${window.location.origin}/app/${appSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('App URL copied to clipboard');
  };

  const handleConfigUpdated = (appId: string, newConfig: any) => {
    setDeliveryApps(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, custom_post_checkout_config: newConfig }
          : app
      )
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery App Variations</h2>
          <p className="text-muted-foreground">Create custom delivery apps with different collection tabs</p>
        </div>
        <Button onClick={initializeNewApp} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Delivery App
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApp ? 'Edit Delivery App' : 'Create New Delivery App'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Boat Delivery App"
              />
            </div>

            <div>
              <Label htmlFor="tab-count">Number of Tabs</Label>
              <Select value={tabCount.toString()} onValueChange={(value) => handleTabCountChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map(count => (
                    <SelectItem key={count} value={count.toString()}>{count} tabs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configure Tabs</h3>
              {tabs.map((tab, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tab Name</Label>
                        <Input
                          value={tab.name}
                          onChange={(e) => updateTab(index, 'name', e.target.value)}
                          placeholder="Spirits"
                        />
                      </div>
                      
                      <div>
                        <Label>Collection</Label>
                        <Select value={tab.collection_handle} onValueChange={(value) => updateTab(index, 'collection_handle', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map(collection => (
                              <SelectItem key={collection.id} value={collection.handle}>
                                {collection.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingApp(null);
                setAppName('');
                setTabs([]);
              }}>
                Cancel
              </Button>
              <Button onClick={editingApp ? updateDeliveryApp : createDeliveryApp}>
                {editingApp ? 'Update App' : 'Create App'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Apps List */}
      <div className="grid gap-4">
        {deliveryApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No delivery app variations created yet.</p>
              <Button onClick={initializeNewApp} className="mt-4">
                Create Your First App
              </Button>
            </CardContent>
          </Card>
        ) : (
          deliveryApps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{app.app_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{app.app_slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={app.is_active ? 'default' : 'secondary'}>
                      {app.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Tabs ({app.collections_config.tab_count})</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.collections_config.tabs.map((tab, index) => (
                        <Badge key={index} variant="outline">
                          {tab.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyAppUrl(app.app_slug)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAppForConfig(app)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Post-Checkout
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingApp(app);
                        setAppName(app.app_name);
                        setTabCount(app.collections_config.tab_count);
                        setTabs(app.collections_config.tabs.map(tab => ({
                          name: tab.name,
                          collection_handle: tab.collection_handle
                        })));
                        setIsCreating(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteApp(app.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Post-Checkout Configuration Dialog */}
      <Dialog open={!!selectedAppForConfig} onOpenChange={() => setSelectedAppForConfig(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configure Post-Checkout for "{selectedAppForConfig?.app_name}"
            </DialogTitle>
          </DialogHeader>
          {selectedAppForConfig && (
            <CustomPostCheckoutEditor
              appId={selectedAppForConfig.id}
              currentConfig={selectedAppForConfig.custom_post_checkout_config || {
                enabled: false,
                title: "",
                message: "",
                cta_button_text: "",
                cta_button_url: "",
                background_color: "#ffffff",
                text_color: "#000000"
              }}
              onConfigUpdated={(newConfig) => handleConfigUpdated(selectedAppForConfig.id, newConfig)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}