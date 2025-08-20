import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Minus, 
  Save, 
  Eye, 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Tablet,
  Upload,
  Copy,
  Trash2,
  Settings,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

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
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  hero_heading: string;
  hero_subheading: string;
  scrolling_text: string;
  hero_background_color?: string;
  is_homepage: boolean;
  is_active: boolean;
  tabs: Tab[];
  occasion_buttons: OccasionButton[];
}

interface ImprovedDeliveryAppCreatorProps {
  onBack?: () => void;
  initial?: DeliveryAppConfig | null;
  onSaved?: () => void;
}

const DEVICE_PREVIEWS = {
  mobile: { name: 'Mobile', icon: Smartphone, width: 375, height: 667 },
  tablet: { name: 'Tablet', icon: Tablet, width: 768, height: 1024 },
  desktop: { name: 'Desktop', icon: Monitor, width: 1200, height: 800 }
};

const PRESET_THEMES = {
  default: {
    name: 'Default',
    hero_background_color: '#ffffff',
    primary_color: '#3b82f6',
    text_color: '#1f2937'
  },
  dark: {
    name: 'Dark Mode',
    hero_background_color: '#1f2937',
    primary_color: '#60a5fa',
    text_color: '#f9fafb'
  },
  premium: {
    name: 'Premium Gold',
    hero_background_color: '#fef3c7',
    primary_color: '#d97706',
    text_color: '#92400e'
  },
  ocean: {
    name: 'Ocean Blue',
    hero_background_color: '#e0f2fe',
    primary_color: '#0284c7',
    text_color: '#0c4a6e'
  }
};

export const ImprovedDeliveryAppCreator: React.FC<ImprovedDeliveryAppCreatorProps> = ({
  onBack,
  initial,
  onSaved
}) => {
  const [config, setConfig] = useState<DeliveryAppConfig>({
    app_name: '',
    app_slug: '',
    hero_heading: 'Alcohol Delivery Made Easy',
    hero_subheading: 'Beer, Wine, Spirits & More Delivered to Your Door',
    scrolling_text: 'Fast Delivery • Premium Selection • Competitive Prices',
    hero_background_color: '#ffffff',
    is_homepage: false,
    is_active: true,
    tabs: [
      { index: 0, name: 'Beer', collection_handle: 'beer-collection' },
      { index: 1, name: 'Wine', collection_handle: 'wine-collection' },
      { index: 2, name: 'Spirits', collection_handle: 'spirits-collection' }
    ],
    occasion_buttons: [
      { title: 'Tailgate', collection_handle: 'tailgate-beer', enabled: true },
      { title: 'Bachelorette', collection_handle: 'bachelorette-booze', enabled: true }
    ]
  });

  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_PREVIEWS>('mobile');
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof PRESET_THEMES>('default');
  const { toast } = useToast();

  const isEditing = !!initial?.id;

  // Load initial data
  useEffect(() => {
    loadCollections();
    if (initial) {
      setConfig(initial);
    }
  }, [initial]);

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

  const handleSave = async () => {
    if (!config.app_name || !config.app_slug) {
      toast({
        title: "Error",
        description: "App name and slug are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const appData = {
        app_name: config.app_name,
        app_slug: config.app_slug,
        logo_url: config.logo_url,
        is_homepage: config.is_homepage,
        is_active: config.is_active,
        collections_config: JSON.parse(JSON.stringify({
          tabs: config.tabs,
          tab_count: config.tabs.length
        })),
        main_app_config: JSON.parse(JSON.stringify({
          hero_heading: config.hero_heading,
          hero_subheading: config.hero_subheading,
          scrolling_text: config.scrolling_text,
          hero_background_color: config.hero_background_color,
          occasion_buttons: config.occasion_buttons
        }))
      };

      let result;
      if (isEditing && config.id) {
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('delivery_app_variations')
          .insert(appData);
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      toast({
        title: "Success",
        description: `Delivery app ${isEditing ? 'updated' : 'created'} successfully`,
      });

      sonnerToast.success(`Delivery app ${isEditing ? 'updated' : 'created'} successfully!`);
      onSaved?.();

    } catch (error) {
      console.error('Error saving delivery app:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery app",
        variant: "destructive"
      });
      sonnerToast.error('Failed to save delivery app');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: keyof typeof PRESET_THEMES) => {
    const themeData = PRESET_THEMES[theme];
    setConfig(prev => ({
      ...prev,
      hero_background_color: themeData.hero_background_color
    }));
    setSelectedTheme(theme);
    sonnerToast.success(`Applied ${themeData.name} theme!`);
  };

  const addTab = () => {
    if (config.tabs.length < 8) {
      const newTabs = [...config.tabs, {
        index: config.tabs.length,
        name: 'New Tab',
        collection_handle: availableCollections[0]?.handle || 'beer'
      }];
      setConfig({ ...config, tabs: newTabs });
    }
  };

  const removeTab = (index: number) => {
    if (config.tabs.length > 1) {
      const newTabs = config.tabs.filter((_, i) => i !== index).map((tab, i) => ({ ...tab, index: i }));
      setConfig({ ...config, tabs: newTabs });
    }
  };

  const updateTab = (index: number, field: keyof Tab, value: string) => {
    const newTabs = config.tabs.map((tab, i) => 
      i === index ? { ...tab, [field]: value } : tab
    );
    setConfig({ ...config, tabs: newTabs });
  };

  const duplicateApp = () => {
    setConfig(prev => ({
      ...prev,
      app_name: `${prev.app_name} (Copy)`,
      app_slug: `${prev.app_slug}-copy`,
      id: undefined // Remove ID for duplication
    }));
    sonnerToast.success('App duplicated! Ready to save as new app.');
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const renderDevicePreview = () => {
    const device = DEVICE_PREVIEWS[activeDevice];
    const scale = activeDevice === 'desktop' ? 0.5 : activeDevice === 'tablet' ? 0.6 : 0.8;
    
    return (
      <div className="flex justify-center p-4">
        <div 
          className="border-2 border-muted rounded-lg overflow-hidden shadow-xl"
          style={{
            width: device.width * scale,
            height: device.height * scale,
            backgroundColor: config.hero_background_color || '#ffffff'
          }}
        >
          <div className="p-4 space-y-4 h-full flex flex-col">
            {/* Logo placeholder */}
            {config.logo_url && (
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            )}
            
            {/* Hero content */}
            <div className="text-center space-y-2">
              <h1 className="text-lg font-bold" style={{ fontSize: scale * 24 }}>
                {config.hero_heading}
              </h1>
              <p className="text-muted-foreground" style={{ fontSize: scale * 16 }}>
                {config.hero_subheading}
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontSize: scale * 12 }}>
                {config.scrolling_text}
              </p>
            </div>
            
            {/* Tabs preview */}
            <div className="flex gap-1 justify-center">
              {config.tabs.slice(0, 4).map((tab, index) => (
                <div 
                  key={index} 
                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
                  style={{ fontSize: scale * 10 }}
                >
                  {tab.name}
                </div>
              ))}
            </div>
            
            {/* Occasion buttons preview */}
            {config.occasion_buttons.length > 0 && (
              <div className="flex gap-1 justify-center">
                {config.occasion_buttons.slice(0, 2).map((button, index) => (
                  <div 
                    key={index} 
                    className="px-2 py-1 border border-primary text-primary rounded text-xs"
                    style={{ fontSize: scale * 10 }}
                  >
                    {button.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel - Configuration */}
      <div className="w-96 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? 'Edit App' : 'Create App'}
              </h2>
              <p className="text-muted-foreground text-sm">
                Design your delivery app experience
              </p>
            </div>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app_name">App Name</Label>
                  <Input
                    id="app_name"
                    value={config.app_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setConfig({ 
                        ...config, 
                        app_name: name,
                        app_slug: generateSlug(name) 
                      });
                    }}
                    placeholder="My Awesome Delivery App"
                  />
                </div>
                <div>
                  <Label htmlFor="app_slug">App Slug</Label>
                  <Input
                    id="app_slug"
                    value={config.app_slug}
                    onChange={(e) => setConfig({ ...config, app_slug: e.target.value })}
                    placeholder="my-awesome-app"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /app/{config.app_slug}
                  </p>
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo_url"
                      value={config.logo_url || ''}
                      onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_homepage">Set as Homepage</Label>
                  <Switch
                    id="is_homepage"
                    checked={config.is_homepage}
                    onCheckedChange={(checked) => setConfig({ ...config, is_homepage: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme & Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                    <Button
                      key={key}
                      variant={selectedTheme === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyTheme(key as keyof typeof PRESET_THEMES)}
                      className="h-auto p-2 flex flex-col items-center gap-1"
                    >
                      <div 
                        className="w-full h-6 rounded"
                        style={{ backgroundColor: theme.hero_background_color }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={config.hero_background_color || '#ffffff'}
                      onChange={(e) => setConfig({ ...config, hero_background_color: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={config.hero_background_color || '#ffffff'}
                      onChange={(e) => setConfig({ ...config, hero_background_color: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hero Content */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Hero Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero_heading">Main Heading</Label>
                  <Input
                    id="hero_heading"
                    value={config.hero_heading}
                    onChange={(e) => setConfig({ ...config, hero_heading: e.target.value })}
                    placeholder="Alcohol Delivery Made Easy"
                  />
                </div>
                <div>
                  <Label htmlFor="hero_subheading">Subheading</Label>
                  <Input
                    id="hero_subheading"
                    value={config.hero_subheading}
                    onChange={(e) => setConfig({ ...config, hero_subheading: e.target.value })}
                    placeholder="Beer, Wine, Spirits & More"
                  />
                </div>
                <div>
                  <Label htmlFor="scrolling_text">Scrolling Text</Label>
                  <Input
                    id="scrolling_text"
                    value={config.scrolling_text}
                    onChange={(e) => setConfig({ ...config, scrolling_text: e.target.value })}
                    placeholder="Fast Delivery • Premium Selection"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Product Tabs
                  <Badge variant="secondary">{config.tabs.length}</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTab}
                  disabled={config.tabs.length >= 8}
                  className="ml-auto"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.tabs.map((tab, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={tab.name}
                        onChange={(e) => updateTab(index, 'name', e.target.value)}
                        placeholder="Tab Name"
                        className="text-sm"
                      />
                      <Select
                        value={tab.collection_handle}
                        onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCollections.map((collection) => (
                            <SelectItem key={collection.handle} value={collection.handle}>
                              {collection.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTab(index)}
                      disabled={config.tabs.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} App
                </>
              )}
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={duplicateApp}>
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(`/app/${config.app_slug}`, '_blank')}
            disabled={!config.app_slug}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview App
          </Button>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 bg-muted/20">
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Live Preview</h3>
            <div className="flex items-center gap-2">
              {Object.entries(DEVICE_PREVIEWS).map(([key, device]) => {
                const Icon = device.icon;
                return (
                  <Button
                    key={key}
                    variant={activeDevice === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveDevice(key as keyof typeof DEVICE_PREVIEWS)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">{device.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {renderDevicePreview()}
        </div>
      </div>
    </div>
  );
};