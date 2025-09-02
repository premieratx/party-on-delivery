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
    logo_size?: number;
    headline_size?: number;
    subheadline_size?: number;
    logo_vertical_pos?: number;
    headline_vertical_pos?: number;
    subheadline_vertical_pos?: number;
    background_image_url?: string;
    background_opacity?: number;
    overlay_color?: string;
    headline_font?: string;
    headline_color?: string;
    subheadline_font?: string;
    subheadline_color?: string;
  };
  logo_url?: string;
  collections_config: {
    tab_count: number;
    tabs: DeliveryAppTab[];
  };
  theme: 'original' | 'gold' | 'platinum';
  is_active: boolean;
  is_homepage: boolean;
  prefill_delivery_address?: any;
  prefill_address_enabled?: boolean;
  free_delivery_enabled?: boolean;
}

interface UnifiedDeliveryAppCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DeliveryAppConfig;
  onSaved?: () => void;
}


// 10 Font Options
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)', family: 'Inter, sans-serif' },
  { value: 'Roboto', label: 'Roboto (Clean)', family: 'Roboto, sans-serif' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)', family: 'Open Sans, sans-serif' },
  { value: 'Lato', label: 'Lato (Professional)', family: 'Lato, sans-serif' },
  { value: 'Montserrat', label: 'Montserrat (Geometric)', family: 'Montserrat, sans-serif' },
  { value: 'Poppins', label: 'Poppins (Rounded)', family: 'Poppins, sans-serif' },
  { value: 'Playfair Display', label: 'Playfair (Elegant)', family: 'Playfair Display, serif' },
  { value: 'Merriweather', label: 'Merriweather (Readable)', family: 'Merriweather, serif' },
  { value: 'Source Sans Pro', label: 'Source Sans (Tech)', family: 'Source Sans Pro, sans-serif' },
  { value: 'Nunito', label: 'Nunito (Friendly)', family: 'Nunito, sans-serif' }
];

