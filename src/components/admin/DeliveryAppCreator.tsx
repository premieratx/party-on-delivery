import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Minus, 
  Upload, 
  Eye, 
  Save, 
  Trash2,
  Settings,
  Image as ImageIcon,
  Type,
  Layout,
  Palette,
  Package
} from 'lucide-react';

interface Collection {
  handle: string;
  title: string;
  products_count?: number;
}

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

interface DeliveryAppConfig {
  app_name: string;
  app_slug: string;
  logo_url?: string;
  hero_heading: string;
  hero_subheading: string;
  scrolling_text: string;
  hero_background_image?: string;
  is_homepage: boolean;
  is_active: boolean;
  tabs: Tab[];
  occasion_buttons: OccasionButton[];
}

export const DeliveryAppCreator = () => {
  const [config, setConfig] = useState<DeliveryAppConfig>({
    app_name: '',
    app_slug: '',
    hero_heading: 'Alcohol Delivery Made Easy',
    hero_subheading: 'Beer, Wine, Spirits & More Delivered to Your Door',
    scrolling_text: 'Fast Delivery • Premium Selection • Competitive Prices',
    is_homepage: false,
    is_active: true,
    tabs: [
      { index: 0, name: 'Beer', collection_handle: 'beer' },
      { index: 1, name: 'Wine', collection_handle: 'wine' },
      { index: 2, name: 'Spirits', collection_handle: 'spirits' },
      { index: 3, name: 'Mixers', collection_handle: 'mixers' },
      { index: 4, name: 'Party Supplies', collection_handle: 'party-supplies' }
    ],
    occasion_buttons: [
      { title: 'Tailgate', collection_handle: 'tailgate-beer', enabled: true },
      { title: 'Bachelorette', collection_handle: 'bachelorette-supplies', enabled: true },
      { title: 'Party Pack', collection_handle: 'disco-collection', enabled: true }
    ]
  });

  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [existingApps, setExistingApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadCollections();
    loadExistingApps();
  }, []);

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      if (error) throw error;
      
      if (data?.success && data.collections) {
        setAvailableCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const loadExistingApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingApps(data || []);
    } catch (error) {
      console.error('Error loading existing apps:', error);
    }
  };

  const loadExistingApp = async (appId: string) => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('id', appId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Load app configuration
        const collectionsConfig = data.collections_config as any || { tabs: [], tab_count: 5 };
        const mainAppConfig = data.main_app_config as any || {};
        
        setConfig({
          app_name: data.app_name,
          app_slug: data.app_slug,
          logo_url: data.logo_url,
          hero_heading: mainAppConfig.hero_heading || 'Alcohol Delivery Made Easy',
          hero_subheading: mainAppConfig.hero_subheading || 'Beer, Wine, Spirits & More Delivered to Your Door',
          scrolling_text: mainAppConfig.scrolling_text || 'Fast Delivery • Premium Selection • Competitive Prices',
          hero_background_image: mainAppConfig.hero_background_image,
          is_homepage: data.is_homepage,
          is_active: data.is_active,
          tabs: collectionsConfig.tabs || config.tabs,
          occasion_buttons: mainAppConfig.occasion_buttons || config.occasion_buttons
        });
      }
    } catch (error) {
      console.error('Error loading app:', error);
      toast({
        title: "Error",
        description: "Failed to load app configuration",
        variant: "destructive"
      });
    }
  };

  const addTab = () => {
    if (config.tabs.length < 8) {
      setConfig(prev => ({
        ...prev,
        tabs: [...prev.tabs, { 
          index: prev.tabs.length, 
          name: 'New Tab', 
          collection_handle: 'beer' 
        }]
      }));
    }
  };

  const removeTab = (index: number) => {
    setConfig(prev => ({
      ...prev,
      tabs: prev.tabs.filter((_, i) => i !== index).map((tab, i) => ({ ...tab, index: i }))
    }));
  };

  const updateTab = (index: number, field: keyof Tab, value: string) => {
    setConfig(prev => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => 
        i === index ? { ...tab, [field]: value } : tab
      )
    }));
  };

  const addOccasionButton = () => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: [...prev.occasion_buttons, { 
        title: 'New Occasion', 
        collection_handle: 'beer',
        enabled: true 
      }]
    }));
  };

  const removeOccasionButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: prev.occasion_buttons.filter((_, i) => i !== index)
    }));
  };

  const updateOccasionButton = (index: number, field: keyof OccasionButton, value: any) => {
    setConfig(prev => ({
      ...prev,
      occasion_buttons: prev.occasion_buttons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const saveDeliveryApp = async () => {
    if (!config.app_name || !config.app_slug) {
      toast({
        title: "Error",
        description: "App name and slug are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const appData = {
        app_name: config.app_name,
        app_slug: config.app_slug,
        logo_url: config.logo_url,
        is_homepage: config.is_homepage,
        is_active: config.is_active,
        collections_config: {
          tabs: config.tabs,
          tab_count: config.tabs.length
        } as any,
        main_app_config: {
          hero_heading: config.hero_heading,
          hero_subheading: config.hero_subheading,
          scrolling_text: config.scrolling_text,
          hero_background_image: config.hero_background_image,
          hero_background_type: (config as any).hero_background_type,
          hero_background_video: (config as any).hero_background_video,
          hero_background_color: (config as any).hero_background_color,
          hero_gradient_start: (config as any).hero_gradient_start,
          hero_gradient_end: (config as any).hero_gradient_end,
          hero_gradient_direction: (config as any).hero_gradient_direction,
          occasion_buttons: config.occasion_buttons
        } as any
      };

      let result;
      if (selectedAppId) {
        // Update existing app
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', selectedAppId);
      } else {
        // Create new app
        result = await supabase
          .from('delivery_app_variations')
          .insert(appData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Delivery app ${selectedAppId ? 'updated' : 'created'} successfully`,
      });

      // Reload existing apps
      loadExistingApps();
      
      // If setting as homepage, clear other homepage flags
      if (config.is_homepage) {
        await supabase
          .from('delivery_app_variations')
          .update({ is_homepage: false })
          .neq('id', selectedAppId || '');
      }

    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setConfig(prev => ({ ...prev, app_slug: slug }));
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Delivery App Creator</h2>
          <p className="text-muted-foreground">Create and manage custom delivery apps with proper collection mapping</p>
        </div>
      </div>

      {/* Load Existing App */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-primary" />
            Load Existing App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-base font-medium">Select Existing App</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose an existing app to edit" />
                </SelectTrigger>
                <SelectContent>
                  {existingApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{app.app_name}</span>
                        <span className="text-sm text-muted-foreground">
                          /{app.app_slug} {app.is_homepage && '(HOMEPAGE)'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => selectedAppId && loadExistingApp(selectedAppId)}
                disabled={!selectedAppId}
                className="flex-1"
              >
                Load App
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedAppId('');
                  setConfig({
                    app_name: '',
                    app_slug: '',
                    hero_heading: 'Alcohol Delivery Made Easy',
                    hero_subheading: 'Beer, Wine, Spirits & More Delivered to Your Door',
                    scrolling_text: 'Fast Delivery • Premium Selection • Competitive Prices',
                    is_homepage: false,
                    is_active: true,
                    tabs: [
                      { index: 0, name: 'Beer', collection_handle: 'beer-collection' },
                      { index: 1, name: 'Wine', collection_handle: 'wine-collection' },
                      { index: 2, name: 'Spirits', collection_handle: 'spirits-collection' },
                      { index: 3, name: 'Cocktails', collection_handle: 'cocktail-kits' },
                      { index: 4, name: 'Seltzers', collection_handle: 'seltzer-collection' }
                    ],
                    occasion_buttons: [
                      { title: 'Tailgate', collection_handle: 'tailgate-beer', enabled: true },
                      { title: 'Bachelorette', collection_handle: 'bachelorette-booze', enabled: true },
                      { title: 'Party Pack', collection_handle: 'disco-collection', enabled: true }
                    ]
                  });
                }}
                className="flex-1"
              >
                New App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="tabs">Product Tabs</TabsTrigger>
          <TabsTrigger value="occasions">Occasions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app_name">App Name *</Label>
                  <Input
                    id="app_name"
                    value={config.app_name}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, app_name: e.target.value }));
                      if (!config.app_slug) generateSlug(e.target.value);
                    }}
                    placeholder="My Delivery App"
                  />
                </div>
                
                <div>
                  <Label htmlFor="app_slug">App Slug *</Label>
                  <Input
                    id="app_slug"
                    value={config.app_slug}
                    onChange={(e) => setConfig(prev => ({ ...prev, app_slug: e.target.value }))}
                    placeholder="my-delivery-app"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={config.logo_url || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_homepage"
                    checked={config.is_homepage}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, is_homepage: !!checked }))
                    }
                  />
                  <Label htmlFor="is_homepage">Set as Homepage</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, is_active: !!checked }))
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero_heading">Hero Heading</Label>
                <Input
                  id="hero_heading"
                  value={config.hero_heading}
                  onChange={(e) => setConfig(prev => ({ ...prev, hero_heading: e.target.value }))}
                  placeholder="Alcohol Delivery Made Easy"
                />
              </div>

              <div>
                <Label htmlFor="hero_subheading">Hero Subheading</Label>
                <Input
                  id="hero_subheading"
                  value={config.hero_subheading}
                  onChange={(e) => setConfig(prev => ({ ...prev, hero_subheading: e.target.value }))}
                  placeholder="Beer, Wine, Spirits & More Delivered to Your Door"
                />
              </div>

              <div>
                <Label htmlFor="scrolling_text">Scrolling Text</Label>
                <Input
                  id="scrolling_text"
                  value={config.scrolling_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, scrolling_text: e.target.value }))}
                  placeholder="Fast Delivery • Premium Selection • Competitive Prices"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Hero Background
                </Label>
                
                <Tabs defaultValue="image" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="image">Image</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="color">Color</TabsTrigger>
                    <TabsTrigger value="gradient">Gradient</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="image" className="space-y-3">
                    <div>
                      <Label htmlFor="hero_bg_image">Background Image URL</Label>
                      <Input
                        id="hero_bg_image"
                        value={config.hero_background_image || ''}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          hero_background_image: e.target.value,
                          hero_background_type: 'image' 
                        }))}
                        placeholder="https://example.com/hero-bg.jpg (or .gif)"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="video" className="space-y-3">
                    <div>
                      <Label htmlFor="hero_bg_video">Background Video URL</Label>
                      <Input
                        id="hero_bg_video"
                        value={(config as any).hero_background_video || ''}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          hero_background_video: e.target.value,
                          hero_background_type: 'video',
                          hero_background_image: undefined
                        }))}
                        placeholder="https://example.com/hero-bg.mp4"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="color" className="space-y-3">
                    <div>
                      <Label htmlFor="hero_bg_color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="hero_bg_color"
                          type="color"
                          value={(config as any).hero_background_color || '#000000'}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            hero_background_color: e.target.value,
                            hero_background_type: 'color',
                            hero_background_image: undefined,
                            hero_background_video: undefined
                          }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={(config as any).hero_background_color || '#000000'}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            hero_background_color: e.target.value,
                            hero_background_type: 'color',
                            hero_background_image: undefined,
                            hero_background_video: undefined
                          }))}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="gradient" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gradient_start">Start Color</Label>
                        <Input
                          id="gradient_start"
                          type="color"
                          value={(config as any).hero_gradient_start || '#000000'}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            hero_gradient_start: e.target.value,
                            hero_background_type: 'gradient',
                            hero_background_image: undefined,
                            hero_background_video: undefined
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gradient_end">End Color</Label>
                        <Input
                          id="gradient_end"
                          type="color"
                          value={(config as any).hero_gradient_end || '#333333'}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            hero_gradient_end: e.target.value,
                            hero_background_type: 'gradient',
                            hero_background_image: undefined,
                            hero_background_video: undefined
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gradient_direction">Direction</Label>
                      <Select 
                        value={(config as any).hero_gradient_direction || '135deg'}
                        onValueChange={(value) => setConfig(prev => ({ 
                          ...prev, 
                          hero_gradient_direction: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0deg">Top to Bottom</SelectItem>
                          <SelectItem value="90deg">Left to Right</SelectItem>
                          <SelectItem value="135deg">Diagonal ↘</SelectItem>
                          <SelectItem value="45deg">Diagonal ↗</SelectItem>
                          <SelectItem value="180deg">Bottom to Top</SelectItem>
                          <SelectItem value="270deg">Right to Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabs" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-6 w-6 text-primary" />
                Product Tabs Configuration
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Configure which Shopify collections appear as tabs in your delivery app
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Product Category Tabs</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addTab}
                    disabled={config.tabs.length >= 8}
                    size="sm"
                    className="h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tab
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {config.tabs.map((tab, index) => (
                  <div key={index} className="border-2 rounded-xl p-4 space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Tab {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeTab(index)}
                        variant="outline"
                        size="sm"
                        disabled={config.tabs.length <= 1}
                        className="h-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`tab_name_${index}`} className="font-medium">Tab Display Name</Label>
                        <Input
                          id={`tab_name_${index}`}
                          value={tab.name}
                          onChange={(e) => updateTab(index, 'name', e.target.value)}
                          placeholder="e.g., Beer"
                          className="h-12 mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`collection_${index}`} className="font-medium">Shopify Collection</Label>
                        <Select
                          value={tab.collection_handle}
                          onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                        >
                          <SelectTrigger className="h-12 mt-1">
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {availableCollections.map((collection) => (
                              <SelectItem key={collection.handle} value={collection.handle}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{collection.title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {collection.products_count || 0} products • Handle: {collection.handle}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {config.tabs.length === 0 && (
                  <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">No tabs configured</p>
                    <p className="text-sm text-muted-foreground mt-1">Add a tab to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occasions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  "What's the Occasion?" Buttons
                </div>
                <Button onClick={addOccasionButton}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Button
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the occasion buttons that appear in the "What's the Occasion?" section
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.occasion_buttons.map((button, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>Button Title</Label>
                      <Input
                        value={button.title}
                        onChange={(e) => updateOccasionButton(index, 'title', e.target.value)}
                        placeholder="Button Title"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Label>Collection</Label>
                      <Select 
                        value={button.collection_handle}
                        onValueChange={(value) => updateOccasionButton(index, 'collection_handle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCollections.map((collection) => (
                            <SelectItem key={collection.handle} value={collection.handle}>
                              {collection.title} ({collection.products_count || 0} products)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={button.enabled}
                        onCheckedChange={(checked) => 
                          updateOccasionButton(index, 'enabled', !!checked)
                        }
                      />
                      <Label>Enabled</Label>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOccasionButton(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedAppId ? 'Editing existing app' : 'Creating new delivery app'}
        </div>
        <Button 
          onClick={saveDeliveryApp}
          disabled={loading || !config.app_name || !config.app_slug}
          size="lg"
          className="min-w-[160px]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {selectedAppId ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {selectedAppId ? 'Update App' : 'Create App'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};