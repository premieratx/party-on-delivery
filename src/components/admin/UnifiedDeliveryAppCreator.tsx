import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Package,
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

// Enhanced Preview Component with proper proportions and background controls
const DeliveryAppLivePreview: React.FC<{
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  logoSize: number;
  headlineSize: number;
  subheadlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  backgroundImageUrl?: string;
  backgroundOpacity: number;
  overlayColor: string;
  tabs: DeliveryAppTab[];
  theme: 'original' | 'gold' | 'platinum';
  device: 'mobile' | 'tablet' | 'desktop';
}> = ({ 
  appName, 
  heroHeading, 
  heroSubheading, 
  logoUrl, 
  logoSize,
  headlineSize,
  subheadlineSize,
  logoVerticalPos,
  headlineVerticalPos,
  subheadlineVerticalPos,
  backgroundImageUrl,
  backgroundOpacity,
  overlayColor,
  tabs, 
  theme, 
  device 
}) => {
  const getThemeBackground = () => {
    switch (theme) {
      case 'gold':
        return 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)';
      case 'platinum':
        return 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  // Proportions that match Lovable preview window exactly
  const deviceClasses = {
    mobile: 'w-[375px] h-[667px]',
    tablet: 'w-[768px] h-[1024px] scale-75', 
    desktop: 'w-[1200px] h-[800px] scale-50'
  };
  
  return (
    <div className={`${deviceClasses[device]} border rounded-xl overflow-hidden shadow-xl bg-background`}>
      <div className="h-full flex flex-col">
        {/* Hero Section with enhanced background controls */}
        <div 
          className="relative text-white py-12 flex-shrink-0"
          style={{
            background: backgroundImageUrl 
              ? `linear-gradient(rgba(${parseInt(overlayColor.slice(1,3), 16)}, ${parseInt(overlayColor.slice(3,5), 16)}, ${parseInt(overlayColor.slice(5,7), 16)}, ${backgroundOpacity}), rgba(${parseInt(overlayColor.slice(1,3), 16)}, ${parseInt(overlayColor.slice(3,5), 16)}, ${parseInt(overlayColor.slice(5,7), 16)}, ${backgroundOpacity})), url(${backgroundImageUrl})`
              : getThemeBackground(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative container mx-auto px-4 text-center">
            {logoUrl && (
              <div 
                className="flex justify-center mb-6"
                style={{ transform: `translateY(${logoVerticalPos}px)` }}
              >
                <img 
                  src={logoUrl} 
                  alt={appName} 
                  className="object-contain transition-all duration-300" 
                  style={{ 
                    height: `${logoSize}px`,
                    maxHeight: `${logoSize}px`
                  }}
                />
              </div>
            )}
            <h1 
              className="font-bold mb-4 text-white leading-tight"
              style={{ 
                fontSize: `${headlineSize}px`,
                transform: `translateY(${headlineVerticalPos}px)`
              }}
            >
              {heroHeading || appName}
            </h1>
            <p 
              className="text-white/90 mb-6 max-w-2xl mx-auto"
              style={{ 
                fontSize: `${subheadlineSize}px`,
                transform: `translateY(${subheadlineVerticalPos}px)`
              }}
            >
              {heroSubheading || "Satisfaction Guaranteed, On-Time Delivery"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 py-4 flex-1 overflow-y-auto">
          {tabs.length > 0 && (
            <div className="mb-6 border-b pb-4">
              <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                {tabs.map((tab: any, index: number) => (
                  <Button
                    key={tab.collection_handle || index}
                    variant={index === 0 ? "default" : "outline"}
                    className="flex-shrink-0 text-sm px-3 py-2 whitespace-nowrap"
                  >
                    {tab.icon} {tab.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Product Grid Placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-3 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                <h3 className="font-semibold mb-2 text-xs">Product {i}</h3>
                <p className="text-sm font-bold text-primary mb-3">$12.99</p>
                <Button className="w-full text-xs py-1">Add to Cart</Button>
              </div>
            ))}
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
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Size and positioning controls
  const [logoSize, setLogoSize] = useState(64);
  const [headlineSize, setHeadlineSize] = useState(32);
  const [subheadlineSize, setSubheadlineSize] = useState(18);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subheadlineVerticalPos, setSubheadlineVerticalPos] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [overlayColor, setOverlayColor] = useState('#000000');

  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initial?.id;

  // Load Shopify collections using get-all-collections edge function
  const loadShopifyCollections = async () => {
    try {
      setLoadingCollections(true);
      console.log('🔄 Loading Shopify collections...');
      
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) {
        console.error('❌ Error loading collections:', error);
        toast({
          title: "Error Loading Collections",
          description: "Could not load Shopify collections",
          variant: "destructive"
        });
        setShopifyCollections([]);
        return;
      }
      
      if (data?.collections && Array.isArray(data.collections)) {
        const formattedCollections = data.collections
          .filter((collection: any) => collection.products_count > 0)
          .map((collection: any) => ({
            handle: collection.handle,
            title: collection.title || collection.name || collection.handle,
            name: collection.title || collection.name || collection.handle,
            products_count: collection.products_count || collection.product_count || 0
          }))
          .sort((a: any, b: any) => b.products_count - a.products_count);
        
        console.log(`✅ Loaded ${formattedCollections.length} collections with names`);
        setShopifyCollections(formattedCollections);
        
        toast({
          title: "Collections Loaded",
          description: `${formattedCollections.length} collections available`,
        });
      } else {
        console.log('⚠️ No collections returned');
        setShopifyCollections([]);
      }
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      setShopifyCollections([]);
      toast({
        title: "Failed to Load Collections",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  // Initialize form
  useEffect(() => {
    if (!open) return;

    const initializeApp = async () => {
      await loadShopifyCollections();

      if (initial && initial.id) {
        console.log('📝 Loading existing delivery app:', initial);
        setAppName(initial.app_name || '');
        setAppSlug(initial.app_slug || '');
        setHeroHeading(initial.main_app_config?.hero_heading || '');
        setHeroSubheading(initial.main_app_config?.hero_subheading || '');
        setLogoUrl(initial.logo_url || '');
        setTheme(initial.theme || migrateLegacyTheme('gold'));
        
        const savedTabs = initial.collections_config?.tabs || [];
        console.log('🔄 Restoring saved tabs with collections loaded:', savedTabs);
        setTabs(savedTabs);
        
        setIsActive(initial.is_active ?? true);
        setIsHomepage(initial.is_homepage ?? false);
      } else if (!initial) {
        console.log('🆕 Creating new delivery app');
        setAppName('');
        setAppSlug('');
        setHeroHeading('Austin\'s Premier Party Supply Delivery');
        setHeroSubheading('Satisfaction Guaranteed, On-Time Delivery');
        setLogoUrl('');
        setTheme('gold');
        setTabs([
          { name: 'Beer', collection_handle: 'tailgate-beer', icon: '🍺' },
          { name: 'Seltzers', collection_handle: 'seltzer-collection', icon: '🥤' },
          { name: 'Cocktails', collection_handle: 'cocktail-kits', icon: '🍸' },
        ]);
        setIsActive(true);
        setIsHomepage(false);
      }
    };

    initializeApp();
  }, [open, initial?.id]);

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
        app_slug: isEditing ? appSlug.trim() : appSlug.trim(),
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
        console.log('🔄 Updating existing app with ID:', initial.id);
        const { error } = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);
        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        toast({ title: 'App updated successfully!' });
      } else {
        console.log('🆕 Creating new app');
        const { error } = await supabase
          .from('delivery_app_variations')
          .insert(appData);
        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        toast({ title: 'App created successfully!' });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Failed to save delivery app:', error);
      toast({
        title: 'Failed to save app',
        description: error?.message || error?.details || 'Please check the console for details',
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
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a valid image file', variant: 'destructive' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'File size must be less than 5MB', variant: 'destructive' });
      return;
    }
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `delivery-app-logo-${Date.now()}.${ext}`;
      
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

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a valid image file', variant: 'destructive' });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'File size must be less than 10MB', variant: 'destructive' });
      return;
    }
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `delivery-app-bg-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('delivery-app-assets')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: file.type
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('delivery-app-assets').getPublicUrl(fileName);
      setBackgroundImageUrl(data.publicUrl);
      toast({ title: 'Background uploaded successfully!' });
    } catch (error: any) {
      console.error('Background upload failed:', error);
      toast({ title: 'Upload failed', description: error.message || 'Unknown error occurred', variant: 'destructive' });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm" />
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden !z-[100] bg-background border-0" aria-describedby="dialog-description">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? `Edit: ${initial?.app_name}` : 'Create Delivery App'}
                  </h2>
                  <DialogDescription id="dialog-description" className="text-sm text-muted-foreground font-normal">
                    Consolidated editor with live preview
                  </DialogDescription>
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

          {/* Consolidated Single-Tab Interface */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Left Panel - All Controls with Proper Scrolling */}
              <div className="w-80 border-r bg-muted/20 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                  <h3 className="text-lg font-semibold">Delivery App Creator</h3>
                  
                  {/* Device Selector */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Preview Device</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={previewDevice === 'mobile' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs">Mobile</span>
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <Tablet className="w-4 h-4" />
                        <span className="text-xs">Tablet</span>
                      </Button>
                      <Button
                        variant={previewDevice === 'desktop' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs">Desktop</span>
                      </Button>
                    </div>
                  </div>

                  {/* App Details */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">App Details</h4>
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

                  {/* Hero Content */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Hero Content</h4>
                    <div>
                      <Label htmlFor="hero-heading">Headline</Label>
                      <Input
                        id="hero-heading"
                        value={heroHeading}
                        onChange={(e) => setHeroHeading(e.target.value)}
                        placeholder="Austin's Premier Party Supply Delivery"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero-subheading">Subheadline</Label>
                      <Input
                        id="hero-subheading"
                        value={heroSubheading}
                        onChange={(e) => setHeroSubheading(e.target.value)}
                        placeholder="Satisfaction Guaranteed, On-Time Delivery"
                      />
                    </div>
                  </div>

                  {/* Background Image with Overlay Controls */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Background Image</h4>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('background-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {backgroundImageUrl ? 'Change Background' : 'Upload Background'}
                    </Button>
                    {backgroundImageUrl && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Background Opacity: {Math.round(backgroundOpacity * 100)}%</Label>
                          <Slider
                            value={[backgroundOpacity]}
                            onValueChange={(value) => setBackgroundOpacity(value[0])}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Overlay Color</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="color"
                              value={overlayColor}
                              onChange={(e) => setOverlayColor(e.target.value)}
                              className="w-12 h-8 p-0 border rounded"
                            />
                            <Input
                              value={overlayColor}
                              onChange={(e) => setOverlayColor(e.target.value)}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Logo Controls */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Logo</h4>
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {logoUrl && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Logo Size: {logoSize}px</Label>
                          <Slider
                            value={[logoSize]}
                            onValueChange={(value) => setLogoSize(value[0])}
                            min={40}
                            max={200}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Logo Position: {logoVerticalPos}px</Label>
                          <Slider
                            value={[logoVerticalPos]}
                            onValueChange={(value) => setLogoVerticalPos(value[0])}
                            min={-100}
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Text Sizing & Positioning */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Text Sizing & Position</h4>
                    <div>
                      <Label className="text-sm font-medium">Headline Size: {headlineSize}px</Label>
                      <Slider
                        value={[headlineSize]}
                        onValueChange={(value) => setHeadlineSize(value[0])}
                        min={20}
                        max={80}
                        step={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subheadline Size: {subheadlineSize}px</Label>
                      <Slider
                        value={[subheadlineSize]}
                        onValueChange={(value) => setSubheadlineSize(value[0])}
                        min={12}
                        max={32}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Headline Position: {headlineVerticalPos}px</Label>
                      <Slider
                        value={[headlineVerticalPos]}
                        onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                        min={-100}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subheadline Position: {subheadlineVerticalPos}px</Label>
                      <Slider
                        value={[subheadlineVerticalPos]}
                        onValueChange={(value) => setSubheadlineVerticalPos(value[0])}
                        min={-100}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Theme</h4>
                    <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original Blue</SelectItem>
                        <SelectItem value="gold">Luxury Gold</SelectItem>
                        <SelectItem value="platinum">Modern Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tabs & Collections */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">Tabs & Collections</h4>
                      <Button onClick={addTab} size="sm" disabled={tabs.length >= 8}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {tabs.map((tab, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div>
                          <Label className="text-xs">Tab Name</Label>
                          <Input
                            value={tab.name}
                            onChange={(e) => updateTab(index, { name: e.target.value })}
                            placeholder="Tab Name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Collection</Label>
                          <Select 
                            value={tab.collection_handle || ''} 
                            onValueChange={(value) => updateTab(index, { collection_handle: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder={loadingCollections ? "Loading..." : "Select collection"} />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {loadingCollections ? (
                                <SelectItem value="" disabled>Loading collections...</SelectItem>
                              ) : shopifyCollections.length === 0 ? (
                                <SelectItem value="" disabled>No collections available</SelectItem>
                              ) : (
                                shopifyCollections.map((collection, collectionIndex) => (
                                  <SelectItem 
                                    key={`${collection.handle || collectionIndex}`} 
                                    value={collection.handle || `collection-${collectionIndex}`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span>{collection.title || collection.name || collection.handle}</span>
                                      <span className="text-muted-foreground text-xs">({collection.products_count || 0})</span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Select 
                            value={tab.icon || '📦'} 
                            onValueChange={(value) => updateTab(index, { icon: value })}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className="text-lg">{option.value}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeTab(index)}
                            disabled={tabs.length <= 1}
                            className="px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* App Settings */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">Settings</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-active"
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="is-active" className="text-sm">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-homepage"
                          checked={isHomepage}
                          onCheckedChange={setIsHomepage}
                        />
                        <Label htmlFor="is-homepage" className="text-sm">Homepage</Label>
                      </div>
                    </div>
                  </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Right Panel - Live Preview with Fixed Positioning */}
              <div className="flex-1 flex justify-center items-start bg-muted/10 p-6 overflow-auto">
                <div className="flex justify-center">
                  <DeliveryAppLivePreview
                    appName={appName}
                    heroHeading={heroHeading}
                    heroSubheading={heroSubheading}
                    logoUrl={logoUrl}
                    logoSize={logoSize}
                    headlineSize={headlineSize}
                    subheadlineSize={subheadlineSize}
                    logoVerticalPos={logoVerticalPos}
                    headlineVerticalPos={headlineVerticalPos}
                    subheadlineVerticalPos={subheadlineVerticalPos}
                    backgroundImageUrl={backgroundImageUrl}
                    backgroundOpacity={backgroundOpacity}
                    overlayColor={overlayColor}
                    tabs={tabs}
                    theme={theme}
                    device={previewDevice}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <input
            id="background-upload"
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};