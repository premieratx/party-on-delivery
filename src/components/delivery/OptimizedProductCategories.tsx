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

// Dynamic collections loaded from Shopify - no hardcoded tabs

export const OptimizedProductCategories: React.FC<OptimizedProductCategoriesProps> = ({
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack
}) => {
  const [selectedCollectionHandle, setSelectedCollectionHandle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getCollectionProducts, searchProducts } = useOptimizedShopify();
  
// Use actual Shopify collections instead of hardcoded categories

// Apply affiliate markup to displayed prices
const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);


  // Load all collections on component mount
  useEffect(() => {
    loadShopifyCollections();
  }, []);

  // Load products when collection changes
  useEffect(() => {
    if (selectedCollectionHandle) {
      loadCategoryProducts(selectedCollectionHandle);
    }
  }, [selectedCollectionHandle]);

  const loadShopifyCollections = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading Shopify collections with fresh data and proper ordering...');
      
      // Force fresh data from Shopify to ensure we have latest ordering
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh: true }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.collections) {
        // Filter collections that have products and sort them consistently
        const filteredCollections = data.collections
          .filter((col: any) => col.products && col.products.length > 0)
          .sort((a: any, b: any) => a.title.localeCompare(b.title));
        
        console.log(`✅ Loaded ${filteredCollections.length} collections with products from Shopify`);
        setCollections(filteredCollections);
        
        // Set first collection as default
        if (filteredCollections.length > 0 && !selectedCollectionHandle) {
          setSelectedCollectionHandle(filteredCollections[0].handle);
        }
      }
    } catch (err) {
      console.error('❌ Error loading collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
  };
  };

  const loadCategoryProducts = async (handle: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading products for collection: ${handle} using exact Shopify order`);
      
      // Get products for this specific collection using get-all-collections with fresh data
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh: false, collection_handle: handle }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.collections) {
        const selectedCollection = data.collections.find((col: any) => col.handle === handle);
        
        if (selectedCollection && selectedCollection.products) {
          // Use products directly from Shopify with their exact sort order
          const sortedProducts = selectedCollection.products.sort((a: any, b: any) => {
            // Primary sort: Shopify sort_order (if available)
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
              return a.sort_order - b.sort_order;
            }
            // Secondary sort: position (if available)
            if (a.position !== undefined && b.position !== undefined) {
              return a.position - b.position;
            }
            // Fallback: product ID
            return a.id.localeCompare(b.id);
          });
          
          console.log(`✅ Loaded ${sortedProducts.length} products for ${handle} in exact Shopify order`);
          setProducts(sortedProducts);
        } else {
          console.log(`⚠️ Collection ${handle} not found or has no products`);
          setProducts([]);
        }
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
    const variantId = product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined;
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      variant: variantId
    };
    
    console.log('🛒 OptimizedProductCategories: Adding product to cart:', cartItem);
    const currentQty = getCartItemQuantity(product.id, variantId);
    
    onUpdateQuantity(product.id, variantId, currentQty + 1);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    console.log('OptimizedProductCategories: handleQuantityChange', { productId, variantId, currentQty, delta, newQty });
    onUpdateQuantity(productId, variantId, newQty);
  };

  // Debounced search - filter current collection's products
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        const selectedCollection = collections.find(col => col.handle === selectedCollectionHandle);
        if (selectedCollection) {
          const filtered = selectedCollection.products.filter((product: any) =>
            product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setProducts(filtered);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (selectedCollectionHandle) {
      // Reset to full collection when search is cleared
      loadCategoryProducts(selectedCollectionHandle);
    }
  }, [searchQuery, selectedCollectionHandle, collections]);

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

      {/* Collection Tabs - Using actual Shopify collections */}
      <div className="border-b">
        <div className="w-full">
          <div className="flex w-full items-stretch gap-px py-1 overflow-x-auto flex-nowrap px-0">
            {collections.map((collection) => (
              <Button
                key={collection.handle}
                variant={selectedCollectionHandle === collection.handle ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCollectionHandle(collection.handle)}
                className="flex-shrink-0 px-2 py-1 h-auto min-h-10 max-h-12 text-[7px] tracking-tight leading-[0.85rem] whitespace-normal break-words text-center overflow-hidden rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {collection.title}
                <span className="ml-1 text-[6px] opacity-60">({collection.products?.length || 0})</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input - Always available */}
      <div className="w-full px-1 md:px-3 py-4">
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

      {/* Products Grid */}
      <div className="w-full px-1 md:px-3 py-6">
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
    ${(applyMarkup(parseFloat(String(product.price)) || 0).toFixed(2))}
  </span>
</div>

                     {quantity > 0 ? (
                       <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-lg p-1.5">
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined, -1)}
                           className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
                         >
                           <Minus className="h-3 w-3" />
                         </Button>
                         
                         <span className="font-medium px-2 text-primary-foreground">{quantity}</span>
                         
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleQuantityChange(product.id, product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.id : undefined, 1)}
                           className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
                         >
                           <Plus className="h-3 w-3" />
                         </Button>
                       </div>
                     ) : (
                       <Button
                         size="sm"
                         onClick={() => handleAddToCart(product)}
                         className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                       >
                         <Plus className="h-3.5 w-3.5 mr-1.5" />
                         Add to Cart
                       </Button>
                     )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this collection.</p>
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