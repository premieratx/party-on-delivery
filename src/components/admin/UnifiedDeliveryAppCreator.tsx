import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from "@/components/ui/slider";
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
import { UNIFIED_THEMES, getThemeCSS } from '@/lib/themeSystem';

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


// Enhanced Preview Component with proper responsive handling
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

  // Fixed dimensions that are properly sized for preview
  const previewDimensions = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 900 }, 
    desktop: { width: 1200, height: 700 }
  };
  
  const currentDimensions = previewDimensions[device];
  const scaleFactor = device === 'tablet' ? 0.6 : device === 'desktop' ? 0.4 : 0.8;
  
  return (
    <div 
      className="border rounded-xl overflow-hidden shadow-xl bg-background mx-auto"
      style={{ 
        width: `${currentDimensions.width * scaleFactor}px`, 
        height: `${currentDimensions.height * scaleFactor}px`
      }}
    >
      <div className="h-full flex flex-col">
        {/* Hero Section */}
        <div 
          className="relative text-white py-8 flex-shrink-0"
          style={{
            background: backgroundImageUrl 
              ? `linear-gradient(rgba(${parseInt(overlayColor.slice(1,3), 16)}, ${parseInt(overlayColor.slice(3,5), 16)}, ${parseInt(overlayColor.slice(5,7), 16)}, ${backgroundOpacity}), rgba(${parseInt(overlayColor.slice(1,3), 16)}, ${parseInt(overlayColor.slice(3,5), 16)}, ${parseInt(overlayColor.slice(5,7), 16)}, ${backgroundOpacity})), url(${backgroundImageUrl})`
              : getThemeBackground(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative px-4 text-center">
            {logoUrl && (
              <div 
                className="flex justify-center mb-4"
                style={{ transform: `translateY(${logoVerticalPos}px)` }}
              >
                <img 
                  src={logoUrl} 
                  alt={appName} 
                  className="object-contain transition-all duration-300" 
                  style={{ 
                    height: `${Math.min(logoSize, 60)}px`,
                    maxHeight: `${Math.min(logoSize, 60)}px`
                  }}
                />
              </div>
            )}
            <h1 
              className="font-bold mb-3 text-white leading-tight"
              style={{ 
                fontSize: `${Math.min(headlineSize, 24)}px`,
                transform: `translateY(${headlineVerticalPos}px)`
              }}
            >
              {heroHeading || appName}
            </h1>
            <p 
              className="text-white/90 mb-4 max-w-xs mx-auto"
              style={{ 
                fontSize: `${Math.min(subheadlineSize, 14)}px`,
                transform: `translateY(${subheadlineVerticalPos}px)`
              }}
            >
              {heroSubheading || "Satisfaction Guaranteed, On-Time Delivery"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          {tabs.length > 0 && (
            <div className="mb-4 border-b pb-3">
              <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                {tabs.map((tab: any, index: number) => (
                  <Button
                    key={tab.collection_handle || index}
                    variant={index === 0 ? "default" : "outline"}
                    className="flex-shrink-0 text-xs px-2 py-1 whitespace-nowrap h-7"
                  >
                    {tab.icon} {tab.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Product Grid Placeholder */}
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-2 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-2"></div>
                <h3 className="font-semibold mb-1 text-xs">Product {i}</h3>
                <p className="text-xs font-bold text-primary mb-2">$12.99</p>
                <Button className="w-full text-xs py-1 h-6">Add</Button>
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
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState(initial?.app_name || '');
  const [appSlug, setAppSlug] = useState(initial?.app_slug || '');
  const [heroHeading, setHeroHeading] = useState(initial?.main_app_config?.hero_heading || '');
  const [heroSubheading, setHeroSubheading] = useState(initial?.main_app_config?.hero_subheading || '');
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '');
  const [logoSize, setLogoSize] = useState(80);
  const [headlineSize, setHeadlineSize] = useState(32);
  const [subheadlineSize, setSubheadlineSize] = useState(18);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subheadlineVerticalPos, setSubheadlineVerticalPos] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [tabs, setTabs] = useState<DeliveryAppTab[]>(initial?.collections_config?.tabs || [
    { name: 'Beer', collection_handle: '', icon: '🍺' },
    { name: 'Seltzers', collection_handle: '', icon: '🥤' },
    { name: 'Cocktails', collection_handle: '', icon: '🍸' }
  ]);
  const [collections, setCollections] = useState<any[]>([]);
  const [theme, setTheme] = useState<'original' | 'gold' | 'platinum'>(initial?.theme || 'original');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isHomepage, setIsHomepage] = useState(initial?.is_homepage ?? false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      console.log('🚪 Dialog opened, loading collections...');
      loadCollections();
    } else {
      console.log('🚪 Dialog closed');
    }
  }, [open]);

  // Debug effect to monitor collections state
  useEffect(() => {
    console.log('📊 Collections state changed:', collections.length);
    if (collections.length > 0) {
      console.log('📋 Current collections:', collections.slice(0, 5).map(c => ({ handle: c.handle, name: c.name })));
    }
  }, [collections]);

  const loadCollections = async () => {
    try {
      console.log('🔄 Loading real Shopify collections...');
      setCollections([]); // Clear existing collections while loading
      
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: {}
      });

      if (error) {
        console.error('❌ Error loading collections:', error);
        toast({
          title: "Failed to load collections",
          description: "Could not load Shopify collections. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data && data.collections && Array.isArray(data.collections)) {
        console.log('✅ Loaded real collections:', data.collections.length);
        console.log('📋 First 3 real collections:', data.collections.slice(0, 3));
        console.log('🔍 Raw collection data structure:', data.collections[0]);
        
        // Transform and filter collections - only include ones with valid handles
        const transformedCollections = data.collections
          .filter((collection: any) => {
            const isValid = collection.handle && collection.title;
            if (!isValid) {
              console.log('❌ Filtering out invalid collection:', collection);
            }
            return isValid;
          })
          .map((collection: any) => {
            const transformed = {
              id: collection.id || collection.handle,
              handle: collection.handle,
              name: `${collection.title} (${collection.products_count || 0} products)`,
              title: collection.title,
              products_count: collection.products_count || 0
            };
            return transformed;
          });
        
        console.log('🔄 Setting transformed collections:', transformedCollections.length);
        console.log('🔍 First 3 transformed collections:', transformedCollections.slice(0, 3));
        console.log('📊 Collection handles available:', transformedCollections.map(c => c.handle).slice(0, 10));
        
        setCollections(transformedCollections);
        
        // Force component re-render
        setTimeout(() => {
          console.log('🔄 Collections in state should be:', transformedCollections.length);
        }, 200);
        
      } else {
        console.warn('⚠️ No collections data received or invalid format:', data);
        setCollections([]);
      }
    } catch (error) {
      console.error('💥 Failed to load collections:', error);
      toast({
        title: "Error loading collections",
        description: "Failed to connect to Shopify. Please check your connection.",
        variant: "destructive"
      });
      setCollections([]);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🔄 Starting logo upload for file:', file.name, 'Size:', file.size);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      console.log('📂 Uploading to app-assets bucket with filename:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload successful, getting public URL...');

      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', urlData.publicUrl);
      setLogoUrl(urlData.publicUrl);
      
      toast({
        title: "Logo uploaded successfully",
        description: "Your logo has been updated in the preview."
      });
    } catch (error) {
      console.error('💥 Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload logo. Error: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `background-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      setBackgroundImageUrl(urlData.publicUrl);
      
      toast({
        title: "Background uploaded successfully",
        description: "Your background has been updated in the preview."
      });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload background. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addTab = () => {
    if (tabs.length < 6) {
      setTabs([...tabs, { name: 'New Tab', collection_handle: '', icon: '📦' }]);
    }
  };

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      setTabs(tabs.filter((_, i) => i !== index));
    }
  };

  const updateTab = (index: number, field: keyof DeliveryAppTab, value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setTabs(newTabs);
  };

  const handleSave = async () => {
    if (!appName || !appSlug) {
      toast({
        title: "Validation Error",
        description: "App name and slug are required.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Saving delivery app...', { appName, appSlug, theme });

      // Convert data to proper JSON format for Supabase
      const appData = {
        app_name: appName,
        app_slug: appSlug,
        logo_url: logoUrl,
        main_app_config: JSON.parse(JSON.stringify({
          hero_heading: heroHeading,
          hero_subheading: heroSubheading,
          logo_size: logoSize,
          headline_size: headlineSize,
          subheadline_size: subheadlineSize,
          logo_vertical_pos: logoVerticalPos,
          headline_vertical_pos: headlineVerticalPos,
          subheadline_vertical_pos: subheadlineVerticalPos,
          background_image_url: backgroundImageUrl,
          background_opacity: backgroundOpacity,
          overlay_color: overlayColor
        })),
        collections_config: JSON.parse(JSON.stringify({
          tab_count: tabs.length,
          tabs: tabs.map(tab => ({
            name: tab.name,
            collection_handle: tab.collection_handle,
            icon: tab.icon || '📦'
          }))
        })),
        theme: theme,
        is_active: isActive,
        is_homepage: isHomepage,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (initial?.id) {
        // Update existing app
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id);
      } else {
        // Create new app
        result = await supabase
          .from('delivery_app_variations')
          .insert({
            ...appData,
            created_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ App saved successfully');
      
      toast({
        title: "App saved successfully",
        description: initial?.id ? "Your delivery app has been updated." : "Your delivery app has been created."
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('💥 Error saving app:', error);
      toast({
        title: "Save failed",
        description: `Failed to save delivery app: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl w-full p-0 max-h-[90vh] overflow-hidden"
        aria-describedby="dialog-description"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {initial ? 'Edit Delivery App' : 'Create Delivery App'}
                </DialogTitle>
                <DialogDescription id="dialog-description" className="text-sm text-muted-foreground mt-1">
                  Build and customize your delivery app with live preview. Configure collections, themes, and branding.
                </DialogDescription>
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
            </div>
          </DialogHeader>

        {/* Main Content - Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0 h-full min-h-[600px]">
            {/* Left Panel - Configuration */}
            <div className="border-r bg-muted/20">
              <div className="p-6 space-y-6">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">App Details</CardTitle>
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
                  </CardContent>
                </Card>

                {/* Hero Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hero Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={heroHeading}
                        onChange={(e) => setHeroHeading(e.target.value)}
                        placeholder="Austin's Premier Party"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subheadline">Subheadline</Label>
                      <Input
                        id="subheadline"
                        value={heroSubheading}
                        onChange={(e) => setHeroSubheading(e.target.value)}
                        placeholder="Satisfaction Guaranteed"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Branding */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Logo Upload</Label>
                        <Button
                          variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                      <div>
                        <Label>Background Image</Label>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('background-upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Background
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Sizing & Position */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text Sizing & Position</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Logo Size: {logoSize}px</Label>
                        <Slider
                          value={[logoSize]}
                          onValueChange={(value) => setLogoSize(value[0])}
                          max={120}
                          min={40}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label>Headline Size: {headlineSize}px</Label>
                        <Slider
                          value={[headlineSize]}
                          onValueChange={(value) => setHeadlineSize(value[0])}
                          max={48}
                          min={16}
                          step={2}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Theme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={theme} onValueChange={(value: 'original' | 'gold' | 'platinum') => setTheme(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original (Purple)</SelectItem>
                        <SelectItem value="gold">Gold (Dark)</SelectItem>
                        <SelectItem value="platinum">Platinum (Blue)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Collections/Tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Collections & Tabs
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addTab}
                        disabled={tabs.length >= 6}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Tab
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tabs.map((tab, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Tab Name"
                            value={tab.name}
                            onChange={(e) => updateTab(index, 'name', e.target.value)}
                          />
                          <Select
                            key={`collection-${index}-${collections.length}`}
                            value={tab.collection_handle}
                            onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={collections.length > 0 ? "Select Collection" : "Loading collections..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto bg-background border border-border shadow-lg z-50">
                              {(() => {
                                console.log(`🎯 Tab ${index} dropdown rendering:`, collections.length, 'collections');
                                if (collections.length > 0) {
                                  console.log(`🎯 First 3 collections for dropdown:`, collections.slice(0, 3).map(c => ({ handle: c.handle, name: c.name })));
                                }
                                return collections.length > 0 ? (
                                  collections.map((collection, collectionIndex) => {
                                    if (collectionIndex < 5) { // Log first 5 for debugging
                                      console.log(`🎯 Rendering SelectItem ${collectionIndex}:`, collection.handle, collection.name);
                                    }
                                    return (
                                      <SelectItem 
                                        key={`${collection.handle}-${index}-${collectionIndex}`} 
                                        value={collection.handle}
                                        className="bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      >
                                        {collection.name}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Loading collections... ({collections.length} found)
                                  </SelectItem>
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                        {tabs.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTab(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Status Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="bg-muted/10">
              <div className="p-6">
                <h4 className="text-lg font-semibold mb-4">Live Preview</h4>
                <div className="flex items-center justify-center">
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