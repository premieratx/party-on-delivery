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

import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import { CombinedSearchTabs } from '@/components/delivery/CombinedSearchTabs';
import { parseProductTitle } from '@/utils/productUtils';
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useProductPreloader } from '@/hooks/useProductPreloader';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { ProductLightbox } from '@/components/delivery/ProductLightbox';
import { ultraFastSearch } from '@/utils/ultraFastSearch';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import bgImage from '@/assets/old-fashioned-bg.jpg';

interface ProductCategoriesProps {
  appName?: string;
  heroHeading?: string;
  heroSubheading?: string;
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
  onCheckout?: () => void;
}

// NO DEFAULT COLLECTIONS - Only use actual Shopify collections from delivery app config

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  appName = "Austin's Premier Party Supply Delivery",
  heroHeading = "Austin's Premier Party Supply Delivery",
  heroSubheading = "Satisfaction Guaranteed, On-Time Delivery",
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
  forceRefresh = false,
  onCheckout
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false); // Track if user is actively searching
  const [savedSearchQuery, setSavedSearchQuery] = useState(''); // Persist search across tab switches
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Preload background image for instant display
  const { loaded: bgImageLoaded } = useImagePreloader(bgImage, { priority: true });
  
  // Preload logo if provided
  const { loaded: logoLoaded } = useImagePreloader(logoUrl);

  console.log(`🎯 ProductCategories: Background loaded: ${bgImageLoaded}, Logo loaded: ${logoLoaded}`);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity, getTotalPrice, getTotalItems } = useUnifiedCart();
  const { isScrollingDown } = useScrollHeader({ threshold: 100 });
  const { preloadMultipleCollections } = useProductPreloader();
  
  // Set up search variables
  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // ONLY use Shopify collections from delivery app config - NO defaults
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs && collectionsConfig.tabs.length > 0) {
      console.log('📋 Loading delivery app tabs with Shopify collections:', collectionsConfig.tabs);
      return collectionsConfig.tabs.map((tab, index) => {
        // Auto-assign relevant icons based on tab name if not provided
        let tabIcon = tab.icon;
        if (!tabIcon) {
          const name = tab.name?.toLowerCase() || '';
          if (name.includes('cocktail') || name.includes('drink') || name.includes('beverage')) tabIcon = '🍹';
          else if (name.includes('beer') || name.includes('ale') || name.includes('lager')) tabIcon = '🍺';
          else if (name.includes('wine') || name.includes('champagne')) tabIcon = '🍷';
          else if (name.includes('spirit') || name.includes('whiskey') || name.includes('vodka') || name.includes('rum')) tabIcon = '🥃';
          else if (name.includes('snack') || name.includes('food')) tabIcon = '🍿';
          else if (name.includes('ice') || name.includes('frozen')) tabIcon = '🧊';
          else if (name.includes('mixer') || name.includes('soda')) tabIcon = '🥤';
          else if (name.includes('party') || name.includes('celebration')) tabIcon = '🎉';
          else tabIcon = '📦';
        }
        
        return {
          id: tab.collection_handle || `tab-${index}`,
          title: tab.name || `Tab ${index + 1}`,
          handle: tab.collection_handle,
          icon: tabIcon,
          isSearch: false
        };
      });
    }
    
    console.log('❌ No delivery app configuration found - cannot load tabs');
    return [];
  }, [collectionsConfig]);

  // Preload all collections on mount + warm up ultra-fast search
  useEffect(() => {
    // Warm up ultra-fast search for instant results
    ultraFastSearch.warmUpCache().catch(console.error);
    
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

  // FIXED: Stable product filtering to prevent React error #310
  const displayProducts = useMemo(() => {
    // Always return stable empty array if no data
    if (!currentCollectionHandle || !currentTabProducts?.length) {
      return [];
    }
    
    // Create stable product list with guaranteed structure
    const stableProducts = currentTabProducts.map(product => {
      // Ensure each product has stable properties
      if (!product || typeof product !== 'object') return null;
      
      return {
        ...product,
        id: product.id || '',
        title: product.title || '',
        price: product.price || 0,
        image: product.image || '',
        collection_handles: product.collection_handles || []
      };
    }).filter(Boolean);
    
    // Safe filtering with guaranteed stable returns
    const filteredProducts = stableProducts.filter(product => {
      // Robust collection handle parsing
      let handles: string[] = [];
      try {
        const collectionData: any = product.collection_handles;
        if (Array.isArray(collectionData)) {
          handles = collectionData;
        } else if (typeof collectionData === 'string' && collectionData) {
          const parsed = JSON.parse(collectionData);
          handles = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.warn('Failed to parse collection handles for product:', product.id, error);
        handles = [];
      }
      
      return Array.isArray(handles) && handles.includes(currentCollectionHandle);
    });
    
    // Return stable slice
    return filteredProducts.slice(0, maxProducts);
  }, [currentTabProducts, currentCollectionHandle, maxProducts]);

  const currentTab = tabs[selectedCategory];
  const isCurrentlySearchTab = currentTab?.isSearch;

  const handleAddToCart = (product: any) => {
    // Normalize IDs and ensure consistency
    const normalizedProductId = String(product.id);
    const firstVariant = product.variants?.[0];
    const normalizedVariantId = firstVariant?.id ? String(firstVariant.id) : 'default';
    
    const cartItem = {
      id: normalizedProductId,
      title: product.title,
      name: product.title,
      price: firstVariant?.price || product.price || 0,
      image: product.image || '',
      variant: normalizedVariantId
    };
    
    console.log('🛒 ProductCategories: Adding to cart:', cartItem);
    addToCart(cartItem);
    
    // Also call parent handler if provided
    if (onAddToCart) {
      onAddToCart(cartItem);
    }
  };

  const handleQuantityChange = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    // Normalize IDs to ensure consistency
    const normalizedProductId = String(productId);
    const normalizedVariantId = variantId ? String(variantId) : undefined;
    
    const currentQty = getCartItemQuantity(normalizedProductId, normalizedVariantId);
    const newQty = Math.max(0, currentQty + delta);
    
    console.log('🛒 ProductCategories: handleQuantityChange', {
      productId: normalizedProductId,
      variantId: normalizedVariantId,
      currentQty,
      delta,
      newQty
    });
    
    // FIXED: Get product from source data (not displayProducts to avoid circular dependency)
    const product = [...(currentTabProducts || []), ...searchProducts].find(p => String(p.id) === normalizedProductId);
    
    if (!product) {
      console.error('🚫 Product not found for quantity change:', normalizedProductId);
      return;
    }
    
    const variant = normalizedVariantId 
      ? product.variants?.find((v: any) => String(v.id) === normalizedVariantId)
      : product.variants?.[0];
    
    const cartItem = {
      id: normalizedProductId,
      title: product.title,
      name: product.title,
      price: variant?.price || product.price || 0,
      image: product.image || '',
      variant: normalizedVariantId || 'default'
    };
    
    console.log('🛒 ProductCategories: Updating cart with:', cartItem);
    updateQuantity(normalizedProductId, normalizedVariantId, newQty, cartItem);
  }, [currentTabProducts, searchProducts, getCartItemQuantity, updateQuantity]);

  // Real-time hierarchical search using ultra-fast search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchProducts([]);
      setIsSearching(false);
      setIsSearchActive(false);
      return;
    }

    setIsSearching(true);
    setIsSearchActive(true);
    
    try {
      console.log(`🚀 ULTRA-FAST SEARCH: "${searchQuery}"`);
      const startTime = performance.now();
      
      // Use CATEGORY-GOVERNED search for consistent results
      const filteredProducts = currentTabProducts
        .map(product => {
          const lowerQuery = searchQuery.toLowerCase();
          const lowerCategory = (product.category || '').toLowerCase();
          const lowerTitle = product.title.toLowerCase();
          
          let score = 0;
          // CATEGORY GOVERNANCE - category matches trump everything else
          if (lowerCategory.includes(lowerQuery)) score = 1000;
          else if (lowerTitle.includes(lowerQuery)) score = 800;
           else if (Array.isArray(product.collection_handles) && 
                    product.collection_handles.some(c => String(c).toLowerCase().includes(lowerQuery))) score = 600;
          
          return score > 0 ? { ...product, _score: score } : null;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 50);
      
      const result = { products: filteredProducts, fromCache: true };

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ ULTRA-FAST SEARCH COMPLETED: "${searchQuery}" - ${result.products.length} results in ${duration.toFixed(2)}ms (${result.fromCache ? 'cached' : 'fresh'})`);
      
      setSearchProducts(result.products);
    } catch (error) {
      console.error('Ultra-fast search error:', error);
      setSearchProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);
  // Real-time search - no delay for instant results
  useEffect(() => {
    if (searchQuery?.trim()) {
      handleSearch();
    } else {
      setSearchProducts([]);
      setIsSearchActive(false);
    }
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Hero Section with Instant Loading Background Image */}
      <div 
        className={`relative h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat transition-opacity duration-300 ${
          bgImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Loading fallback with solid color background */}
        {!bgImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
        )}
        
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 max-w-4xl">
            {logoUrl && (
              <div className="mb-6">
                <img 
                  src={logoUrl} 
                  alt={appName} 
                  className={`h-16 mx-auto transition-opacity duration-300 ${
                    logoLoaded ? 'opacity-100' : 'opacity-0'
                  }`} 
                />
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
          const currentTab = collectionsConfig?.tabs?.[index];
          console.log(`🔄 SWITCHING TO TAB ${index}: ${currentTab?.name || tabs[index].title} (${currentTab?.collection_handle || tabs[index].handle})`);
          setSelectedCategory(index);
          setSearchProducts([]);
          setIsSearchActive(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setIsSearchActive(!!query.trim());
        }}
        onSearchSubmit={handleSearch}
        showSearch={showSearch}
        isSearchActive={isSearchActive}
        onSearchActiveChange={setIsSearchActive}
        isSearching={isSearching}
        cartItemCount={getTotalItems()}
        totalAmount={getTotalPrice()}
        onOpenCart={onOpenCart}
        onCheckout={onProceedToCheckout || onCheckout}
      />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 pb-32 lg:pb-24">
        {/* Show search results when user is actively searching, otherwise show tab products */}
        {isSearchActive && searchQuery && searchProducts.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Search Results ({searchProducts.length})</h3>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {searchProducts.map((product) => {
                const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                const { cleanTitle, packageSize } = parseProductTitle(product.title);
                 return (
                   <div 
                     key={product.id} 
                     className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col h-full cursor-pointer"
                     onClick={() => setSelectedProduct(product)}
                   >
                    <div className="aspect-square relative overflow-hidden">
                      <OptimizedImage
                        src={product.image}
                        alt={cleanTitle}
                        className="w-full h-full object-cover hover-scale"
                      />
                    </div>
                    <div className="p-3 flex flex-col flex-1 justify-between space-y-3">
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
                      
                      {/* Price and Add to Cart - Fixed at bottom */}
                      <div className="flex flex-col items-center space-y-2 mt-auto">
                        <span className="font-bold text-primary text-lg">
                          ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                        </span>
                         
                         {quantity > 0 ? (
                           <div className="flex items-center justify-center bg-muted rounded-md p-1 w-full max-w-[90px] mx-auto">
                              <Button
                               size="sm"
                               variant="ghost"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, -1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, Math.max(0, quantity - 1));
                                 }
                               }}
                               className="h-6 w-6 p-0 flex-shrink-0"
                             >
                               <Minus className="w-3 h-3" />
                             </Button>
                             <span className="font-medium px-1 text-sm flex-1 text-center min-w-0">{quantity}</span>
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, 1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, quantity + 1);
                                 }
                               }}
                               className="h-6 w-6 p-0 flex-shrink-0"
                             >
                               <Plus className="w-3 h-3" />
                             </Button>
                           </div>
                          ) : (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in mx-auto"
                            >
                             <Plus className="w-4 h-4" />
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
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {displayProducts.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
              const { cleanTitle, packageSize } = parseProductTitle(product.title);
              
               return (
                 <div 
                   key={product.id} 
                   className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col h-full cursor-pointer"
                   onClick={() => setSelectedProduct(product)}
                 >
                  <div className="aspect-square relative overflow-hidden">
                    <OptimizedImage
                      src={product.image}
                      alt={cleanTitle}
                      className="w-full h-full object-cover hover-scale"
                    />
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1 justify-between space-y-3">
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

                    {/* Price and Add to Cart - Fixed at bottom */}
                    <div className="flex flex-col items-center space-y-2 mt-auto">
                      <span className="font-bold text-primary text-lg">
                        ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                      </span>
                      
                       {quantity > 0 ? (
                          <div className="flex items-center justify-center bg-muted rounded-md p-1 w-full max-w-[90px] mx-auto" onClick={(e) => e.stopPropagation()}>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-6 w-6 p-0 flex-shrink-0"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, -1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, Math.max(0, quantity - 1));
                                 }
                               }}
                             >
                             <Minus className="w-3 h-3" />
                           </Button>
                           <span className="font-semibold text-sm flex-1 text-center min-w-0">
                             {quantity}
                           </span>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-6 w-6 p-0 flex-shrink-0"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, 1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, quantity + 1);
                                 }
                               }}
                             >
                             <Plus className="w-3 h-3" />
                           </Button>
                         </div>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in mx-auto"
                          >
                           <Plus className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Bottom Cart - Fixed button functionality */}
        {getTotalItems() > 0 && (
          <MobileBottomCartBar
            cartItemCount={getTotalItems()}
            totalAmount={getTotalPrice()}
            onOpenCart={() => {
              console.log('🛒 Mobile cart button clicked');
              if (onOpenCart) {
                onOpenCart();
              } else {
                // Fallback navigation to checkout
                navigate('/checkout');
              }
            }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          />
        )}
        
        {/* What's the Occasion? - HIDDEN as requested */}

        {/* Admin Dashboard Link */}
        <div className="mt-8 text-center pb-20 lg:pb-8">
          <Button 
            onClick={() => navigate('/admin')}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Product Lightbox */}
      {selectedProduct && (
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

export default ProductCategories;