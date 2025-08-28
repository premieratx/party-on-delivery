import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, Filter } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { useToast } from '@/hooks/use-toast';
import { useSearchInterface } from '@/hooks/useSearchInterface';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterCategory {
  id: string;
  name: string;
  handle: string;
  productCount: number;
}

export const SearchPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  
  const isMobile = useIsMobile();
  const { 
    searchInputRef, 
    handleSearchFocus, 
    handleSearchBlur, 
    isSearchFocused,
    shouldHideChrome,
    shouldHideBottomMenu 
  } = useSearchInterface();

  const handleBack = () => {
    const referrer = localStorage.getItem('deliveryAppReferrer') || '/';
    navigate(referrer);
  };

  const handleAddToCart = (product: any) => {
    const firstVariant = product.variants?.[0];
    const cartItem = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: firstVariant?.price || product.price || 0,
      image: product.image || '',
      variant: firstVariant?.id ? String(firstVariant.id) : 'default'
    };
    
    console.log('🛒 Adding to cart from search:', cartItem);
    addToCart(cartItem);
    toast({
      title: "Added to Cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const normalizedProductId = String(productId);
    const normalizedVariantId = variantId ? String(variantId) : undefined;
    
    const currentQty = getCartItemQuantity(normalizedProductId, normalizedVariantId);
    const newQty = Math.max(0, currentQty + delta);
    
    const product = searchResults.find(p => String(p.id) === normalizedProductId);
    if (!product) return;

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
    
    updateQuantity(normalizedProductId, normalizedVariantId, newQty, cartItem);
  };

  // Load filter categories on mount
  useEffect(() => {
    const loadFilterCategories = async () => {
      try {
        const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
        
        if (error) throw error;
        
        const collections = collectionsData?.collections || [];
        
        // Define major categories with their handles and friendly names
        const majorCategories = [
          { handle: 'spirits', name: 'Spirits', priority: 1 },
          { handle: 'mixers-non-alcoholic', name: 'Mixers', priority: 2 },
          { handle: 'tailgate-beer', name: 'Beer', priority: 3 },
          { handle: 'seltzers-wine-champagne', name: 'Wine & Champagne', priority: 4 },
          { handle: 'cocktail-kits', name: 'Cocktail Kits', priority: 5 },
          { handle: 'bourbon-rye', name: 'Bourbon & Whiskey', priority: 6 },
          { handle: 'gin-rum', name: 'Gin & Rum', priority: 7 },
          { handle: 'tequila-mezcal', name: 'Tequila & Mezcal', priority: 8 },
          { handle: 'all-party-supplies', name: 'Party Supplies', priority: 9 },
          { handle: 'drinkware-bartending-tools', name: 'Bar Tools', priority: 10 }
        ];

        // Map collections to our major categories
        const categoryMap = new Map(collections.map((c: any) => [c.handle, c]));
        
        const availableCategories: FilterCategory[] = majorCategories
          .map(category => {
            const collection = categoryMap.get(category.handle);
            return collection ? {
              id: category.handle,
              name: category.name,
              handle: category.handle,
              productCount: (collection as any).products?.length || (collection as any).productCount || 0
            } : null;
          })
          .filter((cat): cat is FilterCategory => cat !== null)
          .sort((a, b) => b.productCount - a.productCount) // Sort by product count
          .slice(0, 10); // Top 10 categories

        setFilterCategories(availableCategories);
      } catch (error) {
        console.error('Failed to load filter categories:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterCategories();
  }, []);

  // Real-time hierarchical search with category filtering
  const handleSearch = useCallback(async (filterOverride?: string) => {
    const currentFilter = filterOverride ?? selectedFilter;
    // Handle filter-only searches (no search query)
    if (!searchQuery.trim() && currentFilter === 'all') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // First sync products to hierarchical categories
      const { error: syncError } = await supabase.rpc('sync_shopify_to_hierarchical_categories');
      if (syncError) console.warn('Sync warning:', syncError);

      let searchResults: any[];
      let error: any = null;

      if (searchQuery.trim()) {
        // Use hierarchical search function for text queries
        const { data, error: searchError } = await supabase.rpc('hierarchical_product_search', {
          search_query: searchQuery,
          max_results: 100
        });
        searchResults = data || [];
        error = searchError;
      } else if (currentFilter !== 'all') {
        // Category-only filter - get products from collection
        const { data: response, error: collectionError } = await supabase.functions.invoke('instant-product-cache', {
          body: { 
            collection_handle: currentFilter,
            force_refresh: false
          }
        });
        
        if (collectionError) {
          error = collectionError;
          searchResults = [];
        } else {
          // Convert to hierarchical search format
          searchResults = (response?.products || []).map((product: any) => ({
            product_id: String(product.id),
            product_title: product.title,
            product_handle: product.handle,
            product_type: product.product_type,
            vendor: product.vendor,
            collections: product.collections || [],
            categories: [],
            tags: product.tags || [],
            relevance_score: 1.0,
            match_type: 'category_filter'
          }));
        }
      } else {
        searchResults = [];
      }

      if (error) throw error;

      // Convert results to match existing format
      let formattedResults = (searchResults || []).map((result: any) => ({
        id: result.product_id,
        title: result.product_title,
        handle: result.product_handle,
        product_type: result.product_type,
        vendor: result.vendor,
        collections: result.collections,
        categories: result.categories,
        tags: result.tags,
        relevance_score: result.relevance_score,
        match_type: result.match_type,
        // Get additional product data from cache for pricing and images
        price: 0, // Will be populated from cache
        image: '', // Will be populated from cache
        variants: [] // Will be populated from cache
      }));

      // Apply category filter to search results if both search and filter are active
      if (searchQuery.trim() && currentFilter !== 'all') {
        formattedResults = formattedResults.filter(result => 
          result.collections?.includes(currentFilter)
        );
      }

      // Enhance with cached product data for pricing and images
      if (formattedResults.length > 0) {
        const { data: cachedProducts, error: cacheError } = await supabase
          .from('shopify_products_cache')
          .select('*')
          .in('id', formattedResults.map(r => r.id)); // Keep as strings

        if (!cacheError && cachedProducts) {
          const productMap = new Map(cachedProducts.map(p => [p.id.toString(), p]));
          
          formattedResults.forEach(result => {
            const cached = productMap.get(result.id);
            if (cached) {
              result.price = cached.price || 0;
              result.image = cached.image || '';
              result.variants = Array.isArray(cached.variants) ? cached.variants : [];
            }
          });
        }
      }

      const searchType = searchQuery.trim() ? 'SEARCH' : 'FILTER';
      const searchTerm = searchQuery.trim() || `[${currentFilter}]`;
      console.log(`🔍 ${searchType}: Found ${formattedResults.length} products for "${searchTerm}"`);
      formattedResults.slice(0, 5).forEach(r => console.log(`  - ${r.title} (${r.match_type})`));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Hierarchical search error:', error);
      
      // Fallback to original search method
      try {
        const { data: response, error: fallbackError } = await supabase.functions.invoke('instant-product-cache', {
          body: { 
            collection_handle: 'all',
            force_refresh: false
          }
        });

        if (fallbackError) throw fallbackError;

        const allProducts = response?.products || [];
        
        // Use SearchOptimizer as fallback
        const searchIndex = allProducts.length > 0 
          ? SearchOptimizer.buildSearchIndex(allProducts, 'global-search')
          : [];
          
        const results = searchIndex.length > 0
          ? SearchOptimizer.searchProductsWithHierarchy(searchQuery, searchIndex, 100)
          : [];

        console.log(`🔍 FALLBACK SEARCH: Found ${results.length} products for "${searchQuery}"`);
        setSearchResults(results);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        setSearchResults([]);
        toast({
          title: "Search Error",
          description: "Failed to search products. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedFilter, toast]);

  // Real-time search with category filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery?.trim() || selectedFilter !== 'all') {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Small debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedFilter, handleSearch]);

  // Handle filter change
  const handleFilterChange = (filterValue: string) => {
    setSelectedFilter(filterValue);
    // Immediately search with new filter
    handleSearch(filterValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Search Products</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart ({getTotalItems()})
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search All Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="text-lg pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Categories - Hide on mobile when search is focused */}
        {!(isMobile && isSearchFocused) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingFilters ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs value={selectedFilter} onValueChange={handleFilterChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 h-auto p-1">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    All
                  </TabsTrigger>
                  {filterCategories.slice(0, 10).map((category) => (
                    <TabsTrigger 
                      key={category.id}
                      value={category.handle}
                      className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col items-center gap-1"
                    >
                      <span className="line-clamp-1">{category.name}</span>
                      <span className="text-xs opacity-70">({category.productCount})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </CardContent>
        </Card>
        )}

        {/* Search Results */}
        {isSearching ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching products...</p>
            </CardContent>
          </Card>
        ) : searchQuery.trim() || selectedFilter !== 'all' ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {searchQuery.trim() ? 'Search Results' : 'Category Products'} ({searchResults.length})
              {selectedFilter !== 'all' && (
                <span className="text-sm text-muted-foreground ml-2">
                  • {filterCategories.find(c => c.handle === selectedFilter)?.name}
                </span>
              )}
            </h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {searchResults.map((product) => {
                  const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                  const { cleanTitle, packageSize } = parseProductTitle(product.title);
                  
                  return (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col h-full cursor-pointer"
                  onClick={(e) => {
                    // Prevent navigation if clicking on buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      e.stopPropagation();
                      return;
                    }
                    // Just add to cart on click, don't navigate away
                    handleAddToCart(product);
                  }}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <OptimizedImage
                      src={product.image}
                      alt={cleanTitle}
                      className="w-full h-full object-cover hover-scale"
                    />
                  </div>
                  <CardContent className="p-3 flex flex-col flex-1 justify-between space-y-3">
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
                            <div className="flex items-center justify-between bg-muted rounded-md p-1 w-full max-w-[120px]">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product.id, product.variants?.[0]?.id, -1);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-medium px-2">{quantity}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product.id, product.variants?.[0]?.id, 1);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className="w-full text-xs"
                            >
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery.trim() 
                      ? `No products found for "${searchQuery}". Try different keywords or select a category filter.`
                      : `No products found in this category. Try a different filter or search term.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
              <p className="text-muted-foreground">
                Enter a search term or select a category filter to find products across all delivery apps.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchPage;