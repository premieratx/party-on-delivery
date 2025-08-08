import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, ArrowLeft, Package, Users } from 'lucide-react';
import { SuperFastProductGrid } from './SuperFastProductGrid';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { useOptimizedShopify } from '@/utils/optimizedShopifyClient';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ProductSearchBar } from '@/components/delivery/ProductSearchBar';
import { TypingIntro } from '@/components/common/TypingIntro';

interface WhiteLabelAppConfig {
  id: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  start_screen_config?: {
    title: string;
    subtitle: string;
  };
  main_app_config?: {
    hero_heading: string;
    description?: string;
  };
  post_checkout_config?: {
    heading: string;
    subheading: string;
    redirect_url?: string;
    show_add_more_button?: boolean;
  };
  branding?: {
    primary_color?: string;
    secondary_color?: string;
  };
  is_active: boolean;
}

interface Collection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  products: Array<{
    id: string;
    title: string;
    price: number;
    image: string;
    handle: string;
    description?: string;
    category?: string;
    variants?: Array<{
      id: string;
      title: string;
      price: number;
      available: boolean;
    }>;
  }>;
}

interface OptimizedWhiteLabelAppProps {
  appConfig: WhiteLabelAppConfig;
  onBack?: () => void;
  onCheckout?: (items: any[]) => void;
}

const TabContent = memo(({ 
  collection, 
  tabName, 
  isActive,
  onProductClick 
}: { 
  collection: Collection | null;
  tabName: string;
  isActive: boolean;
  onProductClick?: (product: any) => void;
}) => {
  if (!isActive || !collection) {
    return <div className="p-8 text-center text-muted-foreground">No products available</div>;
  }

  return (
    <SuperFastProductGrid
      products={collection.products}
      category={tabName.toLowerCase()}
      onProductClick={onProductClick}
      maxProducts={100}
      className="px-4"
    />
  );
});

TabContent.displayName = 'TabContent';

export const OptimizedWhiteLabelApp: React.FC<OptimizedWhiteLabelAppProps> = memo(({
  appConfig,
  onBack,
  onCheckout
}) => {
  const { toast } = useToast();
  const { getCollections } = useOptimizedShopify();
  const { cartItems, getTotalItems, getTotalPrice, emptyCart, updateQuantity, getCartItemQuantity } = useUnifiedCart();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);

  // Apply custom branding
  useEffect(() => {
    if (appConfig.branding) {
      const root = document.documentElement;
      if (appConfig.branding.primary_color) {
        root.style.setProperty('--primary', appConfig.branding.primary_color);
      }
      if (appConfig.branding.secondary_color) {
        root.style.setProperty('--secondary', appConfig.branding.secondary_color);
      }
    }

    return () => {
      // Reset branding on unmount
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
    };
  }, [appConfig.branding]);

  // Load collections based on app configuration
  const loadAppCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all collections
      const allCollections = await getCollections(true); // Include products

      // Filter collections based on app config
      const appCollectionHandles = appConfig.collections_config.tabs.map(tab => tab.collection_handle);
      const filteredCollections = allCollections.filter(collection => 
        appCollectionHandles.includes(collection.handle)
      );

      // Sort collections to match tab order
      const sortedCollections = appConfig.collections_config.tabs.map(tab => 
        filteredCollections.find(collection => collection.handle === tab.collection_handle)
      ).filter(Boolean) as Collection[];

      setCollections(sortedCollections);

      if (sortedCollections.length === 0) {
        setError('No collections found for this app configuration');
      }
    } catch (err) {
      console.error('Error loading app collections:', err);
      setError('Failed to load app data. Please try again.');
      toast({
        title: "Loading Error",
        description: "Failed to load app data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [appConfig.collections_config.tabs, getCollections, toast]);

  useEffect(() => {
    loadAppCollections();
  }, [loadAppCollections]);

  // Entrance tab flashing sequence - left to right
  useEffect(() => {
    const sequence = [0, 0, 1, 2, 3, 4, 0];
    let i = 0;
    let timeoutId: number | undefined;

    const step = () => {
      if (i < sequence.length) {
        setFlashIndex(sequence[i]);
        i += 1;
        timeoutId = window.setTimeout(step, 600);
      } else {
        setFlashIndex(null);
      }
    };

    step();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      setFlashIndex(null);
    };
  }, []);

  // Memoized tab data for performance
  const tabData = useMemo(() => {
    return appConfig.collections_config.tabs.map((tab, index) => ({
      ...tab,
      collection: collections[index] || null,
      hasProducts: (collections[index]?.products?.length || 0) > 0
    }));
  }, [appConfig.collections_config.tabs, collections]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add some items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    onCheckout?.(cartItems);
  }, [cartItems, onCheckout, toast]);

  // Handle search select from hero search bar (add one to cart)
  const handleSearchSelect = useCallback((product: any) => {
    const variantId = product.variants?.[0]?.id;
    const currentQty = getCartItemQuantity(product.id, variantId);
    updateQuantity(product.id, variantId, currentQty + 1);
  }, [getCartItemQuantity, updateQuantity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading {appConfig.app_name}</h3>
            <p className="text-muted-foreground">Setting up your personalized experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-destructive">
              <Package className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">App Unavailable</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="space-y-2">
              <Button onClick={loadAppCollections} className="w-full">
                Try Again
              </Button>
              {onBack && (
                <Button onClick={onBack} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      {/* Header */}
      <div className="bg-card border-b border-border/40 sticky top-0 z-40 backdrop-blur-sm bg-card/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button onClick={onBack} variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold">{appConfig.app_name}</h1>
                {appConfig.main_app_config?.description && (
                  <p className="text-sm text-muted-foreground">
                    {appConfig.main_app_config.description}
                  </p>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <Button
              onClick={() => setShowCart(true)}
              className="relative"
              variant={totalItems > 0 ? "default" : "outline"}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span>Cart</span>
              {totalItems > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {appConfig.main_app_config?.hero_heading && (
        <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 min-h-[22rem] lg:min-h-[34rem] flex items-center">
          <div className="max-w-7xl mx-auto px-4 text-center w-full">
            <h2 className="text-3xl font-bold mb-2">
              {appConfig.main_app_config.hero_heading}
            </h2>
            {appConfig.main_app_config.description && (
              <p className="text-lg text-muted-foreground">
                {appConfig.main_app_config.description}
              </p>
            )}

            {/* Global Search + Intro */}
            <div className="w-[calc(100%-2rem)] max-w-2xl mx-auto mt-[50px]">
              <ProductSearchBar 
                onProductSelect={handleSearchSelect}
                placeholder="Search all products..."
              />
              <div className="mt-4">
                <TypingIntro text="Let's Build Your Party Package!" className="text-white text-lg lg:text-2xl" speedMs={130} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Tabs */}
      <div className="max-w-7xl mx-auto p-4 -mt-[10px]">
        <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))}>
          {/* Tab Navigation */}
          <div className="mb-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-2 bg-muted/50">
              {tabData.map((tab, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className={`flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${flashIndex === index ? 'ring-2 ring-primary animate-[pulse_0.6s_ease-in-out]' : ''}`}
                >
                  <span className="font-medium">{tab.name}</span>
                  {tab.hasProducts && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.collection?.products.length || 0}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          {tabData.map((tab, index) => (
            <TabsContent key={index} value={index.toString()} className="mt-0">
              <TabContent
                collection={tab.collection}
                tabName={tab.name}
                isActive={activeTab === index}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Fixed Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/40 p-4 z-50 backdrop-blur-sm bg-card/90">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">{totalItems} items</span>
              </div>
              <div className="text-xl font-bold text-primary">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCart(true)} variant="outline">
                View Cart
              </Button>
              <Button onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <UnifiedCart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
    </div>
  );
});

OptimizedWhiteLabelApp.displayName = 'OptimizedWhiteLabelApp';