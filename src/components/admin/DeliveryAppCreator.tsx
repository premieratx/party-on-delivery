import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Eye,
  Package,
  Settings,
  Palette,
  Layout,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { DeliveryAppWorkingPreview } from './DeliveryAppWorkingPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryAppTab {
  name: string;
  collection_handle: string;
  icon?: string;
}

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  main_app_config: {
    hero_heading: string;
    hero_subheading: string;
  };
  logo_url?: string;
  collections_config: {
    tab_count: number;
    tabs: DeliveryAppTab[];
  };
  is_active: boolean;
  is_homepage: boolean;
}

interface DeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig;
  onSaved?: () => void;
  onBack?: () => void;
}

const ICON_OPTIONS = [
  { value: '⭐', label: '⭐ Featured' },
  { value: '🥃', label: '🥃 Spirits' },
  { value: '🍺', label: '🍺 Beer' },
  { value: '🍷', label: '🍷 Wine' },
  { value: '🥤', label: '🥤 Seltzers' },
  { value: '🧊', label: '🧊 Mixers' },
  { value: '🍸', label: '🍸 Cocktails' },
  { value: '🎉', label: '🎉 Party Supplies' },
  { value: '🍿', label: '🍿 Snacks' },
  { value: '📦', label: '📦 Products' },
  { value: '🔥', label: '🔥 Hot Deals' },
  { value: '🎊', label: '🎊 Celebration' },
  { value: '🥇', label: '🥇 Premium' },
  { value: '💎', label: '💎 Luxury' },
  { value: '🌟', label: '🌟 Special' }
];

