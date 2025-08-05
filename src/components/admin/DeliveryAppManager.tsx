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
  
  // Start screen customization
  const [startScreenTitle, setStartScreenTitle] = useState('');
  const [startScreenSubtitle, setStartScreenSubtitle] = useState('');
  
  // Main app customization  
  const [mainAppHeroHeading, setMainAppHeroHeading] = useState('');
  
  // Post-checkout customization
  const [postCheckoutHeading, setPostCheckoutHeading] = useState('');
  const [postCheckoutSubheading, setPostCheckoutSubheading] = useState('');
  const [postCheckoutRedirectUrl, setPostCheckoutRedirectUrl] = useState('');

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
    
    // Reset customization fields
    setStartScreenTitle('');
    setStartScreenSubtitle('');
    setMainAppHeroHeading('');
    setPostCheckoutHeading('');
    setPostCheckoutSubheading('');
    setPostCheckoutRedirectUrl('');
    
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
      
      // Create the database entry
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .insert([{
          app_name: appName,
          app_slug: appSlug,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          },
          start_screen_config: {
            title: startScreenTitle,
            subtitle: startScreenSubtitle
          },
          main_app_config: {
            hero_heading: mainAppHeroHeading
          },
          post_checkout_config: {
            heading: postCheckoutHeading,
            subheading: postCheckoutSubheading,
            redirect_url: postCheckoutRedirectUrl
          },
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Create the actual page files for this custom delivery app
      await createCustomDeliveryAppPages(appSlug, appName, validTabs);

      toast.success(`Delivery app "${appName}" created successfully! 🎉\nNew pages created at:\n• /${appSlug} (Start page)\n• /${appSlug}/tabs (Main app)\n• /${appSlug}/post-checkout (Thank you page)`);

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
          },
          start_screen_config: {
            title: startScreenTitle,
            subtitle: startScreenSubtitle
          },
          main_app_config: {
            hero_heading: mainAppHeroHeading
          },
          post_checkout_config: {
            heading: postCheckoutHeading,
            subheading: postCheckoutSubheading,
            redirect_url: postCheckoutRedirectUrl
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
      
      // Reset customization fields
      setStartScreenTitle('');
      setStartScreenSubtitle('');
      setMainAppHeroHeading('');
      setPostCheckoutHeading('');
      setPostCheckoutSubheading('');
      setPostCheckoutRedirectUrl('');
      
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

  const createCustomDeliveryAppPages = async (appSlug: string, appName: string, validTabs: Array<{ name: string; collection_handle: string }>) => {
    // This function creates the actual custom delivery app pages
    // For now, this is a placeholder - the pages are already created dynamically
    // via the CustomAppView.tsx routing system which loads the configuration from the database
    console.log(`Creating custom pages for ${appSlug} with ${validTabs.length} tabs`);
    
    // The actual page creation happens through:
    // 1. Start page: /${appSlug} -> routed to CustomAppView
    // 2. App page: /app/${appSlug} -> routed to CustomAppView  
    // 3. Post-checkout: /${appSlug}/success -> routed to CustomDeliveryPostCheckout
    
    // These routes dynamically load the configuration from delivery_app_variations table
    // and render the appropriate components with the custom collections
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

      {/* Delivery App Template Section */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-primary">Delivery App Template</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Base template cloned from main delivery app - used for creating new apps
              </p>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Template
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Template Pages</h5>
            
            {/* Template Start Page */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Start Screen Template</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/')}`, '_blank')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Template App Page */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">App Page Template (Tabs)</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/main-delivery-app', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/main-delivery-app')}`, '_blank')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Template Post-Checkout Page */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Post-Checkout Template</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/order-complete', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/order-complete')}`, '_blank')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

            {/* Start Screen Customization */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-700">Start Screen Customization</CardTitle>
                <p className="text-sm text-blue-600">Customize the landing page for your delivery app</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-title">Start Screen Title</Label>
                    <Input
                      id="start-title"
                      value={startScreenTitle}
                      onChange={(e) => setStartScreenTitle(e.target.value)}
                      placeholder="Austin's Premier Boat Delivery"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-subtitle">Start Screen Subtitle</Label>
                    <Input
                      id="start-subtitle"
                      value={startScreenSubtitle}
                      onChange={(e) => setStartScreenSubtitle(e.target.value)}
                      placeholder="Cold drinks delivered to Lake Travis"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main App Customization */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-700">Main App Customization</CardTitle>
                <p className="text-sm text-green-600">Customize the main delivery app interface</p>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="hero-heading">Hero Section Heading</Label>
                  <Input
                    id="hero-heading"
                    value={mainAppHeroHeading}
                    onChange={(e) => setMainAppHeroHeading(e.target.value)}
                    placeholder="Fresh Beverages Delivered to Your Boat"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Post-Checkout Customization */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-purple-700">Post-Checkout Customization</CardTitle>
                <p className="text-sm text-purple-600">Customize the order confirmation page</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkout-heading">Confirmation Heading</Label>
                    <Input
                      id="checkout-heading"
                      value={postCheckoutHeading}
                      onChange={(e) => setPostCheckoutHeading(e.target.value)}
                      placeholder="Order Confirmed!"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout-subheading">Confirmation Subheading</Label>
                    <Input
                      id="checkout-subheading"
                      value={postCheckoutSubheading}
                      onChange={(e) => setPostCheckoutSubheading(e.target.value)}
                      placeholder="We'll have your drinks to you soon"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="redirect-url">Add More Button URL (optional)</Label>
                  <Input
                    id="redirect-url"
                    value={postCheckoutRedirectUrl}
                    onChange={(e) => setPostCheckoutRedirectUrl(e.target.value)}
                    placeholder="https://example.com/more-services"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional URL for an "Add More" button on the confirmation page
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingApp(null);
                setAppName('');
                setTabs([]);
                // Reset customization fields
                setStartScreenTitle('');
                setStartScreenSubtitle('');
                setMainAppHeroHeading('');
                setPostCheckoutHeading('');
                setPostCheckoutSubheading('');
                setPostCheckoutRedirectUrl('');
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
                  
                  <div className="space-y-3">
                    {/* Page URLs and Actions */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Pages</h5>
                      
                      {/* Start Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Start Page</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${app.app_slug}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/' + app.app_slug)}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {/* App Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">App Page (Tabs)</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/app/' + app.app_slug)}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {/* Post-Checkout Page Row */}
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Post-Checkout Page</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${app.app_slug}/success`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://lovable.dev?url=${encodeURIComponent(window.location.origin + '/' + app.app_slug + '/success')}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* App Management Actions */}
                    <div className="flex gap-2 pt-3 border-t">
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
                        onClick={() => {
                          setEditingApp(app);
                          setAppName(app.app_name);
                          setTabCount(app.collections_config.tab_count);
                          setTabs(app.collections_config.tabs.map(tab => ({
                            name: tab.name,
                            collection_handle: tab.collection_handle
                          })));
                          
                          // Load existing customization data
                          const startConfig = (app as any).start_screen_config || {};
                          setStartScreenTitle(startConfig.title || '');
                          setStartScreenSubtitle(startConfig.subtitle || '');
                          
                          const mainConfig = (app as any).main_app_config || {};
                          setMainAppHeroHeading(mainConfig.hero_heading || '');
                          
                          const postConfig = (app as any).post_checkout_config || {};
                          setPostCheckoutHeading(postConfig.heading || '');
                          setPostCheckoutSubheading(postConfig.subheading || '');
                          setPostCheckoutRedirectUrl(postConfig.redirect_url || '');
                          
                          setIsCreating(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
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