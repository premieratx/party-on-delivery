import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useUltraFastProductLoader } from '@/hooks/useUltraFastProductLoader';
import { parseProductTitle } from '@/utils/productUtils';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface CartItem {
  id: string;
  productId?: string;
  variant?: string;
  quantity: number;
}

interface VirtualizedProductGridProps {
  category?: string;
  onAddToCart: (item: any) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  containerHeight?: number;
  searchQuery?: string;
  className?: string;
}

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  category,
  onAddToCart,
  cartItems,
  onUpdateQuantity,
  containerHeight = 600,
  searchQuery = '',
  className = ''
}) => {
  const [isGridReady, setIsGridReady] = useState(false);
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);

  const {
    products,
    loading,
    error,
    searchProducts,
    loadAllProducts
  } = useUltraFastProductLoader();

  // Real-time search with instant results
  React.useEffect(() => {
    if (searchQuery.trim()) {
      searchProducts(searchQuery, { limit: 100 }).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchProducts]);

  // Filter products by category
  const categoryFilteredProducts = React.useMemo(() => {
    const productsToFilter = searchQuery.trim() ? searchResults : products;
    if (!category) return productsToFilter;
    
    return productsToFilter.filter(product => 
      product.category?.toLowerCase() === category.toLowerCase() ||
      product.collection_handles?.some(handle => 
        handle.toLowerCase().includes(category.toLowerCase())
      )
    );
  }, [products, searchResults, category, searchQuery]);

  // Create virtual items for rendering (simplified - no virtualization for instant loading)
  const displayItems = React.useMemo(() => {
    return categoryFilteredProducts.map((product, index) => ({
      item: product,
      index,
      offsetTop: Math.floor(index / 4) * 280 // Approximate grid layout
    }));
  }, [categoryFilteredProducts]);

  // Refresh function
  const refresh = React.useCallback(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  // Get cart item quantity
  const getCartItemQuantity = useCallback((productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = variantId || 'default';
      return itemId === productId && itemVariant === checkVariant;
    });
    return cartItem?.quantity || 0;
  }, [cartItems]);

  // Handle add to cart - FIXED to include all required data
  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    const variant = product.variants[0];
    const variantId = variant?.id;
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: variant?.price || product.price || 0,
      image: product.image,
      variant: variantId
    };
    console.log('🛒 VirtualizedGrid: Adding to cart with complete data:', cartItem);
    // Delegate creation to parent so it can supply product data to unified cart
    onAddToCart(cartItem);
  }, [onAddToCart]);

  // Handle quantity change
  // FIXED: SIMPLE STORE INCREMENT/DECREMENT  
  const handleIncrement = useCallback((productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 VirtualizedGrid Increment:', { productId, variantId, currentQty, newQty: currentQty + 1 });
    
    // Always just increment by 1
    onUpdateQuantity(productId, variantId, currentQty + 1);
  }, [getCartItemQuantity, onUpdateQuantity]);

  const handleDecrement = useCallback((productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 VirtualizedGrid Decrement:', { productId, variantId, currentQty, newQty: currentQty - 1 });
    
    // Always just decrement by 1 (updateQuantity handles removal if qty becomes 0)
    if (currentQty > 0) {
      onUpdateQuantity(productId, variantId, currentQty - 1);
    }
  }, [getCartItemQuantity, onUpdateQuantity]);

  // Grid ready effect
  React.useEffect(() => {
    const timer = setTimeout(() => setIsGridReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Only show loading on initial load with no products (should be rare with cache)
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing cache...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Products</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Instant-loading grid - no virtualization needed for cached data */}
      <div
        style={{ height: containerHeight }}
        className="overflow-auto"
      >
        {/* Grid container - instant display */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 p-2">
          {displayItems.map(({ item: product, index }) => {
            const variant = product.variants?.[0];
            const variantId = variant?.id;
            
            return (
              <ProductCard
                key={`${product.id}-${index}`}
                product={product}
                quantity={getCartItemQuantity(product.id, variantId)}
                onAddToCart={() => handleAddToCart(product)}
                onIncrement={() => handleIncrement(product.id, variantId)}
                onDecrement={() => handleDecrement(product.id, variantId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Optimized Product Card Component
interface ProductCardProps {
  product: ShopifyProduct;
  quantity: number;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  quantity,
  onAddToCart,
  onIncrement,
  onDecrement
}) => {
  const { cleanTitle, packageSize } = parseProductTitle(product.title);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex flex-col h-full p-2 md:p-3">
        {/* Product Image */}
        <div className="aspect-square mb-2 relative overflow-hidden rounded-lg bg-muted">
          {!imageError ? (
            <img
              src={product.image}
              alt={product.title}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
          
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium line-clamp-2 mb-1 text-sm md:text-base">
            {cleanTitle}
          </h3>
          {packageSize && (
            <p className="text-muted-foreground mb-2 text-xs text-center">
              {packageSize}
            </p>
          )}
          
          <div className="mt-auto flex flex-col items-center gap-2">
            {/* Price Row - fixed height so it never shifts */}
            <div className="flex items-center justify-center h-7">
              <span className="font-bold text-primary text-lg">
                ${(parseFloat(String(product.price)) || 0).toFixed(2)}
              </span>
              {/* Reserve space for badge to keep row height consistent */}
              <span className="ml-2 inline-block min-w-[28px] text-center">
                {quantity > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {quantity}
                  </Badge>
                ) : (
                  <span className="invisible">00</span>
                )}
              </span>
            </div>

            {/* Quantity Controls - keep center aligned with initial add circle */}
            <div className="flex items-center justify-center h-12">
              {quantity > 0 ? (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={onDecrement}
                    className="h-10 w-10 p-0 rounded-full border-muted-foreground/30 lg:h-12 lg:w-12"
                  >
                    <Minus className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Button>
                  <div className="w-10 flex items-center justify-center lg:w-16">
                    <span className="font-bold text-base text-center lg:text-2xl">
                      {quantity}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm" 
                    onClick={onIncrement}
                    className="h-10 w-10 p-0 rounded-full border-muted-foreground/30 lg:h-12 lg:w-12"
                  >
                    <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={onAddToCart}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center lg:w-12 lg:h-12 shadow"
                  aria-label="Add to cart"
                >
                  <Plus className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';
