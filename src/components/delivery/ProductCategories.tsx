import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { LazyImage } from '@/components/common/LazyImage';
import { PullToRefreshIndicator } from '@/components/common/PullToRefreshIndicator';
import { ProductLoadError } from '@/components/common/ProductLoadError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

import { OccasionButtons } from '@/components/delivery/OccasionButtons';
import { CombinedSearchTabs } from '@/components/delivery/CombinedSearchTabs';
import { parseProductTitle } from '@/utils/productUtils';
import { SwipeUpNavigation } from '@/components/common/SwipeUpNavigation';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useProductPreloader } from '@/hooks/useProductPreloader';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { ProductLightbox } from '@/components/delivery/ProductLightbox';
// Removed ultraFastSearch - using optimizedUltraFastSearch only
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { UniversalQuantityControls } from '@/components/common/UniversalQuantityControls';
import { useRealTimeSearch } from '@/hooks/useRealTimeSearch';
import { useImmediateKeyboardHiding } from '@/hooks/useImmediateKeyboardHiding';
import { useUnifiedScrollBehavior } from '@/hooks/useUnifiedScrollBehavior';
import bgImage from '@/assets/old-fashioned-bg.jpg';
import { syncCollectionOrders } from '@/utils/syncCollectionOrders';
import { useDeliveryAppOptimizer } from '@/hooks/useDeliveryAppOptimizer';
// Removed UltraAggressivePerformanceMonitor - using simplified monitoring

interface ProductCategoriesProps {
  appName?: string;
  heroHeading?: string;
  heroSubheading?: string;
  logoUrl?: string;
  appConfig?: any; // App configuration including hero_config
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
  appConfig,
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
  maxProducts = 1000,
  forceRefresh = false,
  onCheckout
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Preload background image for instant display
  const { loaded: bgImageLoaded } = useImagePreloader(bgImage, { priority: true });
  
  // Preload logo if provided
  const { loaded: logoLoaded } = useImagePreloader(logoUrl);

  // Remove excessive logging - image loading works silently

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity, getTotalPrice, getTotalItems } = useUnifiedCart();
  const { isScrollingDown } = useScrollHeader({ threshold: 100 });
  const { preloadMultipleCollections } = useProductPreloader();
  const { triggerCartFeedback } = useHapticFeedback();
  
  
  // ONLY use Shopify collections from delivery app config - NO defaults
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs && collectionsConfig.tabs.length > 0) {
      console.log('📋 Loading delivery app tabs with Shopify collections:', collectionsConfig.tabs);
      return collectionsConfig.tabs.map((tab, index) => {
        return {
          id: tab.collection_handle || `tab-${index}`,
          title: tab.name || `Tab ${index + 1}`,
          handle: tab.collection_handle,
          icon: '', // No icons to prevent overlap
          isSearch: false
        };
      });
    }
    
    console.log('❌ No delivery app configuration found - cannot load tabs');
    return [];
  }, [collectionsConfig]);

  // ADDITIVE: Ultra-aggressive optimizer for sub-0.2s loading (moved after tabs definition)
  const deliveryOptimizer = useDeliveryAppOptimizer({
    collections_config: tabs.map(tab => ({
      title: tab.title,
      handle: tab.handle,
      isSearch: tab.isSearch
    }))
  });

  // Use both keyboard hiding and unified scroll behavior
  const { hideKeyboard: forceHideKeyboard } = useImmediateKeyboardHiding();
  const { 
    getStickyBehavior, 
    shouldCondense, 
    isMobile,
    hideKeyboard: unifiedHideKeyboard 
  } = useUnifiedScrollBehavior({
    hideKeyboardOnScroll: true,
    mobileSticky: 'auto',
    threshold: 100
  });
  
  // Pull-to-refresh functionality
  const { 
    isPulling, 
    pullDistance, 
    isRefreshing, 
    elementRef: pullToRefreshRef,
    shouldTrigger 
  } = usePullToRefresh({
    onRefresh: async () => {
      await refreshProducts();
      triggerCartFeedback('update');
    },
    enabled: true
  });
  
  // Set up search variables
  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  // Get current tab config first
  const currentTabConfig = collectionsConfig?.tabs?.[selectedCategory];
  const currentCollectionHandle = currentTabConfig?.collection_handle;
  
  // Load products for current collection directly from Shopify collections
  const { products: currentTabProducts, collections, loading, error, refreshProducts } = useOptimizedProductLoader({
    collection_handle: currentCollectionHandle,
    use_type: 'delivery'
  });

  // Real-time search functionality restored
  const {
    searchResults: searchProducts,
    isSearching,
    updateSearchQuery,
    clearSearch: clearUniversalSearch
  } = useRealTimeSearch({ debounceMs: 300, maxResults: 50 });

  // Sync search query with real-time search
  useEffect(() => {
    updateSearchQuery(searchQuery);
  }, [searchQuery, updateSearchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;


  // SMART LOADING: Only preload the active tab, others load on-demand
  useEffect(() => {
    const activeTab = tabs[selectedCategory];
    if (activeTab?.handle && !currentTabProducts?.length) {
      console.log(`🎯 SMART PRELOAD: Loading only active tab "${activeTab.title}"`);
      // The useOptimizedProductLoader will handle loading the current collection
    }
  }, [selectedCategory, tabs, currentTabProducts]);


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
    console.log('🔍 Filtering products for collection:', currentCollectionHandle);
    console.log('📦 Raw products available:', currentTabProducts?.length || 0);
    
    // Always return stable empty array if no data
    if (!currentCollectionHandle || !currentTabProducts?.length) {
      console.log('❌ No collection handle or products available');
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
    
    console.log('✅ Stable products created:', stableProducts.length);
    
    // For delivery collections, products should already be filtered by the hook
    // Just return the stable products without additional filtering
    const result = stableProducts.slice(0, maxProducts);
    console.log('🎯 Final products to display:', result.length);
    
    return result;
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
    triggerCartFeedback('add');
    
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
    triggerCartFeedback(newQty > currentQty ? 'add' : 'remove');
  }, [currentTabProducts, searchProducts, getCartItemQuantity, updateQuantity]);

  // Parse hero_config if available
  const heroConfig = appConfig?.hero_config ? 
    (typeof appConfig.hero_config === 'string' ? 
      JSON.parse(appConfig.hero_config) : appConfig.hero_config) : {};

  // Also check main_app_config for styling (backward compatibility)
  const mainConfig = appConfig?.main_app_config || {};

  // Debug styling data - REMOVED to clean console

  // Helper function to generate responsive text styles
  const getResponsiveTextStyle = (type: 'headline' | 'subheadline' | 'scrollingText') => {
    const config = heroConfig[`${type}Style`] || {};
    // Check both hero_config and main_app_config for styling
    const color = heroConfig[`${type}Color`] || 
                 mainConfig[`${type}_color`] || 
                 (type === 'headline' ? '#FFFFFF' : type === 'subheadline' ? '#E2E8F0' : '#FBBF24');
    const font = heroConfig[`${type}Font`] || 
                mainConfig[`${type}_font`] || 
                'Inter';
    const size = heroConfig[`${type}Size`] || 
                mainConfig[`${type}_size`] || 
                (type === 'headline' ? 48 : type === 'subheadline' ? 24 : 16);

    const finalStyle = {
      color,
      fontFamily: font,
      fontSize: `clamp(${size * 0.6}px, ${size * 0.8}vw, ${size}px)`, // Responsive sizing
      fontWeight: config.bold ? 'bold' : 'normal',
      fontStyle: config.italic ? 'italic' : 'normal',
      textDecoration: config.underlined ? 'underline' : 'none',
      lineHeight: type === 'headline' ? '1.1' : '1.5'
    };

    // Debug styling - REMOVED to clean console
    return finalStyle;
  };

  return (
    <div 
      ref={pullToRefreshRef}
      className="min-h-screen bg-background pb-20 lg:pb-8"
    >
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={80}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      {/* Hero Section with Enhanced Responsive Design */}
      <div 
        className={`relative min-h-[70vh] overflow-hidden bg-cover bg-center bg-no-repeat transition-opacity duration-300 ${
          bgImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          backgroundImage: heroConfig.backgroundUrl ? `url(${heroConfig.backgroundUrl})` : `url(${bgImage})`,
          minHeight: 'clamp(500px, 70vh, 800px)' // Responsive height
        }}
      >
        {/* Loading fallback with solid color background */}
        {!bgImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
        )}
        
        {/* Video Background */}
        {heroConfig.backgroundType === 'video' && heroConfig.backgroundUrl && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            src={heroConfig.backgroundUrl}
          />
        )}
        
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content - Responsive Flexbox Layout */}
        <div className="relative z-10 flex flex-col h-full text-center px-4 py-8 sm:py-12 lg:py-16">
          {/* Logo */}
          {(heroConfig.logoUrl || logoUrl) && (
            <div 
              className="flex-shrink-0 mb-4 sm:mb-6 lg:mb-8"
              style={{
                transform: `translateY(${(heroConfig.logoVerticalPosition || 0) * 0.8}px)`
              }}
            >
              <img 
                src={heroConfig.logoUrl || logoUrl} 
                alt={appName}
                className="mx-auto transition-opacity duration-300"
                style={{
                  height: `clamp(${(heroConfig.logoSize || mainConfig.logo_size || 64) * 0.5}px, ${(heroConfig.logoSize || mainConfig.logo_size || 64) * 0.8}vw, ${heroConfig.logoSize || mainConfig.logo_size || 64}px)`,
                  maxWidth: '80%',
                  objectFit: 'contain',
                  opacity: logoLoaded ? 1 : 0
                }}
              />
            </div>
          )}
          
          {/* Content Container - Flex Grow */}
          <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto">
            
            {/* Headline */}
            <h1 
              className="mb-4 sm:mb-6 leading-tight"
              style={{
                ...getResponsiveTextStyle('headline'),
                transform: `translateY(${(heroConfig.headlineVerticalPosition || 0) * 0.8}px)`
              }}
            >
              {heroHeading}
            </h1>
            
            {/* Sub-headline */}
            {heroSubheading && (
              <p 
                className="mb-6 sm:mb-8 leading-relaxed"
                style={{
                  ...getResponsiveTextStyle('subheadline'),
                  transform: `translateY(${(heroConfig.subheadlineVerticalPosition || 0) * 0.8}px)`
                }}
              >
                {heroSubheading}
              </p>
            )}
          </div>
          
          {/* Scrolling Text - Always at Bottom */}
          {heroConfig.scrollingText && (
            <div 
              className="flex-shrink-0 mt-4 sm:mt-6 lg:mt-8"
              style={{
                transform: `translateY(${(heroConfig.scrollingTextVerticalPosition || 0) * 0.8}px)`
              }}
            >
              <div 
                className="overflow-hidden whitespace-nowrap"
                style={getResponsiveTextStyle('scrollingText')}
              >
                <div 
                  className="inline-block animate-marquee"
                  style={{
                    animation: `marquee ${heroConfig.scrollingTextSpeed || 10}s linear infinite`
                  }}
                >
                  {heroConfig.scrollingText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combined Search and Tabs with Cart & Checkout */}
      <CombinedSearchTabs
        tabs={tabs}
        selectedCategory={selectedCategory}
        onTabSelect={(index) => {
          const selectedTab = tabs[index];
          console.log(`🎯 TAB SWITCH: "${selectedTab?.title}" - Products will load on-demand`);
          setSelectedCategory(index);
          clearUniversalSearch();
        }}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
        }}
        onSearchSubmit={() => {}}
        showSearch={showSearch}
        isSearchActive={isSearchActive}
        onSearchActiveChange={() => {}}
        isSearching={isSearching}
        cartItemCount={getTotalItems()}
        totalAmount={getTotalPrice()}
        onOpenCart={onOpenCart}
        onCheckout={onProceedToCheckout || onCheckout}
      />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 pb-32 lg:pb-24">
        {/* Real-time search results restored */}
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
                      <LazyImage
                        src={product.image}
                        alt={cleanTitle}
                        className="w-full h-full object-cover hover-scale"
                        priority={false}
                        quality={85}
                        width={300}
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
                           <div className="flex items-center justify-center bg-muted rounded-full p-0.5 w-full max-w-[75px] mx-auto" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0 flex-shrink-0 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product.id, product.variants?.[0]?.id, -1);
                                  if (onUpdateQuantity) {
                                    onUpdateQuantity(product.id, product.variants?.[0]?.id, Math.max(0, quantity - 1));
                                  }
                                }}
                              >
                              <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
                            </Button>
                            <span className="font-semibold text-xs flex-1 text-center min-w-[16px]">
                              {quantity}
                            </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0 flex-shrink-0 rounded-full hover:bg-primary hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product.id, product.variants?.[0]?.id, 1);
                                  if (onUpdateQuantity) {
                                    onUpdateQuantity(product.id, product.variants?.[0]?.id, quantity + 1);
                                  }
                                }}
                              >
                              <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                            </Button>
                          </div>
                         ) : (
                           <Button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleAddToCart(product);
                             }}
                             className="w-7 h-7 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in mx-auto"
                           >
                            <Plus className="w-3 h-3" />
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
                      {product.image ? (
                        <LazyImage
                          src={product.image}
                          alt={cleanTitle}
                          className="w-full h-full object-cover hover-scale"
                          priority={false}
                          quality={85}
                          width={300}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No Image</span>
                        </div>
                      )}
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
                          <div className="flex items-center justify-center bg-muted rounded-full p-0.5 w-full max-w-[75px] mx-auto" onClick={(e) => e.stopPropagation()}>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-5 w-5 p-0 flex-shrink-0 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, -1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, Math.max(0, quantity - 1));
                                 }
                               }}
                             >
                             <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
                           </Button>
                           <span className="font-semibold text-xs flex-1 text-center min-w-[16px]">
                             {quantity}
                           </span>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-5 w-5 p-0 flex-shrink-0 rounded-full hover:bg-primary hover:text-primary-foreground"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleQuantityChange(product.id, product.variants?.[0]?.id, 1);
                                 if (onUpdateQuantity) {
                                   onUpdateQuantity(product.id, product.variants?.[0]?.id, quantity + 1);
                                 }
                               }}
                             >
                             <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                           </Button>
                         </div>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="w-7 h-7 rounded-full bg-green-600 hover:bg-green-700 text-white p-0 animate-scale-in mx-auto"
                          >
                           <Plus className="w-3 h-3" />
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Swipe-up Navigation */}
      <SwipeUpNavigation
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
      />
        
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

      {/* CLEANUP COMPLETE: All performance monitoring removed to prevent system overload */}
    </div>
  );
};

export default ProductCategories;