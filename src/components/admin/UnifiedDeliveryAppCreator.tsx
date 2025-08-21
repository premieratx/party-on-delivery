import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from "@/components/ui/slider";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Eye,
  Package,
  Settings,
  Palette,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UNIFIED_THEMES, getThemeCSS, migrateLegacyTheme } from '@/lib/themeSystem';

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
  theme: 'original' | 'gold' | 'platinum';
  is_active: boolean;
  is_homepage: boolean;
}

interface UnifiedDeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig;
  onSaved?: () => void;
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
  { value: '🍿', label: '🍿 Snacks' }
];

// Pixel-Perfect Preview Component
const DeliveryAppPreview: React.FC<{
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  tabs: DeliveryAppTab[];
  theme: 'original' | 'gold' | 'platinum';
  device: 'mobile' | 'tablet' | 'desktop';
}> = ({ appName, heroHeading, heroSubheading, logoUrl, tabs, theme, device }) => {
  const themeConfig = UNIFIED_THEMES[theme];
  const cssVars = getThemeCSS(themeConfig);
  
  const deviceClasses = {
    mobile: 'w-[375px] h-[667px]',
    tablet: 'w-[768px] h-[1024px]',
    desktop: 'w-[1200px] h-[800px]'
  };
  
  return (
    <div 
      className={`${deviceClasses[device]} border rounded-xl overflow-hidden bg-gradient-to-br shadow-xl`}
      style={cssVars as React.CSSProperties}
    >
      <div 
        className="h-full flex flex-col"
        style={{ 
          background: themeConfig.colors.gradient,
          color: themeConfig.colors.text
        }}
      >
        {/* Header */}
        <header className="p-4 backdrop-blur-sm border-b" style={{ backgroundColor: `${themeConfig.colors.overlay}` }}>
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{appName}</h1>
            <button className="px-3 py-1 rounded text-sm" style={{ backgroundColor: themeConfig.colors.secondary }}>
              Admin
            </button>
          </div>
        </header>
        
        {/* Hero Section */}
        <div className="flex-1 p-6 text-center">
          <div className="max-w-md mx-auto space-y-6">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-16 w-auto mx-auto" />
            )}
            <h2 className="text-3xl font-bold" style={{ fontFamily: themeConfig.fonts.heading }}>
              {heroHeading || 'Austin\'s Premier Party Supply Delivery'}
            </h2>
            <p className="text-lg opacity-90">
              {heroSubheading || 'Satisfaction Guaranteed, On-Time Delivery'}
            </p>
            
            {/* Category Tabs Preview */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {tabs.slice(0, 6).map((tab, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl text-center cursor-pointer transform hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: themeConfig.colors.cardBackground,
                    border: `1px solid ${themeConfig.colors.border}`,
                    boxShadow: themeConfig.shadows.card
                  }}
                >
                  <div className="text-2xl mb-2">{tab.icon || '📦'}</div>
                  <h3 className="font-medium text-sm">{tab.name}</h3>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <button 
              className="px-8 py-3 rounded-xl font-semibold text-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: themeConfig.colors.primary,
                color: themeConfig.colors.background,
                boxShadow: themeConfig.shadows.button
              }}
            >
              Start Your Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnifiedDeliveryAppCreator: React.FC<UnifiedDeliveryAppCreatorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  // Form state
  const [appName, setAppName] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState<'original' | 'gold' | 'platinum'>('gold');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopifyCollections, setShopifyCollections] = useState<any[]>([]);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(64);
  const [headlineSize, setHeadlineSize] = useState(24);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subheadlineVerticalPos, setSubheadlineVerticalPos] = useState(0);
  const [tabsVerticalPos, setTabsVerticalPos] = useState(0);
  const [buttonsVerticalPos, setButtonsVerticalPos] = useState(0);

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initial?.id;

  // Load homepage template for defaults
  const [homepageTemplate, setHomepageTemplate] = useState<any>(null);

  const loadHomepageTemplate = async () => {
    try {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_homepage', true)
        .single();
      setHomepageTemplate(data);
    } catch (error) {
      console.error('Error loading homepage template:', error);
    }
  };

  // Load Shopify collections
  const loadShopifyCollections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      if (error) throw error;
      
      if (data?.collections && Array.isArray(data.collections)) {
        const collections = data.collections
          .filter((collection: any) => collection.products_count > 0)
          .map((collection: any) => ({
            handle: collection.handle,
            name: collection.title || collection.handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            products_count: collection.products_count
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setShopifyCollections(collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      // Fallback collections
      setShopifyCollections([
        { handle: 'spirits', name: 'Spirits', products_count: 100 },
        { handle: 'tailgate-beer', name: 'Tailgate Beer', products_count: 62 },
        { handle: 'cocktail-kits', name: 'Cocktail Kits', products_count: 40 }
      ]);
    }
  };

  // Initialize form
  useEffect(() => {
    if (!open) return;

    loadShopifyCollections();
    loadHomepageTemplate();

    if (initial) {
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      setLogoUrl(initial.logo_url || '');
      setTheme(initial.theme || migrateLegacyTheme('gold'));
      setTabs(initial.collections_config?.tabs || []);
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_homepage ?? false);
    } else {
      // Reset for new app - use homepage template as default
      setAppName('');
      setAppSlug('');
      setHeroHeading(homepageTemplate?.main_app_config?.hero_heading || 'Austin\'s Premier Party Supply Delivery');
      setHeroSubheading(homepageTemplate?.main_app_config?.hero_subheading || 'Satisfaction Guaranteed, On-Time Delivery');
      setLogoUrl('');
      setTheme('gold');
      setTabs(homepageTemplate?.collections_config?.tabs || [
        { name: 'Beer', collection_handle: 'tailgate-beer', icon: '🍺' },
        { name: 'Seltzers', collection_handle: 'seltzer-collection', icon: '🥤' },
        { name: 'Cocktails', collection_handle: 'cocktail-kits', icon: '🍸' },
        { name: 'Mixers & N/A', collection_handle: 'mixers-non-alcoholic', icon: '🧊' },
        { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
      ]);
      setIsActive(true);
      setIsHomepage(false);
    }
  }, [open, initial, homepageTemplate]);

  // Auto-generate slug
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
    console.log('💾 Saving delivery app...', { appName, appSlug, theme });
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
        theme: theme,
        is_active: isActive,
        is_homepage: isHomepage
      };

      console.log('💾 Saving delivery app data:', appData);

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
      console.error('❌ Save error:', error);
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
    console.log('Adding delivery app tab...');
    if (tabs.length < 8) {
      setTabs([...tabs, { name: 'New Tab', collection_handle: 'new-collection', icon: '📦' }]);
    }
  };

  const removeTab = (index: number) => {
    console.log(`Removing tab ${index}`);
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
  };

  const updateTab = (index: number, updates: Partial<DeliveryAppTab>) => {
    console.log(`Updating tab ${index}:`, updates);
    const updated = [...tabs];
    updated[index] = { ...updated[index], ...updates };
    setTabs(updated);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a valid image file (JPG, PNG, GIF, or WebP)', variant: 'destructive' });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'File size must be less than 5MB', variant: 'destructive' });
      return;
    }
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `delivery-app-logo-${Date.now()}.${ext}`;
      
      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'delivery-app-assets')) {
        await supabase.storage.createBucket('delivery-app-assets', { public: true });
      }
      
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-assets')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: file.type
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast({ title: 'Logo uploaded successfully!' });
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: error.message || 'Unknown error occurred', variant: 'destructive' });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    Content-only editing with cohesive theming
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !appName || !appSlug}
                size="sm"
                className="min-w-[100px]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save App'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="flex-1 overflow-y-auto p-6">
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
                        <Button
                          variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full mt-2"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        {logoUrl && (
                          <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded border p-2 mt-3" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                          />
                          <Label htmlFor="is-active">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-homepage"
                            checked={isHomepage}
                            onCheckedChange={setIsHomepage}
                          />
                          <Label htmlFor="is-homepage">Homepage</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs & Collections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Tabs & Collections
                        <Button onClick={addTab} size="sm" disabled={tabs.length >= 8}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tab
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tabs.map((tab, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid grid-cols-4 gap-4 mb-4">
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
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                  {shopifyCollections.map((collection) => (
                                    <SelectItem key={collection.handle} value={collection.handle}>
                                      {collection.name} ({collection.products_count})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Icon</Label>
                              <Select 
                                value={tab.icon || '📦'} 
                                onValueChange={(value) => updateTab(index, { icon: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              <SelectContent className="z-[9999]">
                                {ICON_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => removeTab(index)}
                                disabled={tabs.length <= 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Size Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Size Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo Size: {logoSize}px</Label>
                        <Slider
                          value={[logoSize]}
                          onValueChange={(value) => setLogoSize(value[0])}
                          min={32}
                          max={120}
                          step={4}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Headline Size: {headlineSize}px</Label>
                        <Slider
                          value={[headlineSize]}
                          onValueChange={(value) => setHeadlineSize(value[0])}
                          min={16}
                          max={48}
                          step={2}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Positioning Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Vertical Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo Position: {logoVerticalPos}rem</Label>
                        <Slider
                          value={[logoVerticalPos]}
                          onValueChange={(value) => setLogoVerticalPos(value[0])}
                          min={-3}
                          max={3}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Headline Position: {headlineVerticalPos}rem</Label>
                        <Slider
                          value={[headlineVerticalPos]}
                          onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                          min={-3}
                          max={3}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Subheadline Position: {subheadlineVerticalPos}rem</Label>
                        <Slider
                          value={[subheadlineVerticalPos]}
                          onValueChange={(value) => setSubheadlineVerticalPos(value[0])}
                          min={-3}
                          max={3}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tabs Position: {tabsVerticalPos}rem</Label>
                        <Slider
                          value={[tabsVerticalPos]}
                          onValueChange={(value) => setTabsVerticalPos(value[0])}
                          min={-3}
                          max={3}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Buttons Position: {buttonsVerticalPos}rem</Label>
                        <Slider
                          value={[buttonsVerticalPos]}
                          onValueChange={(value) => setButtonsVerticalPos(value[0])}
                          min={-3}
                          max={3}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="theme" className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.values(UNIFIED_THEMES).map((themeConfig) => (
                          <div 
                            key={themeConfig.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              theme === themeConfig.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setTheme(themeConfig.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{themeConfig.name}</h3>
                              <Badge variant={theme === themeConfig.id ? 'default' : 'secondary'}>
                                {theme === themeConfig.id ? 'Selected' : 'Select'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {themeConfig.description}
                            </p>
                            <div className="flex gap-2">
                              {Object.entries(themeConfig.colors).slice(0, 5).map(([name, color]) => (
                                <div
                                  key={name}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={name}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden p-6">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Preview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-muted/10 rounded-lg">
                    <DeliveryAppPreview
                      appName={appName || 'My Delivery App'}
                      heroHeading={heroHeading}
                      heroSubheading={heroSubheading}
                      logoUrl={logoUrl}
                      tabs={tabs}
                      theme={theme}
                      device={previewDevice}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <input
          type="file"
          ref={logoInputRef}
          onChange={handleLogoUpload}
          accept="image/*"
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};