import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Plus, Minus, Search, ArrowLeft, Grid, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { ultraFastLoader } from '@/utils/ultraFastLoader';
import { advancedCacheManager } from '@/utils/advancedCacheManager';
import logoImage from '@/assets/party-on-delivery-logo.png';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';

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
      
      console.log('⚡ Loading collections for custom delivery app...');
      const startTime = Date.now();

      // Use get-all-collections function to fetch collections with products
      const { data: collectionsResponse, error: collectionsError } = await supabase.functions.invoke('get-all-collections');

      if (collectionsError) {
        throw new Error(`Failed to load collections: ${collectionsError.message}`);
      }

      if (!collectionsResponse?.collections || collectionsResponse.collections.length === 0) {
        throw new Error('No collections found');
      }

      console.log(`✅ Collections loaded in ${Date.now() - startTime}ms`);

      // Filter to only the collections we need for this app
      const relevantCollections = collectionsResponse.collections.filter((collection: any) =>
        collectionsConfig.tabs.some(tab => tab.collection_handle === collection.handle)
      );

      // Transform the data to match our interface
      const transformedCollections: ShopifyCollection[] = relevantCollections.map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        description: collection.description || '',
        products: (collection.products || []).map((product: any) => ({
          id: product.id,
          title: product.title,
          price: parseFloat(product.price) || 0,
          image: product.image || '',
          description: product.description || '',
          handle: product.handle,
          variants: (product.variants || []).map((variant: any) => ({
            id: variant.id,
            title: variant.title,
            price: parseFloat(variant.price) || 0,
            available: variant.available !== false
          }))
        }))
      }));

      // Get all products from all collections
      const allProducts = transformedCollections.reduce((acc: ShopifyProduct[], collection) => {
        return [...acc, ...collection.products];
      }, []);

      setCollections(transformedCollections);
      setAllProducts(allProducts);
      console.log(`✅ Loaded ${transformedCollections.length} collections with ${allProducts.length} products`);
      
    } catch (error) {
      console.error('Error loading collections:', error);
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

  // Helper function to get responsive grid classes based on collection type
  const getResponsiveGridClasses = (tabId: string) => {
    const collection = collections.find(c => c.handle === tabId);
    const collectionHandle = collection?.handle || tabId;
    
    // Check if it's liquor/beer (8 per row desktop) or seltzers/cocktails/rentals (6 per row desktop)
    const isLiquorBeer = collectionHandle.includes('spirits') || collectionHandle.includes('beer');
    const isSeltzersRentals = collectionHandle.includes('seltzer') || collectionHandle.includes('cocktail') || collectionHandle.includes('rental');
    
    if (isLiquorBeer) {
      // 8 per row on desktop, 3 per row on mobile
      return "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4";
    } else if (isSeltzersRentals) {
      // 6 per row on desktop, 3 per row on mobile  
      return "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4";
    } else {
      // Default: 5 per row on desktop, 3 per row on mobile
      return "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4";
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Full Screen Hero Section */}
      <div 
        className="relative h-screen bg-cover bg-center bg-no-repeat flex flex-col"
        style={{ backgroundImage: `url(${heroPartyAustin})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Header with navigation */}
        <div className="relative z-10 flex justify-between items-center p-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onGoHome} className="text-white hover:bg-white/20">
            Home
          </Button>
        </div>

        {/* Centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          {/* App Logo */}
          <div className="mb-6">
            <img 
              src={logoImage} 
              alt="Party On Delivery Logo" 
              className="w-24 h-24 mx-auto"
            />
          </div>

          {/* App Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {appName}
          </h1>
          
          {/* Hero Heading */}
          {heroHeading && (
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed">
              {heroHeading}
            </p>
          )}

          {/* Search Bar */}
          <div className="relative mb-8 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search all products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg bg-white/90 backdrop-blur-sm border-white/20"
            />
          </div>

          {/* Category Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'secondary'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-white/80 text-gray-800 hover:bg-white/90'
                }`}
              >
                {typeof tab.icon === 'string' ? (
                  <span className="text-lg">{tab.icon}</span>
                ) : (
                  <tab.icon className="h-4 w-4" />
                )}
                {tab.name}
              </Button>
            ))}
          </div>

          {/* Cart/Checkout Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-white/80 text-gray-800 hover:bg-white/90 px-6 py-3"
            >
              <ShoppingCart className="h-5 w-5" />
              Cart
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              onClick={onProceedToCheckout}
              disabled={cartItemCount === 0}
              className="px-8 py-3 text-lg"
            >
              Checkout
            </Button>
          </div>

          {/* Powered by text */}
          <p className="text-white/70 mt-6 text-sm">Powered by Party On Delivery</p>
        </div>

        {/* Bottom scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="animate-bounce">
            <ChevronRight className="h-6 w-6 text-white/70 rotate-90" />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {activeTab === 'search' ? 'Search Results' : 
               tabs.find(tab => tab.id === activeTab)?.name || 'Products'}
            </h2>
            {searchTerm && (
              <p className="text-muted-foreground">
                Showing results for "{searchTerm}"
              </p>
            )}
          </div>

          {/* Products Grid with Responsive Layout */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
              </p>
            </div>
          ) : (
            <div className={getResponsiveGridClasses(activeTab)}>
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
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-white/20">
      <CardContent className="flex flex-col h-full p-2 md:p-3 relative">
        {/* Product Image */}
        <div className="aspect-square mb-2 relative overflow-hidden rounded-lg">
          <OptimizedImage
            src={optimizedImage.src}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            priority={false}
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium line-clamp-2 mb-1 text-xs md:text-sm text-center">
            {cleanTitle}
          </h3>
          {packageSize && (
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {packageSize}
            </p>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-center mb-2">
              <span className="font-bold text-primary text-sm md:text-lg">
                ${product.price.toFixed(2)}
              </span>
            </div>
            
            {quantity > 0 && (
              <div className="text-center mb-2">
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              </div>
            )}

            {/* Quantity Controls - Responsive Size */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-1 md:gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className="p-0 h-5 w-5 md:h-6 md:w-6 flex-shrink-0 rounded-full"
                >
                  <Minus className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
                <span className="font-medium min-w-[15px] md:min-w-[20px] text-center flex-1 text-xs md:text-sm">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className="p-0 h-5 w-5 md:h-6 md:w-6 flex-shrink-0 rounded-full"
                >
                  <Plus className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={onAddToCart}
                  className="h-5 w-5 md:h-6 md:w-6 rounded-full p-0 flex items-center justify-center"
                  size="sm"
                >
                  <Plus className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}