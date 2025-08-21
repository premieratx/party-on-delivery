import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Trash2, Package, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryAppTab {
  id: string;
  name: string;
  handle: string;
  icon: string;
  shopify_collection_handle: string;
}

interface DeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

const ICON_OPTIONS = [
  { value: 'package', label: '📦 Package' },
  { value: 'wine', label: '🍷 Wine' },
  { value: 'beer', label: '🍺 Beer' },
  { value: 'cocktail', label: '🍸 Cocktail' },
  { value: 'party', label: '🎉 Party' },
  { value: 'food', label: '🍕 Food' },
  { value: 'shopping', label: '🛒 Shopping' },
  { value: 'star', label: '⭐ Star' }
];

export const FixedDeliveryAppCreator: React.FC<DeliveryAppCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  
  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collections, setCollections] = useState<Array<{handle: string, name: string, products_count: number}>>([]);

  // Load collections on mount
  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      // Try to get collections from the cache first
      const { data: cacheData, error: cacheError } = await supabase
        .from('cache')
        .select('data')
        .eq('key', 'shopify_collections')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cacheData && cacheData.length > 0 && cacheData[0].data) {
        const cachedCollections = (cacheData[0].data as any).collections || [];
        const formattedCollections = cachedCollections
          .filter((col: any) => col.products_count > 0)
          .map((col: any) => ({
            handle: col.handle,
            name: col.title || col.handle.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            products_count: col.products_count
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setCollections(formattedCollections);
      } else {
        // Fallback collections
        setCollections([
          { handle: 'spirits', name: 'Spirits', products_count: 100 },
          { handle: 'beer', name: 'Beer', products_count: 62 },
          { handle: 'wine', name: 'Wine', products_count: 45 },
          { handle: 'cocktail-kits', name: 'Cocktail Kits', products_count: 40 },
          { handle: 'party-supplies', name: 'Party Supplies', products_count: 46 }
        ]);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: "Error loading collections",
        description: "Using default collections instead",
        variant: "destructive"
      });
      // Set fallback collections
      setCollections([
        { handle: 'spirits', name: 'Spirits', products_count: 100 },
        { handle: 'beer', name: 'Beer', products_count: 62 },
        { handle: 'wine', name: 'Wine', products_count: 45 }
      ]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  // Initialize form with existing data
  useEffect(() => {
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
      setTabs([]);
      setIsActive(true);
      setIsHomepage(false);
    }
  }, [initial, open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleAppNameChange = (name: string) => {
    setAppName(name);
    if (!initial) {
      setAppSlug(generateSlug(name));
    }
  };

  const addTab = () => {
    const newTab: DeliveryAppTab = {
      id: Date.now().toString(),
      name: '',
      handle: '',
      icon: 'package',
      shopify_collection_handle: ''
    };
    setTabs([...tabs, newTab]);
  };

  const updateTab = (index: number, updates: Partial<DeliveryAppTab>) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], ...updates };
    
    // Auto-generate handle from name
    if (updates.name) {
      newTabs[index].handle = generateSlug(updates.name);
    }
    
    setTabs(newTabs);
  };

  const removeTab = (index: number) => {
    setTabs(tabs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!appName.trim() || !appSlug.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in app name and slug",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: appName,
        app_slug: appSlug,
        main_app_config: {
          hero_heading: heroHeading,
          hero_subheading: heroSubheading
        } as any,
        collections_config: {
          tabs: tabs
        } as any,
        logo_url: logoUrl,
        is_active: isActive,
        is_homepage: isHomepage,
        updated_at: new Date().toISOString()
      };

      if (initial?.id) {
        // Update existing
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Delivery app updated successfully"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert(appData);

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Delivery app created successfully"
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {initial ? 'Edit' : 'Create'} Delivery App
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="tabs">Collection Tabs</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="basic" className="space-y-4 h-full overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appName">App Name *</Label>
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => handleAppNameChange(e.target.value)}
                    placeholder="e.g., Party On Delivery"
                  />
                </div>
                <div>
                  <Label htmlFor="appSlug">App Slug *</Label>
                  <Input
                    id="appSlug"
                    value={appSlug}
                    onChange={(e) => setAppSlug(e.target.value)}
                    placeholder="e.g., party-on-delivery"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="heroHeading">Hero Heading</Label>
                <Input
                  id="heroHeading"
                  value={heroHeading}
                  onChange={(e) => setHeroHeading(e.target.value)}
                  placeholder="e.g., Premium Alcohol Delivery"
                />
              </div>

              <div>
                <Label htmlFor="heroSubheading">Hero Subheading</Label>
                <Input
                  id="heroSubheading"
                  value={heroSubheading}
                  onChange={(e) => setHeroSubheading(e.target.value)}
                  placeholder="e.g., Fast delivery in 30-60 minutes"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isHomepage}
                    onCheckedChange={setIsHomepage}
                  />
                  <Label>Set as Homepage</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tabs" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Collection Tabs</h3>
                  <Button onClick={addTab} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tab
                  </Button>
                </div>

                {collectionsLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading collections...
                  </div>
                )}

                <div className="space-y-4">
                  {tabs.map((tab, index) => (
                    <Card key={tab.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">Tab {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTab(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Tab Name</Label>
                            <Input
                              value={tab.name}
                              onChange={(e) => updateTab(index, { name: e.target.value })}
                              placeholder="e.g., Beer"
                            />
                          </div>
                          <div>
                            <Label>Tab Handle</Label>
                            <Input
                              value={tab.handle}
                              onChange={(e) => updateTab(index, { handle: e.target.value })}
                              placeholder="e.g., beer"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Shopify Collection</Label>
                          <Select
                            value={tab.shopify_collection_handle}
                            onValueChange={(value) => updateTab(index, { shopify_collection_handle: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a collection" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {collections.map((collection) => (
                                <SelectItem key={collection.handle} value={collection.handle}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{collection.name}</span>
                                    <Badge variant="secondary" className="ml-2">
                                      {collection.products_count}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Icon</Label>
                          <Select
                            value={tab.icon}
                            onValueChange={(value) => updateTab(index, { icon: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an icon" />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center space-y-2">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Preview will be available after saving</p>
                </div>
              </div>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save App
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};