// Enhanced Preview Component with proper responsive handling + fonts + colors
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
  headlineFont: string;
  headlineColor: string;
  subheadlineFont: string;
  subheadlineColor: string;
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
  headlineFont,
  headlineColor,
  subheadlineFont,
  subheadlineColor,
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
                     height: `${logoSize}px`,
                     maxHeight: `${logoSize}px`
                   }}
                 />
              </div>
            )}
             <h1 
               className="font-bold mb-3 leading-tight"
               style={{ 
                 fontSize: `${headlineSize}px`,
                 transform: `translateY(${headlineVerticalPos}px)`,
                 fontFamily: FONT_OPTIONS.find(f => f.value === headlineFont)?.family || 'Inter, sans-serif',
                 color: headlineColor
               }}
             >
               {heroHeading}
             </h1>
             <p 
               className="mb-4 max-w-xs mx-auto"
               style={{ 
                 fontSize: `${subheadlineSize}px`,
                 transform: `translateY(${subheadlineVerticalPos}px)`,
                 fontFamily: FONT_OPTIONS.find(f => f.value === subheadlineFont)?.family || 'Inter, sans-serif',
                 color: subheadlineColor
               }}
             >
               {heroSubheading}
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
  const [heroHeading, setHeroHeading] = useState(initial?.main_app_config?.hero_heading || 'Premium Delivery Service');
  const [heroSubheading, setHeroSubheading] = useState(initial?.main_app_config?.hero_subheading || 'Fast & Reliable');
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '');
  const [logoSize, setLogoSize] = useState(50);
  const [headlineSize, setHeadlineSize] = useState(24);
  const [subheadlineSize, setSubheadlineSize] = useState(14);
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subheadlineVerticalPos, setSubheadlineVerticalPos] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [overlayColor, setOverlayColor] = useState('#000000');
  // NEW: Font and color controls
  const [headlineFont, setHeadlineFont] = useState('Inter');
  const [headlineColor, setHeadlineColor] = useState('#ffffff');
  const [subheadlineFont, setSubheadlineFont] = useState('Inter');
  const [subheadlineColor, setSubheadlineColor] = useState('#ffffff');
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
  
  // NEW: Delivery settings state
  const [prefillAddressEnabled, setPrefillAddressEnabled] = useState(initial?.prefill_address_enabled ?? false);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(initial?.free_delivery_enabled ?? false);
  const [prefillAddress, setPrefillAddress] = useState({
    street: initial?.prefill_delivery_address?.street || '',
    city: initial?.prefill_delivery_address?.city || '',
    state: initial?.prefill_delivery_address?.state || '',
    zip: initial?.prefill_delivery_address?.zip || '',
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load initial configuration when editing an existing app or when initial data changes
  useEffect(() => {
    console.log('🔄 DeliveryApp useEffect triggered with initial:', initial, 'open:', open);
    if (initial) {
      console.log('📥 Loading existing delivery app configuration...');
      console.log('📊 Initial main_app_config:', initial.main_app_config);
      
      // Load basic app data
      setAppName(initial.app_name || '');
      setAppSlug(initial.app_slug || '');
      setHeroHeading(initial.main_app_config?.hero_heading || '');
      setHeroSubheading(initial.main_app_config?.hero_subheading || '');
      setLogoUrl(initial.logo_url || '');
      setTheme(initial.theme || 'original');
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_homepage ?? false);
      
      // Load styling configuration if it exists
      if (initial.main_app_config) {
        const config = initial.main_app_config;
        
        setLogoSize(config.logo_size ?? 50);
        setHeadlineSize(config.headline_size ?? 24);
        setSubheadlineSize(config.subheadline_size ?? 14);
        setLogoVerticalPos(config.logo_vertical_pos ?? 0);
        setHeadlineVerticalPos(config.headline_vertical_pos ?? 0);
        setSubheadlineVerticalPos(config.subheadline_vertical_pos ?? 0);
        setBackgroundImageUrl(config.background_image_url || '');
        setBackgroundOpacity(config.background_opacity ?? 0.7);
        setOverlayColor(config.overlay_color || '#000000');
        
        setHeadlineFont(config.headline_font || 'Inter');
        setHeadlineColor(config.headline_color || '#ffffff');
        setSubheadlineFont(config.subheadline_font || 'Inter');
        setSubheadlineColor(config.subheadline_color || '#ffffff');
      }
      
      // Load tabs configuration
      if (initial.collections_config?.tabs) {
        console.log('📑 Loading tabs:', initial.collections_config.tabs);
        setTabs(initial.collections_config.tabs);
      }
      
      // Load delivery settings with debug logging
      console.log('🚚 Loading delivery settings from initial:', {
        prefill_address_enabled: initial.prefill_address_enabled,
        free_delivery_enabled: initial.free_delivery_enabled,
        prefill_delivery_address: initial.prefill_delivery_address
      });
      
      setPrefillAddressEnabled(initial.prefill_address_enabled ?? false);
      setFreeDeliveryEnabled(initial.free_delivery_enabled ?? false);
      
      if (initial.prefill_delivery_address) {
        setPrefillAddress({
          street: initial.prefill_delivery_address.street || '',
          city: initial.prefill_delivery_address.city || '',
          state: initial.prefill_delivery_address.state || '',
          zip: initial.prefill_delivery_address.zip || '',
        });
      } else {
        // Reset address when no prefill data
        setPrefillAddress({
          street: '',
          city: '',
          state: '',
          zip: ''
        });
      }
    } else {
      console.log('🆕 No initial data - creating new delivery app');
    }
  }, [initial, open]); // Include 'open' to ensure refresh when dialog opens

  // Monitor open state to load collections
  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    try {
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
        
        setCollections(transformedCollections);
        
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
    if (tabs.length < 15) {
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
      console.log('💾 Saving delivery app with complete config...', { 
        appName, 
        appSlug, 
        heroHeading,
        heroSubheading,
        theme,
        logoSize,
        headlineSize,
        subheadlineSize,
        headlineColor,
        headlineFont,
        subheadlineColor,
        subheadlineFont
      });

      // Convert data to proper JSON format for Supabase with EXPLICIT values
      const appData = {
        app_name: appName,
        app_slug: appSlug,
        logo_url: logoUrl,
        main_app_config: {
          hero_heading: heroHeading.trim(), // SAVE EXACT VALUE - NO FALLBACKS
          hero_subheading: heroSubheading.trim(), // SAVE EXACT VALUE - NO FALLBACKS
          logo_size: Number(logoSize) || 50,
          headline_size: Number(headlineSize) || 24,
          subheadline_size: Number(subheadlineSize) || 14,
          logo_vertical_pos: Number(logoVerticalPos) || 0,
          headline_vertical_pos: Number(headlineVerticalPos) || 0,
          subheadline_vertical_pos: Number(subheadlineVerticalPos) || 0,
          background_image_url: backgroundImageUrl || '',
          background_opacity: Number(backgroundOpacity) || 0.7,
          overlay_color: overlayColor || '#000000',
          // NEW: Save font and color settings explicitly
          headline_font: headlineFont || 'Inter',
          headline_color: headlineColor || '#ffffff',
          subheadline_font: subheadlineFont || 'Inter',
          subheadline_color: subheadlineColor || '#ffffff'
        },
        collections_config: {
          tab_count: tabs.length,
          tabs: tabs.map(tab => ({
            name: tab.name,
            collection_handle: tab.collection_handle,
            icon: tab.icon || '📦'
          }))
        },
        theme: theme,
        is_active: isActive,
        is_homepage: isHomepage,
        // NEW: Add delivery settings
        prefill_address_enabled: prefillAddressEnabled,
        free_delivery_enabled: freeDeliveryEnabled,
        prefill_delivery_address: prefillAddressEnabled ? prefillAddress : null,
        updated_at: new Date().toISOString()
      };

      console.log('📋 Final appData being saved:', JSON.stringify(appData, null, 2));

      let result;
      
      if (initial?.id) {
        // Update existing app
        console.log('🔄 Updating existing app with ID:', initial.id);
        result = await supabase
          .from('delivery_app_variations')
          .update(appData)
          .eq('id', initial.id)
          .select();
      } else {
        // Create new app
        console.log('🆕 Creating new app');
        result = await supabase
          .from('delivery_app_variations')
          .insert({
            ...appData,
            created_at: new Date().toISOString()
          })
          .select();
      }

      if (result.error) {
        console.error('❌ Database error:', result.error);
        throw new Error(result.error.message);
      }

      console.log('✅ App saved successfully:', result.data);

      toast({
        title: "Success!",
        description: `Delivery app ${initial?.id ? 'updated' : 'created'} successfully.`
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('💥 Error saving delivery app:', error);
      toast({
        title: "Error",
        description: `Failed to save delivery app: ${error.message}`,
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

                {/* Text Sizing & Position - FIXED SLIDERS */}
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
                     <div>
                       <Label>Subheadline Size: {subheadlineSize}px</Label>
                       <Slider
                         value={[subheadlineSize]}
                         onValueChange={(value) => setSubheadlineSize(value[0])}
                         max={24}
                         min={12}
                         step={1}
                         className="w-full"
                       />
                     </div>

                     {/* Position Controls */}
                     <div className="space-y-4 pt-4 border-t">
                       <Label className="text-sm font-semibold">Vertical Positioning</Label>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label>Logo Position: {logoVerticalPos}px</Label>
                           <Slider
                             value={[logoVerticalPos]}
                             onValueChange={(value) => setLogoVerticalPos(value[0])}
                             max={50}
                             min={-50}
                             step={5}
                             className="w-full"
                           />
                         </div>
                         <div>
                           <Label>Headline Position: {headlineVerticalPos}px</Label>
                           <Slider
                             value={[headlineVerticalPos]}
                             onValueChange={(value) => setHeadlineVerticalPos(value[0])}
                             max={50}
                             min={-50}
                             step={5}
                             className="w-full"
                           />
                         </div>
                       </div>
                       <div>
                         <Label>Subheadline Position: {subheadlineVerticalPos}px</Label>
                         <Slider
                           value={[subheadlineVerticalPos]}
                           onValueChange={(value) => setSubheadlineVerticalPos(value[0])}
                           max={50}
                           min={-50}
                           step={5}
                           className="w-full"
                         />
                       </div>
                     </div>
                  </CardContent>
                </Card>

                {/* NEW: Font & Color Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Font & Color Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Headline Font & Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Headline Font</Label>
                        <Select value={headlineFont} onValueChange={setHeadlineFont}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Headline Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={headlineColor}
                            onChange={(e) => setHeadlineColor(e.target.value)}
                            className="w-12 h-8 rounded border border-border cursor-pointer"
                          />
                          <Input
                            value={headlineColor}
                            onChange={(e) => setHeadlineColor(e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Subheadline Font & Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Subheadline Font</Label>
                        <Select value={subheadlineFont} onValueChange={setSubheadlineFont}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subheadline Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={subheadlineColor}
                            onChange={(e) => setSubheadlineColor(e.target.value)}
                            className="w-12 h-8 rounded border border-border cursor-pointer"
                          />
                          <Input
                            value={subheadlineColor}
                            onChange={(e) => setSubheadlineColor(e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
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
                        disabled={tabs.length >= 15}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Tab ({tabs.length}/15)
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
                              {collections.length > 0 ? (
                                collections.map((collection, collectionIndex) => (
                                  <SelectItem 
                                    key={`${collection.handle}-${index}-${collectionIndex}`} 
                                    value={collection.handle}
                                    className="bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {collection.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Loading collections... ({collections.length} found)
                                </SelectItem>
                              )}
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

                {/* NEW: Delivery Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Free Delivery Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="free-delivery"
                          checked={freeDeliveryEnabled}
                          onCheckedChange={setFreeDeliveryEnabled}
                        />
                        <Label htmlFor="free-delivery" className="text-sm">
                          Free Delivery (Pre-applied at checkout)
                        </Label>
                      </div>
                    </div>

                    {/* Pre-fill Address Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="prefill-address"
                          checked={prefillAddressEnabled}
                          onCheckedChange={setPrefillAddressEnabled}
                        />
                        <Label htmlFor="prefill-address" className="text-sm">
                          Pre-fill Delivery Address
                        </Label>
                      </div>
                    </div>

                    {/* Address Fields (shown when pre-fill is enabled) */}
                    {prefillAddressEnabled && (
                      <div className="mt-4 space-y-3 p-4 border rounded-lg bg-muted/20">
                        <Label className="text-sm font-medium">Default Delivery Address</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label htmlFor="prefill-street">Street Address</Label>
                            <Input
                              id="prefill-street"
                              value={prefillAddress.street}
                              onChange={(e) => setPrefillAddress({
                                ...prefillAddress,
                                street: e.target.value
                              })}
                              placeholder="123 Main Street"
                            />
                          </div>
                          <div>
                            <Label htmlFor="prefill-city">City</Label>
                            <Input
                              id="prefill-city"
                              value={prefillAddress.city}
                              onChange={(e) => setPrefillAddress({
                                ...prefillAddress,
                                city: e.target.value
                              })}
                              placeholder="Austin"
                            />
                          </div>
                          <div>
                            <Label htmlFor="prefill-state">State</Label>
                            <Input
                              id="prefill-state"
                              value={prefillAddress.state}
                              onChange={(e) => setPrefillAddress({
                                ...prefillAddress,
                                state: e.target.value
                              })}
                              placeholder="TX"
                            />
                          </div>
                          <div>
                            <Label htmlFor="prefill-zip">ZIP Code</Label>
                            <Input
                              id="prefill-zip"
                              value={prefillAddress.zip}
                              onChange={(e) => setPrefillAddress({
                                ...prefillAddress,
                                zip: e.target.value
                              })}
                              placeholder="78701"
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                    headlineFont={headlineFont}
                    headlineColor={headlineColor}
                    subheadlineFont={subheadlineFont}
                    subheadlineColor={subheadlineColor}
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