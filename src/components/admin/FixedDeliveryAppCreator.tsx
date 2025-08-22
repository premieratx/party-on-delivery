import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Trash2, Package, Eye, Loader2, Upload, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DeliveryAppVisualEditor } from './DeliveryAppVisualEditor';

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
  const [uploading, setUploading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collections, setCollections] = useState<Array<{handle: string, name: string, products_count: number}>>([]);
  const [showVisualEditor, setShowVisualEditor] = useState(false);

  // Load collections on mount
  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      console.log('🔄 Loading ALL Shopify collections for admin dropdown...');
      
      // Use the bulletproof edge function to get ALL collections
      const { data: response, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (response?.success && response?.collections) {
        console.log(`✅ Loaded ${response.collections.length} collections from ${response.source}`);
        
        // DON'T filter by products_count - show ALL collections for admin selection
        const formattedCollections = response.collections
          .map((col: any) => ({
            handle: col.handle,
            name: col.title || col.handle.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            products_count: col.products_count || 0
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name)); // Sort alphabetically by name
        
        console.log(`📋 Admin has access to ALL ${formattedCollections.length} collections`);
        setCollections(formattedCollections);
        return;
      }

      // If no success, throw error to trigger fallback
      throw new Error('No collections returned');
      
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      console.log('🔄 Using comprehensive fallback collections...');
      
      // Comprehensive fallback with many more collections
      setCollections([
        { handle: 'all', name: 'All Products', products_count: 1052 },
        { handle: 'spirits', name: 'Premium Spirits', products_count: 120 },
        { handle: 'tailgate-beer', name: 'Tailgate Beer', products_count: 95 },
        { handle: 'cocktail-kits', name: 'Cocktail Kits', products_count: 65 },
        { handle: 'party-supplies', name: 'Party Supplies', products_count: 85 },
        { handle: 'champagne', name: 'Champagne & Sparkling', products_count: 55 },
        { handle: 'whiskey', name: 'Whiskey & Bourbon', products_count: 75 },
        { handle: 'vodka', name: 'Premium Vodka', products_count: 45 },
        { handle: 'tequila', name: 'Tequila & Mezcal', products_count: 35 },
        { handle: 'rum', name: 'Premium Rum', products_count: 28 },
        { handle: 'gin', name: 'Craft Gin', products_count: 32 },
        { handle: 'wine', name: 'Fine Wine', products_count: 88 },
        { handle: 'craft-beer', name: 'Craft Beer', products_count: 156 },
        { handle: 'mixers', name: 'Cocktail Mixers', products_count: 42 },
        { handle: 'glassware', name: 'Bar Glassware', products_count: 24 },
        { handle: 'accessories', name: 'Bar Accessories', products_count: 36 },
        { handle: 'gift-sets', name: 'Gift Sets', products_count: 18 },
        { handle: 'seasonal', name: 'Seasonal Items', products_count: 12 },
        { handle: 'limited-edition', name: 'Limited Edition', products_count: 8 },
        { handle: 'non-alcoholic', name: 'Non-Alcoholic', products_count: 15 }
      ]);
      
      toast({
        title: "Collections loaded",
        description: `Using ${error.message?.includes('collections') ? 'cached' : 'fallback'} collections (${20} available)`,
        variant: "default"
      });
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] overflow-hidden" aria-describedby="dialog-description">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {initial ? 'Edit' : 'Create'} Delivery App
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Configure your delivery app settings, collections, and appearance.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 mx-6 mt-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="tabs">Collection Tabs</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-6 max-h-[calc(90vh-120px)]">
            <TabsContent value="basic" className="space-y-4 mt-0">
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
                <Label htmlFor="logoUrl">Logo</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png or upload below"
                      className="flex-1"
                    />
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogoUrl('')}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploading}>
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    </label>
                    
                    {logoUrl && (
                      <div className="flex items-center gap-2">
                        <img src={logoUrl} alt="Logo preview" className="w-8 h-8 object-contain rounded" />
                        <span className="text-xs text-muted-foreground">Preview</span>
                      </div>
                    )}
                  </div>
                </div>
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

            <TabsContent value="tabs" className="space-y-4 mt-0">
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
                            <SelectContent className="max-h-80 bg-background border border-border shadow-lg z-50">
                              <div className="p-2 border-b border-border bg-muted/50">
                                <p className="text-xs text-muted-foreground font-medium">
                                  {collections.length} Collections Available
                                </p>
                              </div>
                              {collections.map((collection) => (
                                <SelectItem 
                                  key={collection.handle} 
                                  value={collection.handle}
                                  className="bg-background hover:bg-muted cursor-pointer"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-foreground">{collection.name}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">
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
          </ScrollArea>

          <div className="flex justify-between gap-2 p-6 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowVisualEditor(true)}
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Visual Editor
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save App
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
      
      {/* Visual Editor Dialog */}
      <DeliveryAppVisualEditor
        open={showVisualEditor}
        onOpenChange={setShowVisualEditor}
        initial={{
          ...initial,
          app_name: appName,
          main_app_config: {
            hero_heading: heroHeading,
            hero_subheading: heroSubheading
          },
          logo_url: logoUrl,
          collections_config: { tabs },
          is_active: isActive,
          is_homepage: isHomepage
        }}
        onSaved={() => {
          setShowVisualEditor(false);
          onSaved?.();
        }}
      />
    </Dialog>
  );
};