import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Plus, Minus, ShoppingCart, RefreshCw } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const isMobile = useIsMobile();

  const searchQuery = onSearchQueryChange ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  const fetchCollections = useCallback(async () => {
    setError(null);
    
    try {
      console.log('Loading collections with forceRefresh: false');
      
      let functionName = 'get-all-collections';
      let body = {};
      
      if (customSiteSlug) {
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

      console.log('Collections response:', { data: result, error: null });

      let collectionsToShow = result.collections || [];
      
      if (customSiteSlug && result.customSiteCollections) {
        const customSiteCollections = result.customSiteCollections;
        collectionsToShow = collectionsToShow.filter((collection: any) => 
          customSiteCollections.includes(collection?.handle)
        );
      }
      
      // Ensure all collections and products have valid structure
      const validCollections = collectionsToShow
        .filter((collection: any) => collection && collection.id && collection.title)
        .map((collection: any) => ({
          id: collection.id || '',
          title: collection.title || '',
          handle: collection.handle || '',
          description: collection.description || '',
          products: Array.isArray(collection.products) 
            ? collection.products.filter(p => p && p.id && p.title)
            : [],
          image: collection.image
        }));
      
      console.log(`Processed collections: ${validCollections.length}`);
      setCollections(validCollections);
      setRetryCount(0);
      
    } catch (error: any) {
      console.error('Failed to fetch collections:', error);
      setError(error.message || 'Failed to load product collections. Please try again.');
      
      if (retryCount < 2) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCollections();
        }, retryDelay);
      }
    }
  }, [customSiteSlug, retryCount]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Safe search results with proper validation
  const searchResults = useMemo(() => {
    if (!searchQuery?.trim()) return [];
    if (!Array.isArray(collections)) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const allProducts: Product[] = [];
    
    for (const collection of collections) {
      if (collection && Array.isArray(collection.products)) {
        for (const product of collection.products) {
          if (product && product.id && product.title) {
            allProducts.push(product);
          }
        }
      }
    }
    
    return allProducts.filter(product => {
      if (!product || !product.title) return false;
      
      const titleMatch = product.title.toLowerCase().includes(query);
      const descMatch = product.description?.toLowerCase().includes(query) || false;
      const vendorMatch = product.vendor?.toLowerCase().includes(query) || false;
      const tagMatch = Array.isArray(product.tags) 
        ? product.tags.some(tag => tag?.toLowerCase().includes(query))
        : false;
      
      return titleMatch || descMatch || vendorMatch || tagMatch;
    });
  }, [searchQuery, collections]);

  // Safe current collection with proper validation
  const currentCollection = useMemo(() => {
    if (searchQuery?.trim()) {
      return {
        id: 'search',
        title: 'Search Results',
        handle: 'search',
        description: `Showing results for "${searchQuery}"`,
        products: searchResults || []
      };
    }
    
    if (!Array.isArray(collections) || collections.length === 0) {
      return { 
        id: 'loading', 
        title: 'Loading Products...', 
        handle: 'loading', 
        description: '',
        products: [] 
      };
    }
    
    const index = Math.max(0, Math.min(selectedCategory, collections.length - 1));
    const collection = collections[index];
    
    if (!collection) {
      return { 
        id: 'empty', 
        title: 'No Products Available', 
        handle: 'empty',
        description: '',
        products: [] 
      };
    }
    
    return {
      id: collection.id || '',
      title: collection.title || 'Products',
      handle: collection.handle || '',
      description: collection.description || '',
      products: Array.isArray(collection.products) ? collection.products : []
    };
  }, [selectedCategory, collections, searchQuery, searchResults]);

  const handleAddToCart = useCallback((product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!product || !product.id || !product.title) return;
    
    try {
      const cartItem = {
        id: product.id,
        title: product.title,
        name: product.title,
        price: product.price || 0,
        image: product.image || '',
        variant: product.variants?.[0]?.title || 'Default'
      };
      
      addToCart(cartItem);
      toast.success(`${product.title} added to cart!`, { duration: 2000 });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  }, [addToCart]);

  const handleQuantityChange = useCallback((product: Product, newQuantity: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!product || !product.id) return;
    
    try {
      updateQuantity(product.id, product.variants?.[0]?.title || 'Default', newQuantity, {
        id: product.id,
        title: product.title || '',
        name: product.title || '',
        price: product.price || 0,
        image: product.image || ''
      });
      
      if (newQuantity === 0) {
        toast.success(`${product.title} removed from cart`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update cart');
    }
  }, [updateQuantity]);

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
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={fetchCollections} 
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Category Navigation */}
      <div className="sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md border-b">
        <div className="w-full px-2 md:px-4 py-2">
          {!hideSearch && (
            <div className="flex lg:hidden items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 h-8 text-sm"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide">
            {collections.map((collection, index) => (
              <button
                key={collection.id || `collection-${index}`}
                onClick={() => setSelectedCategory(index)}
                className={`flex-1 min-w-0 px-1 lg:px-3 py-2 text-xs lg:text-sm font-bold transition-all duration-200 ${
                  selectedCategory === index
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                } ${collections.length > 6 ? 'min-w-[120px] flex-shrink-0' : ''}`}
              >
                <span className="truncate block" title={collection.title}>
                  {collection.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hideContent && null}

      {/* Products Grid */}
      <div className="container mx-auto px-2 lg:px-4 py-4">
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

        <div className="grid gap-1.5 lg:gap-3 grid-cols-3 lg:grid-cols-8">
          {currentCollection.products.map((product) => {
            if (!product || !product.id || !product.title) return null;
            
            const cartQuantity = getCartItemQuantity(product.id, product.variants?.[0]?.title) || 0;
            
            return (
              <Card
                key={product.id}
                className="bg-card border rounded-lg transition-all duration-200 flex flex-col h-full hover:shadow-md cursor-pointer p-3"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="bg-muted rounded overflow-hidden w-full aspect-square mb-2">
                    <OptimizedImage
                      src={product.image || ''}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-foreground text-xs lg:text-sm mb-1 line-clamp-2 leading-tight">
                      {product.title}
                    </h3>
                    
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-primary text-sm lg:text-base">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {cartQuantity > 0 ? (
                        <div className="flex items-center justify-between bg-primary/10 rounded-md p-1">
                          <Button
                            onClick={(e) => handleQuantityChange(product, cartQuantity - 1, e)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-primary/20"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-semibold px-2">{cartQuantity}</span>
                          <Button
                            onClick={(e) => handleQuantityChange(product, cartQuantity + 1, e)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-primary/20"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => handleAddToCart(product, e)}
                          size="sm"
                          className="w-full h-7 text-xs"
                          disabled={!product.available}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {currentCollection.products.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategories;