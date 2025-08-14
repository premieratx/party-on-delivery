import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Plus, Minus, ShoppingCart, Loader2, RefreshCw, ChevronDown, Filter } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
  vendor?: string;
  variants?: any[];
  category?: string;
  tags?: string[];
  handle?: string;
  available?: boolean;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: Product[];
  image?: string;
}

interface ProductCategoriesProps {
  hideSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  customSiteSlug?: string;
  hideContent?: boolean;
}

const ProductCategories: React.FC<ProductCategoriesProps> = ({
  hideSearch = false,
  searchQuery: externalSearchQuery = '',
  onSearchQueryChange,
  customSiteSlug,
  hideContent = false
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Getting the best products for you');
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const isMobile = useIsMobile();

  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  const loadingMessages = [
    'Getting the best products for you',
    'Finding amazing deals',
    'Loading fresh inventory',
    'Curating top selections',
    'Preparing your favorites'
  ];

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    
    if (isLoading) {
      messageInterval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 2000);
    }

    return () => clearInterval(messageInterval);
  }, [isLoading]);

  const fetchCollections = useCallback(async (showRetryMessage = true) => {
    if (!isLoading && showRetryMessage) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('ProductCategories: Fetching collections...');
      
      let functionName = 'fetch-shopify-products-optimized';
      let body = {};
      
      if (customSiteSlug) {
        console.log(`Custom site detected: ${customSiteSlug}`);
        functionName = 'get-custom-site-collections';
        body = { siteSlug: customSiteSlug };
      }

      const { data: result, error: fetchError } = await supabase.functions.invoke(functionName, {
        body
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch data');
      }

      if (!result?.collections) {
        throw new Error('No collections data received');
      }

      let collectionsToShow = result.collections;
      
      if (customSiteSlug && result.customSiteCollections) {
        const customSiteCollections = result.customSiteCollections;
        collectionsToShow = result.collections.filter((collection: any) => 
          customSiteCollections.includes(collection.handle)
        );
        console.log(`Filtered to ${collectionsToShow.length} collections for custom site:`, customSiteCollections);
      }
      
      setCollections(collectionsToShow);
      setRetryCount(0);
      
    } catch (error: any) {
      console.error('Failed to fetch collections:', error);
      setError(error.message || 'Failed to load product collections. Please try again.');
      
      if (autoRetryEnabled && retryCount < 2) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`Auto-retry attempt ${retryCount + 1} in ${retryDelay}ms...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCollections(false);
        }, retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [customSiteSlug, autoRetryEnabled, retryCount]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const allProducts = collections.flatMap(collection => collection.products || []);
    
    return allProducts.filter(product => 
      product.title.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.vendor?.toLowerCase().includes(query) ||
      product.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, collections]);

  const currentCollection = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        id: 'search',
        title: 'Search Results',
        handle: 'search',
        description: `Showing results for "${searchQuery}"`,
        products: searchResults
      };
    }
    
    return collections[selectedCategory] || { id: '', title: '', handle: '', products: [] };
  }, [selectedCategory, collections, searchQuery, searchResults]);

  const handleProductClick = (product: Product) => {
    console.log('Product clicked:', product.title);
  };

  const handleAddToCart = useCallback((product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
        variant: product.variants?.[0]?.title || 'Default'
      };
      
      addToCart(cartItem);
      toast.success(`${product.title} added to cart!`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  }, [addToCart]);

  const handleQuantityChange = useCallback((product: Product, newQuantity: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        variant: product.variants?.[0]?.title || 'Default'
      };
      
      updateQuantity(cartItem, newQuantity);
      
      if (newQuantity === 0) {
        toast.success(`${product.title} removed from cart`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update cart');
    }
  }, [updateQuantity]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    setIsSearchFocused(false);
  };

  const CategoryTabs = () => (
    <div className="w-full">
      <div className={`sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md border-b transition-all duration-200`}>
        <div className={`w-full px-2 md:px-4 py-2`}>
          {!hideSearch && (
            <>
              {/* Mobile Cart/Checkout Row */}
              <div className="flex lg:hidden items-center justify-between gap-2 mb-2 h-10">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full pr-10 h-8 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      onClick={clearSearch}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Combined Cart/Search Row - Mobile Only */}
              <div className="flex lg:hidden items-center justify-between gap-2 mb-3">
                <div className={`flex flex-nowrap justify-center gap-px h-12 overflow-x-auto`}>
                  <button 
                    onClick={() => {}}
                    disabled={true}
                    className={`flex-1 bg-muted hover:bg-muted/70 text-foreground rounded-l-md text-xs font-bold px-3 flex items-center justify-center gap-2 transition-all duration-300 ${false ? 'animate-pulse' : ''}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Cart (0)</span>
                  </button>
                  <button 
                    onClick={() => {}}
                    disabled={true}
                    className={`hidden sm:flex items-center justify-center h-full transition-all duration-300 group flex-none sm:basis-20 px-2 rounded-r-md rounded-l-none ${false ? 'bg-success text-success-foreground hover:bg-success/90 checkout-blink' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  >
                    <span className="font-bold text-xs">Checkout</span>
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide">
            {collections.map((collection, index) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCategory(index)}
                className={`flex-1 min-w-0 px-1 lg:px-3 py-2 text-xs lg:text-sm font-bold transition-all duration-200 relative ${
                  selectedCategory === index
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  } ${
                    collections.length > 6 ? 'min-w-[120px] flex-shrink-0' : ''
                  }`}
              >
                <span className="truncate block" title={collection.title}>
                  {collection.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (hideContent) {
    return <CategoryTabs />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div 
            className={`p-2 rounded-full transition-colors ${
              retryCount > 0 
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' 
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className={`mt-3 text-center font-medium text-lg text-foreground leading-relaxed`}>
            {retryCount > 0 ? `Retry attempt ${retryCount}` : 'Getting the best products for you'}
          </div>
          <div className="text-sm text-muted-foreground">
            {loadingMessage}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full w-fit mx-auto">
            <X className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Unable to Load Products
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => fetchCollections()} 
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => setAutoRetryEnabled(!autoRetryEnabled)}
                variant="ghost"
                size="sm"
              >
                {autoRetryEnabled ? 'Disable' : 'Enable'} Auto-retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showSearchResults = searchQuery.trim() && searchResults.length > 0;
  const showNoResults = searchQuery.trim() && searchResults.length === 0;

  return (
    <div className="w-full">
      <CategoryTabs />
      
      <div className="container mx-auto px-2 lg:px-4 py-4">
        {showSearchResults && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Search Results for "{searchQuery}"</h2>
            {searchResults.map(product => (
              <div key={`container-${product.id}`} className="bg-muted/50 p-3 mx-2 mb-4 rounded-lg border-l-4 border-primary">
                <h3 className="font-semibold text-foreground text-sm mb-1">{product.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                  <Button size="sm" onClick={(e) => handleAddToCart(product, e)}>
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showSearchResults && (
          <>
            <div className={`px-2 lg:px-0`}>
              <div className="mb-4">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  {currentCollection.title}
                </h2>
                {currentCollection.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentCollection.description}
                  </p>
                )}
              </div>

              <div className={`grid gap-1.5 lg:gap-3 ${(selectedCategory === 0 || selectedCategory === 1 || selectedCategory === 3) ? 'grid-cols-3 lg:grid-cols-8' : 'grid-cols-3 lg:grid-cols-6'} ${showSearch && searchQuery.trim() ? 'hidden' : ''} ${isSearchFocused ? 'condensed-grid' : ''}`}>
                {currentCollection.products?.map((product) => {
                  const cartQuantity = getCartItemQuantity(product.id, product.variants?.[0]?.title);
                  
                  return (
                    <Card
                      key={product.id}
                      className={`bg-card border rounded-lg transition-all duration-200 flex flex-col h-full ${
                        !product.available ? 'opacity-50' : 'hover:shadow-md cursor-pointer'
                      } ${isSearchFocused ? 'p-2' : 'p-3'} hover:shadow-md`}
                      onClick={() => handleProductClick(product)}
                    >
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className={`bg-muted rounded overflow-hidden w-full aspect-square ${
                          isSearchFocused 
                            ? 'mb-1' 
                            : 'mb-2'
                        }`}>
                          <OptimizedImage
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <h3 className={`font-semibold text-foreground mb-1 ${isSearchFocused ? 'text-xs leading-tight' : 'text-sm'} line-clamp-2`}>
                            {product.title}
                          </h3>
                          
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold text-primary ${isSearchFocused ? 'text-xs' : 'text-sm'}`}>
                                ${product.price.toFixed(2)}
                              </span>
                              {product.vendor && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {product.vendor}
                                </Badge>
                              )}
                            </div>
                            
                            {product.available && (
                              <div className="w-full">
                                {cartQuantity > 0 ? (
                                  <div className="flex items-center justify-between gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => handleQuantityChange(product, cartQuantity - 1, e)}
                                      className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full`} 
                                    >
                                      <Minus className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                                    </Button>
                                    <span className={`text-xs font-bold ${isMobile ? 'px-1 min-w-[1.5rem]' : 'px-2 min-w-[2rem]'} text-center`}>
                                      {cartQuantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => handleQuantityChange(product, cartQuantity + 1, e)}
                                      className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} p-0 hover:bg-primary hover:text-primary-foreground rounded-full`} 
                                    >
                                      <Plus className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={(e) => handleAddToCart(product, e)}
                                    className={`w-full ${isSearchFocused ? 'h-6 text-xs' : 'h-7 text-xs'} font-medium`}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
        
        {showNoResults && (
          <div className="text-center py-12">
            <div className="space-y-4">
              <Search className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Products Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() 
                    ? `No products found for "${searchQuery}". Try a different search term.`
                    : 'No products available at the moment.'
                  }
                </p>
              </div>
              {searchQuery.trim() && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Products</DialogTitle>
            <DialogDescription>
              Filter products by category, price, or other criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Filter options will be added here
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCategories;