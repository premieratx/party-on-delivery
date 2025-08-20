import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ExternalLink, Copy, Save, Settings, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CANONICAL_DOMAIN, buildAppUrl, buildShortUrl } from '@/utils/links';
import { useNavigate } from 'react-router-dom';

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
      subheadline_text?: string;
      subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat';
      subheadline_size?: 'sm' | 'md' | 'lg' | 'xl';
    }>;
  };
  is_active: boolean;
  is_homepage?: boolean;
  created_at: string;
  logo_url?: string;
}

interface Collection {
  id: string;
  handle: string;
  title: string;
  products_count?: number;
}

export function DeliveryAppManager() {
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  // Form state - only core delivery app functionality
  const [appName, setAppName] = useState('');
  const [tabCount, setTabCount] = useState(5);
  const [tabs, setTabs] = useState<Array<{ name: string; collection_handle: string; subheadline_text?: string; subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat'; subheadline_size?: 'sm' | 'md' | 'lg' | 'xl'; }>>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    loadData();
    
    // Listen for collection updates
    const handleCollectionsUpdate = () => {
      console.log('🔄 DeliveryAppManager: Collections updated, reloading...');
      loadData();
    };
    
    window.addEventListener('collectionsUpdated', handleCollectionsUpdate);
    return () => window.removeEventListener('collectionsUpdated', handleCollectionsUpdate);
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
          }
        }));
        setDeliveryApps(typedApps);
      }

      // Load collections using the get-all-collections function
      console.log('📦 Loading collections for delivery app manager...');
      
      try {
        const { data: collectionsResponse, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
        
        if (collectionsError) throw collectionsError;
        
        if (collectionsResponse?.success && collectionsResponse.collections) {
          console.log(`✅ Loaded ${collectionsResponse.collections.length} collections from API`);
          const collectionsData = collectionsResponse.collections.map((c: any) => ({
            id: c.handle,
            handle: c.handle,
            title: c.title,
            products_count: c.products_count
          }));
          setCollections(collectionsData);
        } else {
          console.log('⚠️ No collections returned from API');
        }
      } catch (apiError) {
        console.error('Error loading collections from API:', apiError);
        // Try cache as fallback
        const { data: cachedCollections, error: cacheError } = await supabase
          .from('shopify_collections_cache')
          .select('handle, title, products_count')
          .order('products_count', { ascending: false });
        
        if (!cacheError && cachedCollections && cachedCollections.length > 0) {
          console.log(`✅ Loaded ${cachedCollections.length} collections from cache as fallback`);
          const collectionsData = cachedCollections.map((c: any) => ({
            id: c.handle,
            handle: c.handle,
            title: c.title,
            products_count: c.products_count
          }));
          setCollections(collectionsData);
        } else {
          console.log('❌ Failed to load collections from both API and cache');
        }
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
    
    // Reset form fields
    setLogoFile(null);
    setLogoUrl('');
    
    setIsCreating(true);
  };

  const handleTabCountChange = (count: number) => {
    setTabCount(count);
    const newTabs = Array.from({ length: count }, (_, index) => 
      tabs[index] || { name: '', collection_handle: '' }
    );
    setTabs(newTabs);
  };

  const uploadLogo = async (file: File, appSlug: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appSlug}-logo.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-app-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('delivery-app-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const updateTab = (index: number, field: string, value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setTabs(newTabs);
  };

  // Drag & Drop reordering for tabs
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const onDragStartTab = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOverTab = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropTab = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newTabs = [...tabs];
    const [moved] = newTabs.splice(dragIndex, 1);
    newTabs.splice(index, 0, moved);
    setTabs(newTabs);
    setDragIndex(null);
  };
  const onDragEndTab = () => setDragIndex(null);

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
      let appSlug = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if slug already exists and make it unique
      let counter = 1;
      let finalSlug = appSlug;
      
      while (true) {
        const { data: existingApp } = await supabase
          .from('delivery_app_variations')
          .select('id')
          .eq('app_slug', finalSlug)
          .maybeSingle();

        if (!existingApp) {
          break; // This slug is available
        }
        
        // Try with counter
        finalSlug = `${appSlug}-${counter}`;
        counter++;
        
        // Safety check to prevent infinite loop
        if (counter > 100) {
          throw new Error('Unable to generate unique app slug');
        }
      }
      
      appSlug = finalSlug;
      
      // Upload logo if provided - with proper error handling
      let uploadedLogoUrl = '';
      if (logoFile) {
        try {
          uploadedLogoUrl = await uploadLogo(logoFile, appSlug);
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError);
          toast.error('Logo upload failed, but app will be created without logo. You can add it later.');
          // Continue without logo
        }
      }
      
      // Create the database entry using clean format
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .insert([{
          app_name: appName,
          app_slug: appSlug,
          logo_url: uploadedLogoUrl,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          },
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Delivery app "${appName}" created successfully! 🎉`);

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
        }
      };
      setDeliveryApps(prev => [typedApp, ...prev]);
      setIsCreating(false);
      setIsDialogOpen(false);

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
      // Upload logo if provided
      let uploadedLogoUrl = logoUrl; // Keep existing URL if no new file
      if (logoFile) {
        uploadedLogoUrl = await uploadLogo(logoFile, editingApp.app_slug);
      }

      const { data, error } = await supabase
        .from('delivery_app_variations')
        .update({
          app_name: appName,
          logo_url: uploadedLogoUrl,
          collections_config: {
            tab_count: validTabs.length,
            tabs: validTabs
          }
        })
        .eq('id', editingApp.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Delivery app updated successfully! 🎉');

      // Update the list
      setDeliveryApps(prev => prev.map(app => 
        app.id === editingApp.id ? { ...data, collections_config: data.collections_config as any } : app
      ));
      
      setIsCreating(false);
      setEditingApp(null);
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error('Error updating delivery app:', error);
      toast.error(error.message || 'Failed to update delivery app');
    }
  };

  const handleEdit = (app: DeliveryApp) => {
    setEditingApp(app);
    setAppName(app.app_name);
    setTabCount(app.collections_config.tab_count);
    setTabs(app.collections_config.tabs);
    setLogoUrl(app.logo_url || '');
    setLogoFile(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (app: DeliveryApp) => {
    if (!confirm(`Are you sure you want to delete "${app.app_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .delete()
        .eq('id', app.id);

      if (error) throw error;

      setDeliveryApps(prev => prev.filter(a => a.id !== app.id));
      toast.success('Delivery app deleted successfully');
    } catch (error: any) {
      console.error('Error deleting delivery app:', error);
      toast.error('Failed to delete delivery app');
    }
  };

  const toggleAppStatus = async (app: DeliveryApp) => {
    try {
      const { error } = await supabase
        .from('delivery_app_variations')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);

      if (error) throw error;

      setDeliveryApps(prev => prev.map(a => 
        a.id === app.id ? { ...a, is_active: !a.is_active } : a
      ));
      
      toast.success(`App ${!app.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling app status:', error);
      toast.error('Failed to toggle app status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery App Manager</h2>
          <p className="text-muted-foreground">Create and manage delivery app variations</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={initializeNewApp}>
              <Plus className="h-4 w-4 mr-2" />
              Create New App
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingApp ? 'Edit Delivery App' : 'Create New Delivery App'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="app-name">App Name</Label>
                    <Input
                      id="app-name"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My Delivery App"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>App Logo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="app-logo-upload">App Logo</Label>
                    <Input
                      id="app-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          try { setLogoUrl(URL.createObjectURL(file)); } catch {}
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG/JPG/SVG. Uploaded on save.</p>
                    {logoUrl && (
                      <div className="mt-2">
                        <img src={logoUrl} alt="App logo preview" className="h-12 w-auto" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tab Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Tab Configuration</CardTitle>
                  <p className="text-sm text-muted-foreground">Configure the product category tabs</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tab-count">Number of Tabs</Label>
                    <Select value={tabCount.toString()} onValueChange={(value) => handleTabCountChange(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} tabs</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    {tabs.map((tab, index) => (
                      <div 
                        key={index} 
                        className="p-3 border rounded-lg space-y-3"
                        draggable
                        onDragStart={onDragStartTab(index)}
                        onDragOver={onDragOverTab(index)}
                        onDrop={onDropTab(index)}
                        onDragEnd={onDragEndTab}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <div className="w-2 h-8 bg-muted rounded cursor-move"></div>
                          Tab {index + 1}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`tab-name-${index}`}>Tab Name</Label>
                            <Input
                              id={`tab-name-${index}`}
                              value={tab.name}
                              onChange={(e) => updateTab(index, 'name', e.target.value)}
                              placeholder="Beer"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`collection-${index}`}>Collection</Label>
                            <Select 
                              value={tab.collection_handle}
                              onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select collection" />
                              </SelectTrigger>
                              <SelectContent>
                                {collections.map(collection => (
                                  <SelectItem key={collection.handle} value={collection.handle}>
                                    {collection.title} ({collection.products_count || 0} products)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                  setEditingApp(null);
                  setAppName('');
                  setTabs([]);
                  setLogoFile(null);
                  setLogoUrl('');
                  setIsDialogOpen(false);
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
      </div>

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
                    {(app as any).is_homepage && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Homepage
                      </Badge>
                    )}
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
                  
                  {/* App Management Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/app/${app.app_slug}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View App
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(app)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAppStatus(app)}
                    >
                      {app.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(app)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}