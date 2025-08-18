import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ForceAddToCartButton } from '@/components/common/ForceAddToCartButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react';
import { VideoBackground } from '@/components/common/VideoBackground';
import { TypingIntro } from '@/components/common/TypingIntro';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';
import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import bgImage from '@/assets/old-fashioned-bg.jpg';

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: any[];
  image?: string;
}

interface ProductCategoriesProps {
  appName?: string;
  heroHeading?: string;
  heroSubheading?: string;
  heroScrollingText?: string;
  logoUrl?: string;
  collectionsConfig?: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  onAddToCart?: (item: any) => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
  cartItems?: any[];
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout?: () => void;
  onBack?: () => void;
  onGoHome?: () => void;
  onSearchQueryChange?: (query: string) => void;
  externalSearchQuery?: string;
  customSiteSlug?: string;
  showSearch?: boolean;
  maxProducts?: number;
  forceRefresh?: boolean;
}

const DEFAULT_COLLECTIONS = [
  { id: 'spirits', title: 'Spirits', handle: 'spirits', isSearch: false, icon: '🥃' },
  { id: 'beer', title: 'Beer', handle: 'beer', isSearch: false, icon: '🍺' },
  { id: 'seltzers', title: 'Seltzers', handle: 'seltzers', isSearch: false, icon: '🥤' },
  { id: 'mixers', title: 'Mixers & N/A', handle: 'mixers', isSearch: false, icon: '🧊' },
  { id: 'cocktails', title: 'Cocktails', handle: 'cocktails', isSearch: false, icon: '🍸' }
];

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  appName = "Austin's Premier Party Supply Delivery",
  heroHeading = "Austin's Premier Party Supply Delivery",
  heroSubheading = "Satisfaction Guaranteed, On-Time Delivery",
  heroScrollingText = "Let's Get It",
  logoUrl,
  collectionsConfig,
  onAddToCart,
  cartItemCount = 0,
  onOpenCart,
  cartItems = [],
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onGoHome,
  onSearchQueryChange,
  externalSearchQuery = '',
  customSiteSlug,
  showSearch = true,
  maxProducts = 50,
  forceRefresh = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProducts, setSearchProducts] = useState<any[]>([]);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const { products, collections, loading, error, refreshProducts } = useOptimizedProductLoader();

  // Force refresh products if requested
  useEffect(() => {
    if (forceRefresh) {
      console.log('🔄 ProductCategories: Force refreshing products');
      refreshProducts();
    }
  }, [forceRefresh, refreshProducts]);

  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // Use collections from config or defaults (without search tab)
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs) {
      return collectionsConfig.tabs.map((tab, index) => ({
        id: tab.collection_handle,
        title: tab.name,
        handle: tab.collection_handle,
        icon: tab.icon || '📦',
        isSearch: false
      }));
    }
    return DEFAULT_COLLECTIONS;
  }, [collectionsConfig]);

  // Get products for current tab using configured collection handles
  const currentTabProducts = useMemo(() => {
    // Safety checks for arrays
    if (!Array.isArray(tabs) || !Array.isArray(collections)) {
      return [];
    }
    
    const currentTab = tabs[selectedCategory];
    if (!currentTab || currentTab.isSearch) return [];
    
    console.log(`📦 Tab ${currentTab.title}: Looking for collection handle: ${currentTab.handle}`);
    
    // Find the exact collection that matches the configured collection handle
    const targetCollection = collections.find(collection => 
      collection.handle === currentTab.handle
    );
    
    if (targetCollection && Array.isArray(targetCollection.products)) {
      console.log(`📦 ${currentTab.handle}: Found ${targetCollection.products.length} products from collection`);
      return targetCollection.products;
    }
    
    console.log(`📦 ${currentTab.handle}: No collection found with this handle`);
    return [];
  }, [tabs, selectedCategory, collections]);

  const currentTab = tabs[selectedCategory];
  const isCurrentlySearchTab = currentTab?.isSearch;

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined
    };
    
    if (onAddToCart) {
      onAddToCart(cartItem);
    } else if (onUpdateQuantity) {
      const currentQty = getCartItemQuantity(product.id, cartItem.variant);
      onUpdateQuantity(product.id, cartItem.variant, currentQty + 1);
    }
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    if (onUpdateQuantity) {
      onUpdateQuantity(productId, variantId, newQty);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery?.trim()) {
      setSearchProducts([]);
      return;
    }
    
    console.log('🔍 Instant search for:', searchQuery);
    try {
      setIsSearching(true);
      
      // Use smart cache for instant search
      const { data: cacheData, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: false }
      });
      
      console.log('🔍 Search cache response:', { cacheData, cacheError });
      
      if (!cacheError && cacheData?.success && cacheData?.data?.products) {
        const filtered = cacheData.data.products.filter((product: any) =>
          product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log(`🔍 Found ${filtered.length} search results`);
        setSearchProducts(filtered);
      } else {
        console.warn('Search cache failed, using fallback search');
        // Fallback: search in current loaded products
        const fallbackFiltered = products.filter((product: any) =>
          product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchProducts(fallbackFiltered);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback: search in current loaded products
      const fallbackFiltered = products.filter((product: any) =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchProducts(fallbackFiltered);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, products]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Delivery App Dropdown */}
        <div className="absolute top-4 left-4 z-20">
          <DeliveryAppDropdown />
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 max-w-4xl">
            {logoUrl && (
              <div className="mb-6">
                <img src={logoUrl} alt={appName} className="h-16 mx-auto" />
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {heroHeading}
            </h1>
            {heroSubheading && (
              <p className="text-xl md:text-2xl text-blue-100 mb-6">
                {heroSubheading}
              </p>
            )}
            {heroScrollingText && (
              <div className="mb-8">
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {heroScrollingText}
                </div>
              </div>
            )}
            
            {/* Search Button in Hero - Links to Search Page */}
            <div className="mt-8">
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Occasion Buttons - What's the Occasion */}
      <div className="bg-background border-b py-4">
        <div className="container mx-auto px-4">
          <OccasionButtons isMobile={false} isScrollingDown={false} />
        </div>
      </div>

      {/* Search Bar Above Tabs - Sticky */}
      {showSearch && (
        <div className="sticky top-0 z-50 bg-background border-b py-4">
          <div className="container mx-auto px-4">
            <div className="flex max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                   setSearchQuery(e.target.value);
                   // Instant search as user types with debounce
                   const query = e.target.value.trim();
                   if (query) {
                     setTimeout(() => handleSearch(), 300);
                   } else {
                     setSearchProducts([]);
                   }
                }}
                className="rounded-r-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setTimeout(() => setIsSearching(false), 100)}
              />
              <Button 
                onClick={handleSearch}
                className="rounded-l-none"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs with Cart on Desktop */}
      <div className="sticky top-[72px] z-40 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap min-w-fit"
                  onClick={() => {
                    setSelectedCategory(index);
                  }}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.title}
                </Button>
              ))}
            </div>
            
            {/* Cart/Checkout on Desktop */}
            <div className="hidden lg:flex ml-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/checkout')}
                className="whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cartItemCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Show search results when searching */}
        {isSearching && searchProducts.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Search Results ({searchProducts.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchProducts.map((product) => {
                const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                return (
                  <div key={product.id} className="bg-card border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-primary">${product.price}</span>
                    </div>
                    {quantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-destructive">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Products</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={refreshProducts} variant="outline">
              Try Again
            </Button>
          </div>
        ) : currentTabProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">📦</div>
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-6">
              No products available in this category yet. Try using the sync buttons below to load products.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentTabProducts.slice(0, maxProducts).map((product) => {
              console.log('🛒 ProductCategories: Rendering product', product.id, product.title);
              
              return (
                <div key={product.id} className="bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">${product.price}</p>
                    
                    {/* Force Add to Cart Button */}
                    <ForceAddToCartButton
                      product={{
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        variants: product.variants
                      }}
                      variant="default"
                      showQuantity={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategories;