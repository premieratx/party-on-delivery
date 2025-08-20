import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
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
  Package,
  Type,
  Layout,
  Palette,
  ArrowLeft
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
  icon?: string;
  subheadline_text?: string;
  subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat';
  subheadline_size?: 'sm' | 'md' | 'lg' | 'xl';
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
  hero_background_video?: string;
  hero_background_color?: string;
  hero_gradient_start?: string;
  hero_gradient_end?: string;
  hero_gradient_direction?: string;
  hero_background_type?: 'color' | 'gradient' | 'image' | 'video';
  is_homepage: boolean;
  is_active: boolean;
  tabs: Tab[];
  occasion_buttons: OccasionButton[];
}

interface ComprehensiveDeliveryAppEditorProps {
  onBack?: () => void;
}

export const ComprehensiveDeliveryAppEditor: React.FC<ComprehensiveDeliveryAppEditorProps> = ({
  onBack
}) => {
  const [config, setConfig] = useState<DeliveryAppConfig>({
    app_name: '',
    app_slug: '',
    hero_heading: 'Alcohol Delivery Made Easy',
    hero_subheading: 'Beer, Wine, Spirits & More Delivered to Your Door',
    scrolling_text: 'Fast Delivery • Premium Selection • Competitive Prices',
    hero_background_type: 'color',
    hero_background_color: '#ffffff',
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

  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [existingApps, setExistingApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const { toast } = useToast();

  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCollections();
    loadExistingApps();
  }, []);

  const uploadAsset = async (file: File, kind: 'logo' | 'bg'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const base = (config.app_slug || 'delivery-app').slice(0, 60);
      const fileName = `delivery-${base}-${kind}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cover-assets')
        .getPublicUrl(fileName);
      
      toast({
        title: "Upload successful",
        description: `${kind === 'logo' ? 'Logo' : 'Background image'} uploaded successfully`,
      });
      
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed", 
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      if (error) throw error;
      
      if (data?.success && data.collections) {
        setAvailableCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: "Error",
        description: "Failed to load Shopify collections",
        variant: "destructive"
      });
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
          hero_background_video: mainAppConfig.hero_background_video,
          hero_background_color: mainAppConfig.hero_background_color || '#ffffff',
          hero_gradient_start: mainAppConfig.hero_gradient_start,
          hero_gradient_end: mainAppConfig.hero_gradient_end,
          hero_gradient_direction: mainAppConfig.hero_gradient_direction,
          hero_background_type: mainAppConfig.hero_background_type || 'color',
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
          collection_handle: availableCollections[0]?.handle || 'beer' 
        }]
      }));
    }
  };

  const removeTab = (index: number) => {
    if (config.tabs.length > 1) {
      setConfig(prev => ({
        ...prev,
        tabs: prev.tabs.filter((_, i) => i !== index).map((tab, i) => ({ ...tab, index: i }))
      }));
    }
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
        collection_handle: availableCollections[0]?.handle || 'beer',
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
          hero_background_video: config.hero_background_video,
          hero_background_color: config.hero_background_color,
          hero_gradient_start: config.hero_gradient_start,
          hero_gradient_end: config.hero_gradient_end,
          hero_gradient_direction: config.hero_gradient_direction,
          hero_background_type: config.hero_background_type,
          occasion_buttons: config.occasion_buttons
        } as any,
        styles: {
          theme: 'default'
        }
      };

      let result;
      if (selectedAppId) {
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', selectedAppId);
      } else {
        result = await supabase
          .from('delivery_app_variations')
          .insert(appData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Delivery app ${selectedAppId ? 'updated' : 'created'} successfully`,
      });

      loadExistingApps();
      
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Delivery App Creator
              </h2>
              <p className="text-muted-foreground">Create sophisticated delivery apps with advanced collection mapping</p>
            </div>
          </div>
          <Button 
            onClick={saveDeliveryApp} 
            disabled={loading || !config.app_name || !config.app_slug}
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : selectedAppId ? 'Update App' : 'Save App'}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-6 space-y-6">
          {/* Load Existing App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Load Existing App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Select Existing App</Label>
                  <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                    <SelectTrigger>
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
                        hero_background_type: 'color',
                        hero_background_color: '#ffffff',
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

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Hero Section
              </TabsTrigger>
              <TabsTrigger value="tabs" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Product Tabs
              </TabsTrigger>
              <TabsTrigger value="occasions" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Occasions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
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
                    <Label htmlFor="logo_url">Logo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logo_url"
                        value={config.logo_url || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={config.is_active}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: !!checked }))}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_homepage"
                        checked={config.is_homepage}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_homepage: !!checked }))}
                      />
                      <Label htmlFor="is_homepage">Set as Homepage</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Section Configuration</CardTitle>
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
                    <Textarea
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

                  <div>
                    <Label>Background Type</Label>
                    <Select value={config.hero_background_type} onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, hero_background_type: value as any }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.hero_background_type === 'color' && (
                    <div>
                      <Label htmlFor="hero_background_color">Background Color</Label>
                      <Input
                        id="hero_background_color"
                        type="color"
                        value={config.hero_background_color}
                        onChange={(e) => setConfig(prev => ({ ...prev, hero_background_color: e.target.value }))}
                      />
                    </div>
                  )}

                  {config.hero_background_type === 'gradient' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hero_gradient_start">Gradient Start</Label>
                        <Input
                          id="hero_gradient_start"
                          type="color"
                          value={config.hero_gradient_start}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero_gradient_start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero_gradient_end">Gradient End</Label>
                        <Input
                          id="hero_gradient_end"
                          type="color"
                          value={config.hero_gradient_end}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero_gradient_end: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {config.hero_background_type === 'image' && (
                    <div>
                      <Label htmlFor="hero_background_image">Background Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="hero_background_image"
                          value={config.hero_background_image || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero_background_image: e.target.value }))}
                          placeholder="https://example.com/background.jpg"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => bgImageInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tabs" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Product Tabs Configuration</CardTitle>
                  <Button 
                    onClick={addTab} 
                    size="sm" 
                    disabled={config.tabs.length >= 8}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tab
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Configure up to 8 product tabs. Each tab will display products from the selected Shopify collection.
                    </div>
                    
                    {config.tabs.map((tab, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Tab {index + 1}</Badge>
                          {config.tabs.length > 1 && (
                            <Button
                              onClick={() => removeTab(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tab Name</Label>
                            <Input
                              value={tab.name}
                              onChange={(e) => updateTab(index, 'name', e.target.value)}
                              placeholder="Tab name"
                            />
                          </div>
                          
                          <div>
                            <Label>Shopify Collection</Label>
                            <Select
                              value={tab.collection_handle}
                              onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select collection" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCollections.map((collection) => (
                                  <SelectItem key={collection.handle} value={collection.handle}>
                                    <div className="flex flex-col">
                                      <span>{collection.title}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {collection.handle} ({collection.products_count || 0} products)
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Subheadline Text (Optional)</Label>
                            <Input
                              value={tab.subheadline_text || ''}
                              onChange={(e) => updateTab(index, 'subheadline_text', e.target.value)}
                              placeholder="Optional subheadline"
                            />
                          </div>
                          
                          <div>
                            <Label>Icon (Optional)</Label>
                            <Input
                              value={tab.icon || ''}
                              onChange={(e) => updateTab(index, 'icon', e.target.value)}
                              placeholder="🍺 (emoji or text)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="occasions" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Occasion Buttons</CardTitle>
                  <Button onClick={addOccasionButton} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Create special occasion buttons that filter products by collection.
                    </div>
                    
                    {config.occasion_buttons.map((button, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Button {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={button.enabled}
                              onCheckedChange={(checked) => updateOccasionButton(index, 'enabled', checked)}
                            />
                            <Button
                              onClick={() => removeOccasionButton(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Button Title</Label>
                            <Input
                              value={button.title}
                              onChange={(e) => updateOccasionButton(index, 'title', e.target.value)}
                              placeholder="Button title"
                            />
                          </div>
                          
                          <div>
                            <Label>Shopify Collection</Label>
                            <Select
                              value={button.collection_handle}
                              onValueChange={(value) => updateOccasionButton(index, 'collection_handle', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select collection" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCollections.map((collection) => (
                                  <SelectItem key={collection.handle} value={collection.handle}>
                                    <div className="flex flex-col">
                                      <span>{collection.title}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {collection.handle} ({collection.products_count || 0} products)
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = await uploadAsset(file, 'logo');
            if (url) setConfig(prev => ({ ...prev, logo_url: url }));
          }
        }}
        style={{ display: 'none' }}
      />
      <input
        ref={bgImageInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = await uploadAsset(file, 'bg');
            if (url) setConfig(prev => ({ ...prev, hero_background_image: url }));
          }
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
};