export const DeliveryAppCreator: React.FC<DeliveryAppCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved,
  onBack
}) => {
  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>([
    { name: 'Featured', collection_handle: 'featured', icon: '⭐' },
    { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
    { name: 'Beer', collection_handle: 'beer', icon: '🍺' }
  ]);
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopifyCollections, setShopifyCollections] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initial?.id;

  // Load Shopify collections
  const loadShopifyCollections = async () => {
    try {
      setCollectionsLoading(true);
      console.log('Loading Shopify collections...');
      
      // Use the working get-all-collections edge function
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('Error from get-all-collections:', error);
        throw error;
      }
      
      if (data?.collections && Array.isArray(data.collections)) {
        console.log(`Loaded ${data.collections.length} collections from Shopify`);
        
        const collections = data.collections
          .filter((collection: any) => collection.products_count > 0) // Only collections with products
          .map((collection: any) => ({
            handle: collection.handle,
            name: collection.title || collection.handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            products_count: collection.products_count
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setShopifyCollections(collections);
        console.log('Shopify collections loaded:', collections.map(c => `${c.name} (${c.products_count} products)`));
      } else {
        throw new Error('No collections returned from API');
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      
      // Fallback: try to get from cache as backup
      try {
        const { data: cacheData } = await supabase
          .from('cache')
          .select('data')
          .like('key', 'shopify_collections%')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (cacheData?.[0]?.data && typeof cacheData[0].data === 'object' && (cacheData[0].data as any).collections) {
          const cachedCollections = (cacheData[0].data as any).collections
            .filter((collection: any) => collection.products_count > 0)
            .map((collection: any) => ({
              handle: collection.handle,
              name: collection.title || collection.handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              products_count: collection.products_count
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
          
          setShopifyCollections(cachedCollections);
          console.log('Used cached collections:', cachedCollections.length);
        } else {
          throw new Error('No cached collections available');
        }
      } catch (cacheError) {
        console.error('Cache fallback failed:', cacheError);
        // Set a few real collections as final fallback
        setShopifyCollections([
          { handle: 'spirits', name: 'Spirits', products_count: 100 },
          { handle: 'tailgate-beer', name: 'Tailgate Beer', products_count: 62 },
          { handle: 'cocktail-kits', name: 'Cocktail Kits', products_count: 40 },
          { handle: 'party-supplies', name: 'Party Supplies', products_count: 46 },
          { handle: 'champagne', name: 'Champagne', products_count: 47 }
        ]);
      }
    } finally {
      setCollectionsLoading(false);
    }
  };

  // Initialize form with existing data
  useEffect(() => {
    if (!open) return;

    loadShopifyCollections();

    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      setLogoUrl(initial.logo_url || '');
      setTabs(initial.collections_config?.tabs || []);
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_homepage ?? false);
    } else {
      // Reset for new app
      setAppName('');
      setAppSlug('');
      setHeroHeading('');
      setHeroSubheading('');
      setLogoUrl('');
      setTabs([
        { name: 'Featured', collection_handle: 'featured', icon: '⭐' },
        { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
        { name: 'Beer', collection_handle: 'beer', icon: '🍺' }
      ]);
      setIsActive(true);
      setIsHomepage(false);
    }
  }, [open, initial]);

  // Auto-generate slug from app name
  useEffect(() => {
    if (!isEditing && appName) {
      const slug = appName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setAppSlug(slug);
    }
  }, [appName, isEditing]);

  const handleSave = async () => {
    if (!appName.trim() || !appSlug.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'App name and slug are required',
        variant: 'destructive'
      });
      return;
    }

    if (tabs.length === 0) {
      toast({
        title: 'No tabs configured',
        description: 'At least one tab is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: appName.trim(),
        app_slug: isEditing ? appSlug.trim() : `${appSlug.trim()}-${Date.now()}`,
        main_app_config: {
          hero_heading: heroHeading.trim(),
          hero_subheading: heroSubheading.trim()
        } as any,
        logo_url: logoUrl || null,
        collections_config: {
          tab_count: tabs.length,
          tabs: tabs
        } as any,
        is_active: isActive,
        is_homepage: isHomepage
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'App updated successfully!' });
      } else {
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert(appData);
        if (error) throw error;
        toast({ title: 'App created successfully!' });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addTab = () => {
    if (tabs.length < 8) {
      setTabs([...tabs, { name: 'New Tab', collection_handle: 'new-collection', icon: '📦' }]);
    }
  };

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
  };

  const updateTab = (index: number, updates: Partial<DeliveryAppTab>) => {
    const updated = [...tabs];
    updated[index] = { ...updated[index], ...updates };
    setTabs(updated);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `delivery-app-${Date.now()}-logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const useCollectionSuggestion = (collection: any) => {
    const emptyTabIndex = tabs.findIndex(tab => 
      tab.collection_handle === 'new-collection' || !tab.collection_handle.trim()
    );
    
    if (emptyTabIndex >= 0) {
      updateTab(emptyTabIndex, {
        name: collection.name,
        collection_handle: collection.handle,
        icon: '📦' // Default icon
      });
    } else {
      // Add as new tab if space available
      if (tabs.length < 8) {
        setTabs([...tabs, {
          name: collection.name,
          collection_handle: collection.handle,
          icon: '📦' // Default icon
        }]);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    Configure your delivery app with custom tabs and collections
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onBack && (
                  <Button onClick={onBack} variant="outline" size="sm">
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !appName || !appSlug}
                  size="sm"
                  className="min-w-[100px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save App'}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="basic" className="h-full flex flex-col">
                <div className="px-6 pt-4 border-b">
                  <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="tabs" className="flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Tabs & Collections
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>App Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="app-name">App Name *</Label>
                          <Input
                            id="app-name"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="My Delivery App"
                          />
                        </div>
                        <div>
                          <Label htmlFor="app-slug">App Slug *</Label>
                          <Input
                            id="app-slug"
                            value={appSlug}
                            onChange={(e) => setAppSlug(e.target.value)}
                            placeholder="my-delivery-app"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="hero-heading">Hero Heading</Label>
                        <Input
                          id="hero-heading"
                          value={heroHeading}
                          onChange={(e) => setHeroHeading(e.target.value)}
                          placeholder="Austin's Premier Party Supply Delivery"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hero-subheading">Hero Subheading</Label>
                        <Textarea
                          id="hero-subheading"
                          value={heroSubheading}
                          onChange={(e) => setHeroSubheading(e.target.value)}
                          placeholder="Satisfaction Guaranteed, On-Time Delivery"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>App Logo</Label>
                        <div className="flex gap-3 mt-2">
                          <Button
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                        {logoUrl && (
                          <div className="mt-3">
                            <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded border p-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                          />
                          <Label htmlFor="is-active">App Active</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-homepage"
                            checked={isHomepage}
                            onCheckedChange={setIsHomepage}
                          />
                          <Label htmlFor="is-homepage">Set as Homepage</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tabs & Collections */}
              <TabsContent value="tabs" className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Configure Tabs ({tabs.length})</h3>
                      <p className="text-sm text-muted-foreground">
                        Set up your delivery app tabs and assign Shopify collections
                      </p>
                    </div>
                    <Button onClick={addTab} disabled={tabs.length >= 8}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tab
                    </Button>
                  </div>

                   {/* Collection Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Available Collections</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {collectionsLoading ? 'Loading...' : `${shopifyCollections.length} collections found`}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <div className="flex flex-wrap gap-2">
                          {shopifyCollections.map((collection) => (
                            <Button
                              key={collection.handle}
                              variant="outline"
                              size="sm"
                              onClick={() => useCollectionSuggestion(collection)}
                              disabled={collectionsLoading}
                              className="flex items-center gap-2"
                            >
                              {collection.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Tab Configuration */}
                  <ScrollArea className="h-[400px]">
                    <div className="grid gap-4 pr-4">
                      {tabs.map((tab, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Tab {index + 1}</Badge>
                                <span className="text-lg">{tab.icon}</span>
                                <span className="font-medium">{tab.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTab(index)}
                                disabled={tabs.length <= 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>Tab Name</Label>
                                <Input
                                  value={tab.name}
                                  onChange={(e) => updateTab(index, { name: e.target.value })}
                                  placeholder="Tab Name"
                                />
                              </div>
                              
                              <div>
                                <Label>Collection</Label>
                                <Select
                                  value={tab.collection_handle}
                                  onValueChange={(value) => updateTab(index, { collection_handle: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select collection" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {shopifyCollections.map((collection) => (
                                      <SelectItem key={collection.handle} value={collection.handle}>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xs text-muted-foreground">
                                            {collection.handle}
                                          </span>
                                          <span>{collection.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>Icon</Label>
                                <Select
                                  value={tab.icon || ''}
                                  onValueChange={(value) => updateTab(index, { icon: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose an icon" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {ICON_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
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
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Preview Tab - Full Working Preview */}
              <TabsContent value="preview" className="flex-1 p-6">
                <div className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Real Shopify Data
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Interactive
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Device Tabs for Preview */}
                  <Tabs defaultValue="mobile" className="h-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
                      <TabsTrigger value="mobile" className="flex items-center gap-2 text-xs">
                        <Smartphone className="w-3 h-3" />
                        Mobile
                      </TabsTrigger>
                      <TabsTrigger value="tablet" className="flex items-center gap-2 text-xs">
                        <Tablet className="w-3 h-3" />
                        Tablet
                      </TabsTrigger>
                      <TabsTrigger value="desktop" className="flex items-center gap-2 text-xs">
                        <Monitor className="w-3 h-3" />
                        Desktop
                      </TabsTrigger>
                    </TabsList>

                    <div className="h-[calc(100%-80px)] flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg">
                      <TabsContent value="mobile" className="m-0 h-full w-full flex items-center justify-center">
                        <DeliveryAppWorkingPreview
                          appConfig={{
                            app_name: appName,
                            app_slug: appSlug,
                            main_app_config: {
                              hero_heading: heroHeading,
                              hero_subheading: heroSubheading
                            },
                            logo_url: logoUrl,
                            collections_config: {
                              tab_count: tabs.length,
                              tabs: tabs
                            },
                            is_active: isActive,
                            is_homepage: isHomepage
                          }}
                          device="mobile"
                        />
                      </TabsContent>
                      
                      <TabsContent value="tablet" className="m-0 h-full w-full flex items-center justify-center">
                        <DeliveryAppWorkingPreview
                          appConfig={{
                            app_name: appName,
                            app_slug: appSlug,
                            main_app_config: {
                              hero_heading: heroHeading,
                              hero_subheading: heroSubheading
                            },
                            logo_url: logoUrl,
                            collections_config: {
                              tab_count: tabs.length,
                              tabs: tabs
                            },
                            is_active: isActive,
                            is_homepage: isHomepage
                          }}
                          device="tablet"
                        />
                      </TabsContent>
                      
                      <TabsContent value="desktop" className="m-0 h-full w-full flex items-center justify-center">
                        <DeliveryAppWorkingPreview
                          appConfig={{
                            app_name: appName,
                            app_slug: appSlug,
                            main_app_config: {
                              hero_heading: heroHeading,
                              hero_subheading: heroSubheading
                            },
                            logo_url: logoUrl,
                            collections_config: {
                              tab_count: tabs.length,
                              tabs: tabs
                            },
                            is_active: isActive,
                            is_homepage: isHomepage
                          }}
                          device="desktop"
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryAppCreator;