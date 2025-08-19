import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';
import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import { parseProductTitle } from '@/utils/productUtils';
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useProductPreloader } from '@/hooks/useProductPreloader';
import bgImage from '@/assets/old-fashioned-bg.jpg';

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
  { id: 'mixers', title: 'Mixers & N/A', handle: 'mixers-non-alcoholic', isSearch: false, icon: '🧊' },
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
  const [isSearchActive, setIsSearchActive] = useState(false); // Track if user is actively searching
  const [savedSearchQuery, setSavedSearchQuery] = useState(''); // Persist search across tab switches

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const { isScrollingDown } = useScrollHeader({ threshold: 100 });
  const { preloadMultipleCollections } = useProductPreloader();
  
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
        icon: tab.icon || '📦',
        isSearch: false
      }));
    }
    return DEFAULT_COLLECTIONS;
  }, [collectionsConfig]);

  // Preload all collections on mount for instant switching
  useEffect(() => {
    const collectionHandles = tabs.map(tab => tab.handle);
    console.log('🚀 Preloading all collections:', collectionHandles);
    preloadMultipleCollections(collectionHandles);
  }, [tabs, preloadMultipleCollections]);

  // Get current tab config
  const currentTabConfig = collectionsConfig?.tabs?.[selectedCategory];
  const currentCollectionHandle = currentTabConfig?.collection_handle;
  
  // Load products for current collection directly from Shopify collections
  const { products: currentTabProducts, collections, loading, error, refreshProducts } = useOptimizedProductLoader({
    collection_handle: currentCollectionHandle,
    use_type: 'delivery'
  });

  // Listen for collection updates and refresh
  useEffect(() => {
    const handleCollectionsUpdate = () => {
      console.log('🔄 Collections updated, refreshing products...');
      refreshProducts();
    };
    
    window.addEventListener('collectionsUpdated', handleCollectionsUpdate);
    return () => window.removeEventListener('collectionsUpdated', handleCollectionsUpdate);
  }, [refreshProducts]);

  // Force refresh products if requested
  useEffect(() => {
    if (forceRefresh) {
      console.log('🔄 ProductCategories: Force refreshing products');
      refreshProducts();
    }
  }, [forceRefresh, refreshProducts]);

  // Force clear products when switching tabs and strictly filter by current collection
  const displayProducts = useMemo(() => {
    console.log(`🔍 TAB ${selectedCategory}: Processing products for collection: ${currentCollectionHandle}`);
    
    if (!currentCollectionHandle) {
      console.log(`❌ No collection handle for tab ${selectedCategory}`);
      return [];
    }
    
    if (!currentTabProducts?.length) {
      console.log(`❌ No products loaded for collection: ${currentCollectionHandle}`);
      return [];
    }
    
    // STRICT filtering - only products that belong to this exact collection
    const strictlyFilteredProducts = currentTabProducts.filter(product => {
      const handles = Array.isArray(product.collection_handles) 
        ? product.collection_handles 
        : typeof product.collection_handles === 'string' 
          ? JSON.parse(product.collection_handles || '[]')
          : [];
      
      const belongsToCollection = handles.includes(currentCollectionHandle);
      if (!belongsToCollection) {
        console.log(`❌ Product "${product.title}" does not belong to collection "${currentCollectionHandle}" - handles: ${JSON.stringify(handles)}`);
      }
      return belongsToCollection;
    });
    
    // MAINTAIN SHOPIFY COLLECTION ORDER - preserve the order from Shopify
    console.log(`📦 TAB ${selectedCategory} (${currentCollectionHandle}): Showing ${strictlyFilteredProducts.length} products (filtered from ${currentTabProducts.length} total) in Shopify order`);
    return strictlyFilteredProducts.slice(0, maxProducts);
  }, [currentTabProducts, currentCollectionHandle, maxProducts, selectedCategory]);

  const currentTab = tabs[selectedCategory];
  const isCurrentlySearchTab = currentTab?.isSearch;

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
    
    console.log('🛒 ProductCategories: Adding to cart:', cartItem);
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

  // EXACT Real-time search with exact matching 
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchProducts([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const q = searchQuery.trim().toLowerCase();
    
    try {
      // Get all products for search using instant cache
      const { data: response, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { 
          collection_handle: 'all',
          force_refresh: false
        }
      });

      if (error) throw error;

      const allProducts = response?.products || [];
      
      // EXACT MATCHING ONLY - no assumptions, no related words
      const filtered = allProducts.filter((product: any) => {
        const title = String(product.title || '').toLowerCase();
        const productType = String(product.product_type || '').toLowerCase();
        const category = String(product.category || '').toLowerCase();
        
        // Get collection handles
        let collections = '';
        if (product.collection_handles) {
          if (Array.isArray(product.collection_handles)) {
            collections = product.collection_handles.join(' ').toLowerCase();
          } else if (typeof product.collection_handles === 'string') {
            collections = product.collection_handles.toLowerCase();
          }
        }
        
        // ONLY match these 4 criteria - EXACT substring matching
        return title.includes(q) || 
               productType.includes(q) || 
               category.includes(q) || 
               collections.includes(q);
      });

      console.log(`🔍 DELIVERY SEARCH: Found ${filtered.length} products with "${searchQuery}" in title/type/category/collection`);
      setSearchProducts(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSearchProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, supabase]);
  // Search timer for delayed execution
  useEffect(() => {
    if (searchQuery?.trim()) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setSearchProducts([]);
      setIsSearchActive(false);
    }
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
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
            {heroScrollingText && (
              <div className="mb-8">
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {heroScrollingText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Combined Row: Occasion Buttons + Search Bar - STICKY WITH MOBILE HIDE */}
      <div className={`sticky top-0 z-50 bg-background border-b shadow-sm transition-transform duration-300 ${isScrollingDown ? 'lg:translate-y-0 md:translate-y-0 -translate-y-full' : 'translate-y-0'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Occasion Buttons */}
            <div className="flex-1">
              <OccasionButtons isMobile={window.innerWidth <= 768} isScrollingDown={isScrollingDown} />
            </div>
            
            {/* Search Bar */}
            {showSearch && (
              <div className="flex-shrink-0 lg:max-w-md lg:w-full">
                <div className="flex">
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
                         setIsSearchActive(false);
                       }
                    }}
                    onFocus={() => {
                      // Restore previous search if user clicks back into search bar
                      if (savedSearchQuery && !searchQuery) {
                        setSearchQuery(savedSearchQuery);
                        setTimeout(() => handleSearch(), 100);
                      }
                    }}
                    className="rounded-r-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    className="rounded-l-none"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs - ALWAYS STICKY */}
      <div className={`sticky ${isScrollingDown ? 'top-0' : 'top-[88px]'} z-40 bg-background border-b shadow-sm transition-all duration-300`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap min-w-fit transition-all duration-200"
                  onClick={() => {
                    const currentTab = collectionsConfig?.tabs?.[index];
                    console.log(`🔄 SWITCHING TO TAB ${index}: ${currentTab?.name || tab.title} (${currentTab?.collection_handle || tab.handle})`);
                    setSelectedCategory(index);
                    // When user clicks tab, clear search results but preserve search query
                    setSearchProducts([]);
                    setIsSearchActive(false);
                    // DO NOT clear search query - keep it for when user returns to search
                    // NO AUTO-SCROLL - User stays at current position
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
                onClick={onOpenCart}
                className="whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cartItemCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 pb-20 lg:pb-8">
        {/* Show search results when user is actively searching, otherwise show tab products */}
        {isSearchActive && searchQuery && searchProducts.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Search Results ({searchProducts.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {searchProducts.map((product) => {
                const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                const { cleanTitle, packageSize } = parseProductTitle(product.title);
                return (
                  <div key={product.id} className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in">
                    <div className="aspect-square relative overflow-hidden">
                      <OptimizedImage
                        src={product.image}
                        alt={cleanTitle}
                        className="w-full h-full object-cover hover-scale"
                      />
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="space-y-1 text-center">
                        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                          {cleanTitle}
                        </h3>
                        {packageSize && (
                          <p className="text-xs text-muted-foreground">
                            {packageSize}
                          </p>
                        )}
                      </div>
                      
                      {/* Price and Add to Cart - Centered */}
                      <div className="flex flex-col items-center space-y-2">
                        <span className="font-bold text-primary text-lg">
                          ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-muted rounded-md p-1 w-full max-w-[120px]">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-medium px-2">{quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
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
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">📦</div>
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-6">
              Collection "{currentCollectionHandle}" has no products yet.
            </p>
            <Button onClick={refreshProducts} variant="outline">
              Refresh Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {displayProducts.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
              const { cleanTitle, packageSize } = parseProductTitle(product.title);
              
              return (
                <div key={product.id} className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in">
                  <div className="aspect-square relative overflow-hidden">
                    <OptimizedImage
                      src={product.image}
                      alt={cleanTitle}
                      className="w-full h-full object-cover hover-scale"
                    />
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Product Title */}
                    <div className="space-y-1 text-center">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                        {cleanTitle}
                      </h3>
                      {packageSize && (
                        <p className="text-xs text-muted-foreground">
                          {packageSize}
                        </p>
                      )}
                    </div>

                    {/* Price and Add to Cart - Centered */}
                    <div className="flex flex-col items-center space-y-2">
                      <span className="font-bold text-primary text-lg">
                        ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                      </span>
                      
                      {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-muted rounded-md p-1 w-full max-w-[120px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold min-w-[2rem] text-center">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Bottom Cart Bar */}
        <MobileBottomCartBar 
          cartItemCount={cartItemCount}
          onOpenCart={() => onOpenCart && onOpenCart()}
        />
      </div>
    </div>
  );
};

export default ProductCategories;