import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { supabase } from '@/integrations/supabase/client';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { parseProductTitle } from '@/utils/productUtils';
import { useToast } from '@/hooks/use-toast';

export const SearchPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addToCart, getTotalItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();

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

  // Real-time hierarchical search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
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
        ? SearchOptimizer.buildSearchIndex(allProducts, 'global-search')
        : [];
        
      const results = searchIndex.length > 0
        ? SearchOptimizer.searchProductsWithHierarchy(searchQuery, searchIndex, 100)
        : [];

      console.log(`🔍 GLOBAL SEARCH: Found ${results.length} products for "${searchQuery}"`);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);

  // Real-time search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery?.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Small debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

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
        <Card className="mb-6">
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
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-lg pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {isSearching ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching products...</p>
            </CardContent>
          </Card>
        ) : searchQuery.trim() ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {searchResults.map((product) => {
                  const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
                  const { cleanTitle, packageSize } = parseProductTitle(product.title);
                  
                  return (
                    <Card 
                      key={product.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col h-full"
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
                    No products found for "{searchQuery}". Try different keywords.
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
                Enter a search term to find products across all delivery apps.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchPage;