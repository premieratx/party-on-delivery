import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useProductPreloader } from '@/hooks/useProductPreloader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';
import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import { CombinedSearchTabs } from '@/components/delivery/CombinedSearchTabs';
import { parseProductTitle } from '@/utils/productUtils';
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { ProductLightbox } from '@/components/delivery/ProductLightbox';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import bgImage from '@/assets/old-fashioned-bg.jpg';

interface ProductCategoriesEnhancedProps {
  appName?: string;
  heroHeading?: string;
  heroSubheading?: string;
  
  logoUrl?: string;
  heroBackgroundConfig?: {
    type?: 'image' | 'video' | 'color' | 'gradient';
    image?: string;
    video?: string;
    color?: string;
    gradient_start?: string;
    gradient_end?: string;
    gradient_direction?: string;
  };
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
  onCheckout?: () => void;
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

export const ProductCategoriesEnhanced: React.FC<ProductCategoriesEnhancedProps> = ({
  appName = "Austin's Premier Party Supply Delivery",
  heroHeading = "Austin's Premier Party Supply Delivery",
  heroSubheading = "Satisfaction Guaranteed, On-Time Delivery",
  logoUrl,
  heroBackgroundConfig,
  collectionsConfig,
  onAddToCart,
  cartItemCount = 0,
  onOpenCart,
  cartItems = [],
  onUpdateQuantity,
  onProceedToCheckout,
  onCheckout,
  onBack,
  onGoHome,
  onSearchQueryChange,
  externalSearchQuery = '',
  customSiteSlug,
  showSearch = true,
  maxProducts = 1000,
  forceRefresh = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity, getTotalPrice } = useUnifiedCart();
  const { isScrollingDown } = useScrollHeader({ threshold: 100 });
  const { preloadCollection, getFromCache, preloadMultipleCollections } = useProductPreloader();
  
  // Set up search variables
  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // Use collections from config or defaults
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs) {
      return collectionsConfig.tabs.map((tab, index) => ({
        id: tab.collection_handle,
        title: tab.name,
        handle: tab.collection_handle,
        icon: '', // No icons to prevent overlap
        isSearch: false
      }));
    }
    return DEFAULT_COLLECTIONS;
  }, [collectionsConfig]);

  // Preload all collections on mount for instant switching
  useEffect(() => {
    const collectionHandles = tabs.map(tab => tab.handle);
    console.log('🚀 Enhanced: Preloading all collections:', collectionHandles);
    preloadMultipleCollections(collectionHandles);
  }, [tabs, preloadMultipleCollections]);

  // Get current tab config
  const currentTabConfig = collectionsConfig?.tabs?.[selectedCategory];
  const currentCollectionHandle = currentTabConfig?.collection_handle;

  // Load products for current collection with instant cache
  const loadCurrentTabProducts = useCallback(async () => {
    if (!currentCollectionHandle) {
      setDisplayProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`⚡ Enhanced: Loading collection: ${currentCollectionHandle}`);
      
      // Try cache first for instant loading
      const cached = getFromCache(currentCollectionHandle);
      if (cached) {
        console.log(`⚡ Enhanced: Cache hit for ${currentCollectionHandle}, ${cached.length} products`);
        const filtered = cached.filter((product: any) => {
          const handles = Array.isArray(product.collection_handles) 
            ? product.collection_handles 
            : typeof product.collection_handles === 'string' 
              ? JSON.parse(product.collection_handles || '[]')
              : [];
          return handles.includes(currentCollectionHandle);
        });
        setDisplayProducts(filtered.slice(0, maxProducts));
        setLoading(false);
        return;
      }

      // Load from preloader/cache
      const products = await preloadCollection(currentCollectionHandle);
      
      // Strict filtering for current collection only
      const filtered = products.filter((product: any) => {
        const handles = Array.isArray(product.collection_handles) 
          ? product.collection_handles 
          : typeof product.collection_handles === 'string' 
            ? JSON.parse(product.collection_handles || '[]')
            : [];
        return handles.includes(currentCollectionHandle);
      });

      console.log(`⚡ Enhanced: Loaded ${filtered.length} products for ${currentCollectionHandle} in Shopify order`);
      setDisplayProducts(filtered.slice(0, maxProducts));
      
    } catch (error) {
      console.error('Enhanced: Error loading products:', error);
      setError('Failed to load products');
      setDisplayProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentCollectionHandle, maxProducts, preloadCollection, getFromCache]);

  // Load products when tab changes
  useEffect(() => {
    loadCurrentTabProducts();
  }, [loadCurrentTabProducts]);

  // Force refresh products if requested
  useEffect(() => {
    if (forceRefresh) {
      console.log('🔄 Enhanced: Force refreshing products');
      loadCurrentTabProducts();
    }
  }, [forceRefresh, loadCurrentTabProducts]);

  const currentTab = tabs[selectedCategory];

  const handleAddToCart = (product: any) => {
    const firstVariant = product.variants?.[0];
    const cartItem = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: firstVariant?.price || product.price || 0,
      image: product.image,
      variant: firstVariant?.id ? String(firstVariant.id) : 'default'
    };
    
    console.log('🛒 Enhanced: Adding to cart:', cartItem);
    addToCart(cartItem);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    
    const product = displayProducts.find(p => p.id === productId) || 
                   searchProducts.find(p => p.id === productId);
    const variant = product?.variants?.find((v: any) => v.id === variantId) || product?.variants?.[0];
    
    if (newQty === 0) {
      updateQuantity(productId, variantId || 'default', 0);
    } else {
      updateQuantity(productId, variantId || 'default', newQty, {
        id: String(productId),
        title: product?.title || '',
        name: product?.title || '',
        price: variant?.price || product?.price || 0,
        image: product?.image || '',
        variant: variantId || 'default'
      });
    }
  };

  // Enhanced real-time search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchProducts([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const q = searchQuery.trim().toLowerCase();
    
    try {
      const { data: response, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { 
          collection_handle: 'all',
          force_refresh: false
        }
      });

      if (error) throw error;
      const allProducts = response?.products || [];
      
      const filtered = allProducts.filter((product: any) => {
        const title = String(product.title || '').toLowerCase();
        const productType = String(product.product_type || '').toLowerCase();
        const category = String(product.category || '').toLowerCase();
        
        let collections = '';
        if (product.collection_handles) {
          if (Array.isArray(product.collection_handles)) {
            collections = product.collection_handles.join(' ').toLowerCase();
          } else if (typeof product.collection_handles === 'string') {
            collections = product.collection_handles.toLowerCase();
          }
        }
        
        return title.includes(q) || 
               productType.includes(q) || 
               category.includes(q) || 
               collections.includes(q);
      });

      console.log(`🔍 Enhanced SEARCH: Found ${filtered.length} products with "${searchQuery}"`);
      setSearchProducts(filtered);
    } catch (error) {
      console.error('Enhanced search error:', error);
      setSearchProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Search timer for delayed execution
  useEffect(() => {
    if (searchQuery?.trim()) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setSearchProducts([]);
    }
  }, [searchQuery, handleSearch]);

  // Generate hero background style
  const getHeroBackgroundStyle = () => {
    if (!heroBackgroundConfig?.type) {
      return { backgroundImage: `url(${bgImage})` };
    }

    switch (heroBackgroundConfig.type) {
      case 'image':
        return heroBackgroundConfig.image 
          ? { backgroundImage: `url(${heroBackgroundConfig.image})` }
          : { backgroundImage: `url(${bgImage})` };
      
      case 'color':
        return { backgroundColor: heroBackgroundConfig.color || '#000000' };
      
      case 'gradient':
        const direction = heroBackgroundConfig.gradient_direction || '135deg';
        const start = heroBackgroundConfig.gradient_start || '#000000';
        const end = heroBackgroundConfig.gradient_end || '#333333';
        return { 
          background: `linear-gradient(${direction}, ${start}, ${end})` 
        };
      
      default:
        return { backgroundImage: `url(${bgImage})` };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Dynamic Background */}
      <div 
        className="relative h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={getHeroBackgroundStyle()}
      >
        {/* Video Background */}
        {heroBackgroundConfig?.type === 'video' && heroBackgroundConfig.video && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={heroBackgroundConfig.video} type="video/mp4" />
          </video>
        )}
        
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Search App Button - Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <Button 
            onClick={() => navigate('/search')}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Delivery App Dropdown - Top Right */}
        <div className="absolute top-4 right-4 z-20">
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
          </div>
        </div>
      </div>

        {/* Combined Search and Tabs with Cart & Checkout */}
        <CombinedSearchTabs
          tabs={tabs}
          selectedCategory={selectedCategory}
          onTabSelect={(index) => {
            // Remove excessive tab switching logs - works silently
            setSelectedCategory(index);
            setSearchProducts([]);
          }}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim()) {
              setTimeout(() => handleSearch(), 300);
            } else {
              setSearchProducts([]);
            }
          }}
          onSearchSubmit={handleSearch}
          showSearch={showSearch}
          isSearchActive={!!searchQuery}
          isSearching={loading}
          cartItemCount={cartItemCount}
          totalAmount={getTotalPrice()}
          onOpenCart={onOpenCart}
          onCheckout={onCheckout}
        />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 pb-32 lg:pb-24">
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        )}

        {/* Show search results or tab products */}
        {searchQuery && searchProducts.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Search Results ({searchProducts.length})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {searchProducts.map((product) => (
                <EnhancedProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onQuantityChange={handleQuantityChange}
                  quantity={getCartItemQuantity(product.id, product.variants?.[0]?.id)}
                  onProductClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {currentTab && (
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {currentTab.title} ({displayProducts.length})
              </h3>
            )}
            
            {!loading && displayProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found in this category
              </div>
            )}

            <div className={`grid ${tabs[selectedCategory]?.handle === 'cocktails' ? 'grid-cols-2' : 'grid-cols-3'} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4`}>
              {displayProducts.map((product) => (
                <EnhancedProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onQuantityChange={handleQuantityChange}
                  quantity={getCartItemQuantity(product.id, product.variants?.[0]?.id)}
                  onProductClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Remove Mobile Bottom Cart Bar since cart is now in tabs */}
      {/* MobileBottomCartBar removed - cart and checkout are now in CombinedSearchTabs */}
      
      {/* What's the Occasion? - HIDDEN as requested */}

      {/* Product Lightbox - Only for cocktail collections */}
      {selectedProduct && selectedProduct.collection_handles?.some(handle => 
        handle.includes('cocktail') || handle.includes('party-pitcher')
      ) && (
        <ProductLightbox
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          selectedVariant={selectedProduct.variants?.[0]}
          onUpdateQuantity={handleQuantityChange}
          cartQuantity={getCartItemQuantity(selectedProduct.id, selectedProduct.variants?.[0]?.id)}
          onProceedToCheckout={onCheckout}
        />
      )}
    </div>
  );
};

// Enhanced Product Card Component
interface EnhancedProductCardProps {
  product: any;
  onAddToCart: (product: any) => void;
  onQuantityChange: (id: string, variant: string | undefined, delta: number) => void;
  quantity: number;
  onProductClick: () => void;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  onAddToCart,
  onQuantityChange,
  quantity,
  onProductClick
}) => {
  const optimizedImages = useImageOptimization(product.image);
  const parsedTitle = parseProductTitle(product.title);
  const firstVariant = product.variants?.[0];
  const variantId = firstVariant?.id ? String(firstVariant.id) : 'default';

  return (
    <div 
      className="group relative bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onProductClick}
    >
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <OptimizedImage
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Quick Add Button - Appears on Hover */}
        {quantity === 0 && (
          <Button
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <div className="space-y-1">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {parsedTitle.cleanTitle}
          </h4>
          {parsedTitle.packageSize && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {parsedTitle.packageSize}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">
            ${firstVariant?.price || product.price || 0}
          </span>
          
          {/* Add to Cart / Quantity Controls */}
          {quantity === 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-8 text-xs"
            >
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuantityChange(product.id, variantId, -1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuantityChange(product.id, variantId, 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};