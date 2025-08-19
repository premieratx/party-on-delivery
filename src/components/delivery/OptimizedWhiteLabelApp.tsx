import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, ArrowLeft, Package, Users, CheckCircle } from 'lucide-react';
import { SuperFastProductGrid } from './SuperFastProductGrid';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { useOptimizedShopify } from '@/utils/optimizedShopifyClient';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ProductSearchBar } from '@/components/delivery/ProductSearchBar';
import { TypingIntro } from '@/components/common/TypingIntro';
import { ProductLightbox } from '@/components/delivery/ProductLightbox';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
      
      console.log('🔄 Loading collections for app:', appConfig.app_name);

      // Use instant-product-cache to get all products and organize by collections
      const { data: cacheData, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: false }
      });

      if (!cacheError && cacheData?.success && cacheData?.data) {
        const allProducts = cacheData.data.products || [];
        console.log('✅ Loaded', allProducts.length, 'products from cache');
        
        // Create collections based on app config with filtered products
        const appCollections: Collection[] = appConfig.collections_config.tabs.map(tab => {
          const collectionProducts = allProducts.filter((product: any) => {
            // Match by collection handles or category
            return product.collection_handles?.some((handle: string) => 
              handle.toLowerCase().includes(tab.collection_handle.toLowerCase()) ||
              tab.collection_handle.toLowerCase().includes(handle.toLowerCase())
            ) || product.category?.toLowerCase() === tab.collection_handle.toLowerCase();
          });
          
          console.log(`📦 Collection "${tab.name}" (${tab.collection_handle}): ${collectionProducts.length} products`);
          
          return {
            id: tab.collection_handle,
            handle: tab.collection_handle,
            title: tab.name,
            products: collectionProducts
          };
        });

        setCollections(appCollections);

        if (appCollections.every(col => col.products.length === 0)) {
          setError('No products found for any configured collections');
        }
      } else {
        // Fallback to original method
        console.log('Cache failed, using fallback method');
        const allCollections = await getCollections(true);
        const appCollectionHandles = appConfig.collections_config.tabs.map(tab => tab.collection_handle);
        const filteredCollections = allCollections.filter(collection => 
          appCollectionHandles.includes(collection.handle)
        );
        const sortedCollections = appConfig.collections_config.tabs.map(tab => 
          filteredCollections.find(collection => collection.handle === tab.collection_handle)
        ).filter(Boolean) as Collection[];
        setCollections(sortedCollections);
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
  }, [appConfig.collections_config.tabs, appConfig.app_name, getCollections, toast]);

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

  // Memoized tab data for performance - safe null checks
  const tabData = useMemo(() => {
    if (!appConfig?.collections_config?.tabs || !Array.isArray(appConfig.collections_config.tabs)) {
      return [];
    }
    if (!Array.isArray(collections)) {
      return [];
    }
    return appConfig.collections_config.tabs.map((tab, index) => ({
      ...tab,
      collection: collections[index] || null,
      hasProducts: (collections[index]?.products?.length || 0) > 0
    }));
  }, [appConfig?.collections_config?.tabs, collections]);

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
    const price = product.variants?.[0]?.price ?? product.price ?? 0;
    const currentQty = getCartItemQuantity(product.id, variantId);
    updateQuantity(product.id, variantId, currentQty + 1, {
      id: product.id,
      title: product.title,
      name: product.title,
      price,
      image: product.image,
      variant: variantId,
    });
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
      <div className="bg-card border-b border-border/40 backdrop-blur-sm bg-card/80">
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
          {/* Search button - top-left over hero */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => (window.location.href = '/search')}
              className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 rounded-lg px-3 py-2 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              aria-label="Open Search App"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0013.05 13.05z" />
              </svg>
              <span className="hidden sm:inline text-white font-medium">Search</span>
            </button>
          </div>
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
          <div className="mb-6 border-b">
            <div className="max-w-7xl mx-auto px-2">
              <div className="flex flex-nowrap items-stretch justify-center gap-2">
                <TabsList className="flex flex-nowrap gap-2 h-12 p-2 bg-muted/50 rounded-md">
                  {tabData.map((tab, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className={`px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${flashIndex === index ? 'ring-2 ring-primary animate-[pulse_0.6s_ease-in-out]' : ''}`}
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
                <button
                  onClick={() => setShowCart(true)}
                  className="hidden sm:flex items-center justify-center h-12 px-3 rounded-md bg-muted border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40 flex-none basis-20"
                  aria-label="Open Cart"
                >
                  <span className="inline-flex items-center gap-2 font-bold">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Cart</span>
                    {totalItems > 0 && (
                      <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1 leading-none">
                        {totalItems}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={totalItems === 0}
                  className={`hidden sm:flex items-center justify-center h-12 px-3 rounded-md ${totalItems > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'} flex-none basis-20`}
                  aria-label="Checkout"
                >
                  <span className="inline-flex items-center gap-2 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Checkout</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {tabData.map((tab, index) => (
            <TabsContent key={index} value={index.toString()} className="mt-0">
              <TabContent
                collection={tab.collection}
                tabName={tab.name}
                isActive={activeTab === index}
                onProductClick={(product) => setSelectedProduct(product)}
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

      {/* Product Lightbox */}
      {selectedProduct && (
        <ProductLightbox
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product) => {
            const variant = product.variants?.[0];
            if (variant) {
              updateQuantity(product.id, variant.id, 1);
              toast({
                description: `Added ${product.title} to cart`,
              });
            }
          }}
          selectedVariant={selectedProduct.variants?.[0]}
          onUpdateQuantity={(id, variantId, quantity) => {
            updateQuantity(id, variantId || 'default', quantity);
          }}
          cartQuantity={getCartItemQuantity(selectedProduct.id, selectedProduct.variants?.[0]?.id)}
          onProceedToCheckout={handleCheckout}
        />
      )}
    </div>
  );
});

OptimizedWhiteLabelApp.displayName = 'OptimizedWhiteLabelApp';