import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Loader2, Search } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';
import { useOptimizedShopify } from '@/utils/optimizedShopifyClient';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { supabase } from '@/integrations/supabase/client';

interface LocalCartItem extends CartItem {
  productId?: string;
}

interface OptimizedProductCategoriesProps {
  onAddToCart: (item: Omit<LocalCartItem, 'quantity'>) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: LocalCartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
}

const CATEGORY_TABS = [
  { id: 'spirits', title: 'Spirits', handle: 'spirits' },
  { id: 'beer', title: 'Beer', handle: 'tailgate-beer' },
  { id: 'seltzers', title: 'Seltzers', handle: 'seltzer-collection' },
  { id: 'mixers', title: 'Mixers & N/A', handle: 'mixers-non-alcoholic' },
  { id: 'cocktails', title: 'Cocktails', handle: 'cocktail-kits' },
  { id: 'search', title: 'Search', handle: 'search', isSearch: true }
];

export const OptimizedProductCategories: React.FC<OptimizedProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getCollectionProducts, searchProducts } = useOptimizedShopify();
  
  const currentTab = CATEGORY_TABS[selectedCategory];
  const isSearchTab = currentTab?.isSearch;

  // Load products for current category
  useEffect(() => {
    if (!isSearchTab && currentTab?.handle) {
      loadCategoryProducts(currentTab.handle);
    }
  }, [selectedCategory, isSearchTab, currentTab?.handle]);

  const loadCategoryProducts = async (handle: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading products for collection: ${handle} with optimized system`);
      
      // Use optimized fetch with collection filter for maximum speed
      const { data: optimizedData, error: optimizedError } = await supabase.functions.invoke('fetch-shopify-products-optimized', {
        body: { 
          lightweight: true,
          includeImages: false,
          limit: 50,
          collectionHandle: handle
        }
      });
      
      if (!optimizedError && optimizedData?.products) {
        console.log(`✅ Loaded ${optimizedData.products.length} products for ${handle} via optimized system`);
        setProducts(optimizedData.products);
      } else {
        // Fallback to original method
        console.log('Using fallback method for collection products');
        const categoryProducts = await getCollectionProducts(handle);
        setProducts(categoryProducts);
      }
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const searchResults = await searchProducts(query);
      setProducts(searchResults);
    } catch (err) {
      setError('Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get cart item quantity for a specific product
  const getCartItemQuantity = (productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variantId || 'default';
      return itemId === productId && itemVariant === checkVariant;
    });
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined
    };
    
    console.log('🛒 OptimizedProductCategories: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = getCartItemQuantity(product.id, cartItem.variant);
    
    onUpdateQuantity(product.id, cartItem.variant, currentQty + 1);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    console.log('OptimizedProductCategories: handleQuantityChange', { productId, variantId, currentQty, delta, newQty });
    onUpdateQuantity(productId, variantId, newQty);
  };

  // Debounced search
  useEffect(() => {
    if (isSearchTab && searchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (isSearchTab && !searchQuery.trim()) {
      setProducts([]);
    }
  }, [searchQuery, isSearchTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
<div className="bg-background/95 backdrop-blur-md border-b">
        <div className="w-full px-2">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Party On Delivery</h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCart}
                className="relative h-9 px-1.5 gap-1 text-xs"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
<div className="border-b">
        <div className="w-full">
          <div className="flex w-full items-stretch gap-px py-1 overflow-hidden flex-nowrap px-0">
            {CATEGORY_TABS.map((tab, index) => (
              <Button
                key={tab.id}
                variant={selectedCategory === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(index)}
                className="flex-1 basis-0 min-w-0 px-0 py-1 h-auto min-h-10 max-h-12 text-[7px] tracking-tight leading-[0.9rem] whitespace-normal break-words text-center overflow-hidden rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {tab.isSearch && <Search className="h-2.5 w-2.5 mr-1 inline-block align-[-2px]" />}
                {tab.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      {isSearchTab && (
        <div className="w-full px-2 md:px-4 py-4">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="w-full px-2 md:px-4 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {products.map((product) => {
              const quantity = getCartItemQuantity(product.id, product.variants?.[0]?.id);
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-primary">
                        ${(parseFloat(String(product.price)) || 0).toFixed(2)}
                      </span>
                    </div>

                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-primary/10 rounded-lg p-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, -1)}
                          className="h-5 w-5 p-0 sm:h-6 sm:w-6"
                        >
                          <Minus className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                        </Button>
                        
                        <span className="font-medium px-2">{quantity}</span>
                        
                        <Button
                          size="sm"
                          onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.id, 1)}
                          className="h-5 w-5 p-0 sm:h-6 sm:w-6"
                        >
                          <Plus className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isSearchTab && products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </div>

      {/* Checkout Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-2 right-2 z-50 md:bottom-4">
          <Button
            onClick={onProceedToCheckout}
            className="w-full h-12 text-lg font-semibold shadow-lg"
          >
            Proceed to Checkout ({cartItemCount} items)
          </Button>
        </div>
      )}
    </div>
  );
};