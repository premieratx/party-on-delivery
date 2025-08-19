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
import { CombinedSearchTabs } from '@/components/delivery/CombinedSearchTabs';
import { parseProductTitle } from '@/utils/productUtils';
import { MobileBottomCartBar } from '@/components/common/MobileBottomCartBar';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useProductPreloader } from '@/hooks/useProductPreloader';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { groupProductsByBaseName } from '@/utils/productGrouper';
import { GroupedProductCard } from '@/components/delivery/GroupedProductCard';
import '@/utils/fixProductOrdering'; // Auto-fix product ordering
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

// NO DEFAULT COLLECTIONS - Only use actual Shopify collections from delivery app config

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

  // ONLY use Shopify collections from delivery app config - NO defaults
  const tabs = useMemo(() => {
    if (collectionsConfig?.tabs && collectionsConfig.tabs.length > 0) {
      console.log('📋 Loading delivery app tabs with Shopify collections:', collectionsConfig.tabs);
      return collectionsConfig.tabs.map((tab, index) => ({
        id: tab.collection_handle || `tab-${index}`,
        title: tab.name || `Tab ${index + 1}`,
        handle: tab.collection_handle,
        icon: tab.icon || '📦',
        isSearch: false
      }));
    }
    
    console.log('❌ No delivery app configuration found - cannot load tabs');
    return [];
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
      if (belongsToCollection) {
        console.log(`✅ Product "${product.title}" belongs to collection "${currentCollectionHandle}"`);
      }
      return belongsToCollection;
    });
    
    // Group identical products for tab display too
    const groupedProducts = groupProductsByBaseName(strictlyFilteredProducts.slice(0, maxProducts));
    console.log(`📦 TAB ${selectedCategory} (${currentCollectionHandle}): Showing ${groupedProducts.length} grouped products from ${strictlyFilteredProducts.length} total`);
    return groupedProducts;
  }, [currentTabProducts, currentCollectionHandle, maxProducts, selectedCategory]);

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
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
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
    
    // Find product from current display (either tab products or search results)
    // For grouped products, we need to look in the originalProducts array
    let product = null;
    
    // Check display products (grouped)
    for (const groupedProduct of displayProducts) {
      if (groupedProduct.originalProducts) {
        product = groupedProduct.originalProducts.find(p => String(p.id) === normalizedProductId);
        if (product) break;
      } else if (String(groupedProduct.id) === normalizedProductId) {
        product = groupedProduct;
        break;
      }
    }
    
    // Check search products (grouped) if not found
    if (!product) {
      for (const groupedProduct of searchProducts) {
        if (groupedProduct.originalProducts) {
          product = groupedProduct.originalProducts.find(p => String(p.id) === normalizedProductId);
          if (product) break;
        } else if (String(groupedProduct.id) === normalizedProductId) {
          product = groupedProduct;
          break;
        }
      }
    }
    
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
  };

  // Real-time hierarchical search using SearchOptimizer
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
      // Get all products for search using instant cache
      const { data: response, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { 
          collection_handle: 'all',
          force_refresh: false
        }
      });

      if (error) throw error;

      const allProducts = response?.products || [];
      
      // Use SearchOptimizer for hierarchical search: Product Name > Collection > Category > Product Type
      const searchIndex = allProducts.length > 0 
        ? SearchOptimizer.buildSearchIndex(allProducts, 'delivery-search')
        : [];
        
      const results = searchIndex.length > 0
        ? SearchOptimizer.searchProductsWithHierarchy(searchQuery, searchIndex, 50)
        : [];

      // Group identical products into variants
      const groupedResults = groupProductsByBaseName(results);
      console.log(`🔍 DELIVERY HIERARCHICAL SEARCH: Found ${results.length} products, grouped into ${groupedResults.length} cards for "${searchQuery}"`);
      setSearchProducts(groupedResults);
    } catch (error) {
      console.error('Search error:', error);
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

      {/* Combined Search and Tabs */}
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
      />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 pb-32 lg:pb-24">
        {/* Show search results when user is actively searching, otherwise show tab products */}
        {isSearchActive && searchQuery && searchProducts.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Search Results ({searchProducts.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {searchProducts.map((groupedProduct) => (
                <GroupedProductCard
                  key={groupedProduct.id}
                  groupedProduct={groupedProduct}
                  getCartItemQuantity={getCartItemQuantity}
                  onAddToCart={handleAddToCart}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
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
            {displayProducts.map((groupedProduct) => (
              <GroupedProductCard
                key={groupedProduct.id}
                groupedProduct={groupedProduct}
                getCartItemQuantity={getCartItemQuantity}
                onAddToCart={handleAddToCart}
                onQuantityChange={handleQuantityChange}
              />
            ))}
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