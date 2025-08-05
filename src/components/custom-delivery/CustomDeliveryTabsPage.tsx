import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Plus, Minus, Search, ArrowLeft, Grid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { ultraFastLoader } from '@/utils/ultraFastLoader';
import { advancedCacheManager } from '@/utils/advancedCacheManager';
import logoImage from '@/assets/party-on-delivery-logo.png';

interface CustomDeliveryTabsPageProps {
  appName: string;
  heroHeading?: string;
  collectionsConfig: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  onAddToCart: (item: any) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: any[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
  onGoHome: () => void;
}

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
}

// Helper function to get tab icon
const getTabIcon = (iconName: string) => {
  switch (iconName.toLowerCase()) {
    case 'beer':
    case 'tailgate beer':
      return '🍺';
    case 'cocktail':
    case 'cocktails':
      return '🍸';
    case 'spirits':
      return '🥃';
    case 'seltzers':
    case 'seltzer':
      return '🥤';
    case 'party supplies':
      return '🎉';
    default:
      return '📦';
  }
};

export function CustomDeliveryTabsPage({
  appName,
  heroHeading,
  collectionsConfig,
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onGoHome
}: CustomDeliveryTabsPageProps) {
  const [activeTab, setActiveTab] = useState('search');
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    {
      id: 'search',
      name: 'Search',
      icon: Search,
      collection: 'search'
    },
    ...collectionsConfig.tabs.map(tab => ({
      id: tab.collection_handle,
      name: tab.name,
      icon: getTabIcon(tab.icon || tab.name),
      collection: tab.collection_handle
    }))
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⚡ Lightning-fast delivery app loading...');
      const startTime = Date.now();

      try {
        // Try lightning sync first (fastest possible)
        const { data: lightningData, error: lightningError } = await supabase.functions.invoke('lightning-sync');
        
        if (!lightningError && lightningData?.data?.collections) {
          console.log(`⚡ Lightning sync loaded in ${Date.now() - startTime}ms`);
          
          const relevantCollections = lightningData.data.collections.filter((collection: any) =>
            collectionsConfig.tabs.some(tab => tab.collection_handle === collection.handle)
          );

          const allProducts = relevantCollections.reduce((acc: ShopifyProduct[], collection: any) => {
            return [...acc, ...collection.products];
          }, []);

          setCollections(relevantCollections);
          setAllProducts(allProducts);
          setLoading(false);
          return;
        }

        // Fallback to ultra-fast loader
        const productData = await ultraFastLoader.loadProducts({
          useCache: true,
          priority: 'critical',
          timeout: 1500,
          fallbackToStale: true
        });

        console.log(`✅ Ultra-fast fallback loaded in ${Date.now() - startTime}ms`);

        if (productData.collections) {
          const relevantCollections = productData.collections.filter((collection: any) =>
            collectionsConfig.tabs.some(tab => tab.collection_handle === collection.handle)
          );

          const allProducts = relevantCollections.reduce((acc: ShopifyProduct[], collection: any) => {
            return [...acc, ...collection.products];
          }, []);

          setCollections(relevantCollections);
          setAllProducts(allProducts);
        }
      } catch (error) {
        console.error('Lightning-fast loading failed:', error);
        
        // Emergency fallback
        const emergencyData = advancedCacheManager.get('emergency-products') as any;
        if (emergencyData && Array.isArray(emergencyData.collections)) {
          const relevantCollections = emergencyData.collections.filter((collection: any) =>
            collectionsConfig.tabs.some(tab => tab.collection_handle === collection.handle)
          );
          setCollections(relevantCollections);
          setError('Using emergency cache');
        } else {
          setError('Failed to load delivery app data');
        }
      }
      
    } catch (error) {
      console.error('Error in fetchCollections:', error);
      setError(`Failed to load collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants[0]?.id
    };
    
    onAddToCart(cartItem);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    onUpdateQuantity(productId, variantId, newQty);
  };

  // Get current products based on active tab
  const getCurrentProducts = () => {
    let products: ShopifyProduct[] = [];
    
    if (activeTab === 'search') {
      products = allProducts;
    } else {
      const selectedCollection = collections.find(c => c.handle === activeTab);
      products = selectedCollection?.products || [];
    }

    // Filter by search term
    if (searchTerm) {
      products = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return products;
  };

  const filteredProducts = getCurrentProducts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {appName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCollections} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={onGoHome}>
              Home
            </Button>
          </div>

          {/* App Name & Hero Heading */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-primary mb-1">{appName}</h1>
            {heroHeading && (
              <p className="text-lg text-muted-foreground font-medium">{heroHeading}</p>
            )}
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img 
              src={logoImage} 
              alt="Party On Delivery Logo" 
              className="w-16 h-16"
            />
          </div>

          {/* Powered by text */}
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Powered by Party On Delivery</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search all products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 flex items-center gap-1"
              >
                {typeof tab.icon === 'string' ? tab.icon : <tab.icon className="h-4 w-4" />}
                {tab.name}
              </Button>
            ))}
            
            {/* Cart/Checkout Split Button */}
            <div className="flex-shrink-0 flex gap-1 ml-auto">
              <Button
                variant="outline"
                onClick={onOpenCart}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={onProceedToCheckout}
                disabled={cartItemCount === 0}
                className="flex items-center gap-1"
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getCartItemQuantity(product.id, product.variants[0]?.id)}
                onAddToCart={() => handleAddToCart(product)}
                onUpdateQuantity={(delta) => handleQuantityChange(product.id, product.variants[0]?.id, delta)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: ShopifyProduct;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
}

function ProductCard({ product, quantity, onAddToCart, onUpdateQuantity }: ProductCardProps) {
  const optimizedImage = useImageOptimization(product.image, false);
  const { cleanTitle, packageSize } = parseProductTitle(product.title);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="flex flex-col h-full p-3 relative">
        {/* Product Image */}
        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
          <OptimizedImage
            src={optimizedImage.src}
            alt={product.title}
            className="w-full h-full object-cover"
            priority={false}
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium line-clamp-2 mb-1 text-sm text-center">
            {cleanTitle}
          </h3>
          {packageSize && (
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {packageSize}
            </p>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-primary text-lg">
                ${product.price.toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              )}
            </div>

            {/* Quantity Controls - Smaller and Centered */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className="p-0 h-6 w-6 flex-shrink-0 rounded-full"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-medium min-w-[20px] text-center flex-1 text-sm">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className="p-0 h-6 w-6 flex-shrink-0 rounded-full"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={onAddToCart}
                  className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                  size="sm"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}