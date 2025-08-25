import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Tablet,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UNIFIED_THEMES, getThemeCSS, migrateLegacyTheme } from '@/lib/themeSystem';
import { DeliveryAppLiveEditor } from './DeliveryAppLiveEditor';

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

// Real-time Preview Component - Exact Replica of DirectDeliveryApp
const DeliveryAppLivePreview: React.FC<{
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  logoSize: number;
  headlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  backgroundImageUrl?: string;
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
  logoVerticalPos,
  headlineVerticalPos,
  subheadlineVerticalPos,
  backgroundImageUrl,
  tabs, 
  theme, 
  device 
}) => {
  const themeConfig = UNIFIED_THEMES[theme];
  
  const deviceClasses = {
    mobile: 'w-[375px] h-[667px]',
    tablet: 'w-[768px] h-[1024px]',
    desktop: 'w-[1200px] h-[800px]'
  };
  
  return (
    <div className={`${deviceClasses[device]} border rounded-xl overflow-hidden shadow-xl`}>
      <div className="h-full flex flex-col bg-background">
        {/* EXACT REPLICA: Hero Section like DirectDeliveryApp */}
        <div 
          className="relative bg-gradient-to-r from-primary to-secondary text-white py-12"
          style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {backgroundImageUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative container mx-auto px-4 text-center">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={appName} 
                className="mx-auto mb-6 object-contain" 
                style={{ 
                  height: `${logoSize}px`,
                  transform: `translateY(${logoVerticalPos}px)`
                }}
              />
            )}
            <h1 
              className="font-bold mb-4 text-white"
              style={{ 
                fontSize: `${headlineSize}px`,
                transform: `translateY(${headlineVerticalPos}px)`
              }}
            >
              {heroHeading || appName}
            </h1>
            <p 
              className="text-blue-100 mb-6"
              style={{ 
                fontSize: `${Math.max(14, headlineSize * 0.6)}px`,
                transform: `translateY(${subheadlineVerticalPos}px)`
              }}
            >
              {heroSubheading || "Satisfaction Guaranteed, On-Time Delivery"}
            </p>
            
            {/* Cart Button */}
            <Button className="bg-white text-primary hover:bg-white/90" size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart (0)
            </Button>
          </div>
        </div>

        {/* EXACT REPLICA: Tab Navigation */}
        <div className="container mx-auto px-4 py-8 flex-1">
          {tabs.length > 0 && (
            <div className="mb-8 border-b pb-4">
              <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                {tabs.map((tab: any, index: number) => (
                  <Button
                    key={tab.collection_handle || index}
                    variant={index === 0 ? "default" : "outline"}
                    className="flex-shrink-0 text-sm px-4 py-2 whitespace-nowrap"
                  >
                    {tab.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* EXACT REPLICA: Product Grid Placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                <h3 className="font-semibold mb-2 text-sm">Sample Product {i}</h3>
                <p className="text-lg font-bold text-primary mb-4">$12.99</p>
                <Button className="w-full text-sm">Add to Cart</Button>
              </div>
            ))}
          </div>
        </div>

        {/* EXACT REPLICA: Fixed Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
            Admin
          </Button>
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
  const [logoVerticalPos, setLogoVerticalPos] = useState(0);
  const [headlineVerticalPos, setHeadlineVerticalPos] = useState(0);
  const [subheadlineVerticalPos, setSubheadlineVerticalPos] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');

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

  // Load Shopify collections - FIXED TO LOAD ALL 50+ COLLECTIONS
  const loadShopifyCollections = async () => {
    try {
      setLoadingCollections(true);
      console.log('🔍 Loading ALL collections for delivery app creator...');
      console.log('📊 Current collections state:', shopifyCollections);
      
      // Use the fixed get-all-collections edge function
      const { data, error } = await supabase.functions.invoke('get-all-collections');
      
      console.log('📊 Edge function response:', { data, error });
      
      if (!error && data?.success && data?.collections && Array.isArray(data.collections)) {
        const collections = data.collections
          .filter((collection: any) => collection.products_count > 0)
          .map((collection: any) => ({
            handle: collection.handle,
            title: collection.title || collection.name || collection.handle,
            name: collection.title || collection.name || collection.handle,
            products_count: collection.products_count || 0
          }))
          .sort((a: any, b: any) => b.products_count - a.products_count); // Sort by product count
        
        console.log(`✅ Loaded ${collections.length} collections from edge function`);
        console.log('📋 Sample collections with proper titles:', collections.slice(0, 5));
        setShopifyCollections(collections);
        return;
      }
      
      console.log('📝 Edge function failed, trying unified products...');
      
      // Fallback to unified products function
      const { data: unifiedData, error: unifiedError } = await supabase.functions.invoke('get-unified-products', {
        body: { 
          use_type: 'delivery',
          lightweight: true 
        }
      });

      if (!unifiedError && unifiedData?.collections && Array.isArray(unifiedData.collections)) {
        const collections = unifiedData.collections
          .filter((collection: any) => collection.products && collection.products.length > 0)
          .map((collection: any) => ({
            handle: collection.handle,
            title: collection.title || collection.name || collection.handle,
            name: collection.title || collection.name || collection.handle,
            products_count: collection.products?.length || 0
          }))
          .sort((a: any, b: any) => b.products_count - a.products_count);
        
        console.log(`✅ Loaded ${collections.length} collections from unified products with titles:`, collections.slice(0, 3));
        setShopifyCollections(collections);
        return;
      }

      console.log('📝 All edge functions failed, using comprehensive fallback...');
      
      // Comprehensive fallback with all 53 real collections from edge function logs
      const fallbackCollections = [
        { handle: 'spirits', title: 'Spirits', name: 'Spirits', products_count: 134 },
        { handle: 'mixers-non-alcoholic', title: 'Mixers & Non-Alcoholic', name: 'Mixers & Non-Alcoholic', products_count: 113 },
        { handle: 'all-party-supplies', title: 'All Party Supplies', name: 'All Party Supplies', products_count: 122 },
        { handle: 'bachelorette-supplies', title: 'Bachelorette Supplies', name: 'Bachelorette Supplies', products_count: 84 },
        { handle: 'seltzers-wine-champagne', title: 'Seltzers, Wine, Champagne', name: 'Seltzers, Wine, Champagne', products_count: 82 },
        { handle: 'liqueurs-cordials-cocktail-ingredients', title: 'Liqueurs, Cordials, Cocktail Ingredients', name: 'Liqueurs, Cordials, Cocktail Ingredients', products_count: 68 },
        { handle: 'concierge-backyard-pool-toys', title: 'Concierge - Backyard & Pool Toys', name: 'Concierge - Backyard & Pool Toys', products_count: 59 },
        { handle: 'tailgate-beer', title: 'Tailgate Beer', name: 'Tailgate Beer', products_count: 57 },
        { handle: 'drinkware-bartending-tools', title: 'Drinkware, Openers, Coolers, Bar Accessories', name: 'Drinkware, Openers, Coolers, Bar Accessories', products_count: 53 },
        { handle: 'gin-rum', title: 'Vodka, Gin, & Rum', name: 'Vodka, Gin, & Rum', products_count: 51 },
        { handle: 'bourbon-rye', title: 'Bourbon & Rye', name: 'Bourbon & Rye', products_count: 48 },
        { handle: 'spirits-1', title: 'Spirits (Secondary)', name: 'Spirits (Secondary)', products_count: 47 },
        { handle: 'champagne', title: 'Wine and Champagne', name: 'Wine and Champagne', products_count: 45 },
        { handle: 'lake-packages-items', title: 'Lake Packages Items', name: 'Lake Packages Items', products_count: 44 },
        { handle: 'all-alcohol', title: 'All Alcohol', name: 'All Alcohol', products_count: 43 },
        { handle: 'tequila-mezcal', title: 'Tequila & Mezcal', name: 'Tequila & Mezcal', products_count: 41 },
        { handle: 'cocktail-kits', title: 'Cocktail Collection - ALL', name: 'Cocktail Collection - ALL', products_count: 41 },
        { handle: 'bachelorette-mixers-misc', title: 'Bachelorette (Mixers & Non-Alcoholic)', name: 'Bachelorette (Mixers & Non-Alcoholic)', products_count: 38 },
        { handle: 'party-supplies', title: 'Party Supplies', name: 'Party Supplies', products_count: 38 },
        { handle: 'bachelorette-party-supplies', title: 'Bachelorette (Party Supplies)', name: 'Bachelorette (Party Supplies)', products_count: 37 },
        { handle: 'disco-collection', title: 'Disco Collection', name: 'Disco Collection', products_count: 36 },
        { handle: 'bachelorette-booze', title: 'Bachelorette (Booze)', name: 'Bachelorette (Booze)', products_count: 35 },
        { handle: 'beer-airbnb-craft', title: 'Beer - airbnb / craft', name: 'Beer - airbnb / craft', products_count: 32 },
        { handle: 'rental-items', title: 'Rental Items', name: 'Rental Items', products_count: 32 },
        { handle: 'decorations', title: 'Decorations', name: 'Decorations', products_count: 30 },
        { handle: 'bachelor-spirits-cocktails', title: 'Bachelor - Spirits & Cocktails', name: 'Bachelor - Spirits & Cocktails', products_count: 28 },
        { handle: 'concierge-backyard-parties', title: 'Concierge - Backyard Parties', name: 'Concierge - Backyard Parties', products_count: 28 },
        { handle: 'concierge-pool-toys', title: 'Concierge - Pool Toys', name: 'Concierge - Pool Toys', products_count: 27 },
        { handle: 'hats-sunglasses', title: 'Hats, Headbands, Necklaces & Sunglasses', name: 'Hats, Headbands, Necklaces & Sunglasses', products_count: 27 },
        { handle: 'tailgate-supplies-and-fun', title: 'Tailgate - NA + mixers', name: 'Tailgate - NA + mixers', products_count: 26 },
        { handle: 'tailgate-seltzers', title: 'Seltzers & Champagne', name: 'Seltzers & Champagne', products_count: 25 },
        { handle: 'hangover-management', title: 'Hangover Management', name: 'Hangover Management', products_count: 24 },
        { handle: 'chill-supplies', title: 'Chill Supplies', name: 'Chill Supplies', products_count: 23 },
        { handle: 'wine-champagne-bnb-wedding', title: 'Wine & Champagne - Bnb / Wedding', name: 'Wine & Champagne - Bnb / Wedding', products_count: 23 },
        { handle: 'beer-light-beer-boat', title: 'Beer - Light Beer / Boat', name: 'Beer - Light Beer / Boat', products_count: 21 },
        { handle: 'bachelor-seltzers-wine', title: 'Bachelor - Seltzers & Wine', name: 'Bachelor - Seltzers & Wine', products_count: 20 },
        { handle: 'seltzer-collection', title: 'Seltzers - All', name: 'Seltzers - All', products_count: 19 },
        { handle: 'bachelor-favorites', title: 'Bachelor Favorites', name: 'Bachelor Favorites', products_count: 19 },
        { handle: 'spirits-cocktail-kits-boat-collection', title: 'Spirits & Cocktail Kits - Boat Collection', name: 'Spirits & Cocktail Kits - Boat Collection', products_count: 17 },
        { handle: 'concierge-household-items-toiletries', title: 'Concierge - Household Items/Toiletries', name: 'Concierge - Household Items/Toiletries', products_count: 17 },
        { handle: 'non-alcoholic', title: 'Non Alcoholic', name: 'Non Alcoholic', products_count: 17 },
        { handle: 'pop-up-box', title: 'Pop Up Box', name: 'Pop Up Box', products_count: 16 },
        { handle: 'party-pitcher-cocktails', title: 'Featured Cocktail Kits', name: 'Featured Cocktail Kits', products_count: 14 },
        { handle: 'beer-kegs', title: 'Beer - kegs', name: 'Beer - kegs', products_count: 12 },
        { handle: 'favorites-home-page', title: 'Favorites - Home Page', name: 'Favorites - Home Page', products_count: 10 },
        { handle: 'tailgate-cocktail', title: 'Tailgate - Cocktail', name: 'Tailgate - Cocktail', products_count: 9 },
        { handle: 'concierge-electronics', title: 'Concierge - Electronics', name: 'Concierge - Electronics', products_count: 9 },
        { handle: 'live-on-the-lake-cocktail-kits', title: 'Live on the Lake Cocktail Kits', name: 'Live on the Lake Cocktail Kits', products_count: 7 },
        { handle: 'costumes', title: 'Festive Attire & Costumes', name: 'Festive Attire & Costumes', products_count: 7 },
        { handle: 'gift-baskets', title: 'Gift Baskets', name: 'Gift Baskets', products_count: 6 },
        { handle: 'bachelor-weekend-essentials', title: 'Bachelor - Weekend Essentials', name: 'Bachelor - Weekend Essentials', products_count: 6 },
        { handle: 'july-4th-specials', title: 'July 4th specials', name: 'July 4th specials', products_count: 4 },
        { handle: 'cocktail-collection-singles-stirred', title: 'Cocktail Collection - Singles / Stirred', name: 'Cocktail Collection - Singles / Stirred', products_count: 4 }
      ];
      
      console.log(`📝 Using comprehensive fallback with ${fallbackCollections.length} collections`);
      setShopifyCollections(fallbackCollections);

    } catch (error) {
      console.error('❌ Error loading collections:', error);
      setShopifyCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Initialize form - FIXED PERSISTENCE AND TIMING
  useEffect(() => {
    if (!open) return;

    // Load collections first, then restore tabs to ensure dropdowns work
    const initializeApp = async () => {
      // Always load collections first
      await loadShopifyCollections();
      loadHomepageTemplate();

      // Only initialize once when dialog opens
      if (initial && initial.id) {
        console.log('📝 Loading existing delivery app:', initial);
        setAppName(initial.app_name || '');
        setAppSlug(initial.app_slug || '');
        setHeroHeading(initial.main_app_config?.hero_heading || '');
        setHeroSubheading(initial.main_app_config?.hero_subheading || '');
        setLogoUrl(initial.logo_url || '');
        setTheme(initial.theme || migrateLegacyTheme('gold'));
        
        // CRITICAL: Ensure tabs are preserved exactly as saved - AFTER collections load
        const savedTabs = initial.collections_config?.tabs || [];
        console.log('🔄 Restoring saved tabs with collections loaded:', savedTabs);
        setTabs(savedTabs);
        
        setIsActive(initial.is_active ?? true);
        setIsHomepage(initial.is_homepage ?? false);
      } else if (!initial) {
        // Only reset for completely new apps
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
          { name: 'Mixers & N/A', collection_handle: 'mixers-non-alcoholic', icon: '🧊' },
          { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' }
        ]);
        setIsActive(true);
        setIsHomepage(false);
      }
    };

    initializeApp();
  }, [open, initial?.id]); // Only depend on open and initial.id to prevent unnecessary resets

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
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
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
                    Content-only editing with cohesive theming
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

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Editor
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="editor" className="flex-1 overflow-hidden">
                <DeliveryAppLiveEditor
                  appName={appName}
                  heroHeading={heroHeading}
                  heroSubheading={heroSubheading}
                  logoUrl={logoUrl}
                  backgroundImageUrl={backgroundImageUrl}
                  tabs={tabs}
                  theme={theme}
                  logoSize={logoSize}
                  headlineSize={headlineSize}
                  logoVerticalPos={logoVerticalPos}
                  headlineVerticalPos={headlineVerticalPos}
                  subheadlineVerticalPos={subheadlineVerticalPos}
                  onLogoSizeChange={(value) => setLogoSize(value[0])}
                  onHeadlineSizeChange={(value) => setHeadlineSize(value[0])}
                  onLogoVerticalChange={(value) => setLogoVerticalPos(value[0])}
                  onHeadlineVerticalChange={(value) => setHeadlineVerticalPos(value[0])}
                  onSubheadlineVerticalChange={(value) => setSubheadlineVerticalPos(value[0])}
                  onHeroHeadingChange={setHeroHeading}
                  onHeroSubheadingChange={setHeroSubheading}
                  onLogoUpload={handleLogoUpload}
                  onBackgroundUpload={handleBackgroundUpload}
                />
              </TabsContent>

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
                                value={tab.collection_handle || ''} 
                                onValueChange={(value) => {
                                  console.log(`🔄 Tab ${index} collection changed to:`, value);
                                  updateTab(index, { collection_handle: value });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingCollections ? "Loading..." : "Select a collection"} />
                                </SelectTrigger>
                                 <SelectContent className="z-[9999] bg-background border">
                                    {loadingCollections ? (
                                      <SelectItem value="" disabled>
                                        Loading collections...
                                      </SelectItem>
                                    ) : shopifyCollections.length === 0 ? (
                                      <SelectItem value="" disabled>
                                        No collections available
                                      </SelectItem>
                                    ) : (
                                       shopifyCollections.map((collection, collectionIndex) => {
                                         const displayName = collection.title || collection.name || collection.handle || `Collection ${collectionIndex + 1}`;
                                         const productCount = collection.products_count || 0;
                                         console.log(`🔍 Collection ${collectionIndex}:`, { 
                                           title: collection.title, 
                                           name: collection.name, 
                                           handle: collection.handle,
                                           displayName,
                                           productCount 
                                         });
                                         return (
                                           <SelectItem 
                                             key={`${collection.handle || collectionIndex}-${productCount}`} 
                                             value={collection.handle || `collection-${collectionIndex}`}
                                             className="bg-background hover:bg-muted cursor-pointer"
                                           >
                                             <div className="w-full flex justify-between items-center">
                                               <span className="font-medium text-foreground">{displayName}</span>
                                               <span className="text-muted-foreground text-sm">({productCount})</span>
                                             </div>
                                           </SelectItem>
                                         );
                                       })
                                    )}
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
                                    <span className="text-lg">{option.value}</span>
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
                    <h3 className="text-lg font-semibold">Configuration Summary</h3>
                  </div>
                  
                  <div className="flex-1 bg-muted/10 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">App Details</h4>
                        <div className="bg-card rounded-lg p-4 space-y-2">
                          <p><span className="font-medium">Name:</span> {appName || 'Not set'}</p>
                          <p><span className="font-medium">Slug:</span> {appSlug || 'Not set'}</p>
                          <p><span className="font-medium">Theme:</span> {theme || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Content</h4>
                        <div className="bg-card rounded-lg p-4 space-y-2">
                          <p><span className="font-medium">Headline:</span> {heroHeading || 'Not set'}</p>
                          <p><span className="font-medium">Subheadline:</span> {heroSubheading || 'Not set'}</p>
                          <p><span className="font-medium">Logo:</span> {logoUrl ? 'Uploaded' : 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Collections ({tabs.length} tabs)</h4>
                        <div className="bg-card rounded-lg p-4">
                          <div className="space-y-2">
                            {tabs.map((tab, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="text-lg">{tab.icon}</span>
                                <span className="font-medium">{tab.name}</span>
                                <span className="text-muted-foreground">→ {tab.collection_handle}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
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