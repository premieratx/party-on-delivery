import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useVirtualizedProducts } from '@/hooks/useVirtualizedProducts';
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

  const {
    visibleItems,
    totalHeight,
    handleScroll,
    loading,
    error,
    hasMore,
    refresh
  } = useVirtualizedProducts({
    containerHeight,
    category,
    itemHeight: 280
  });

  // Filter products by search query
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return visibleItems;
    
    const query = searchQuery.toLowerCase();
    return visibleItems.filter(({ item: product }) =>
      product.title.toLowerCase().includes(query) ||
      product.handle.toLowerCase().includes(query)
    );
  }, [visibleItems, searchQuery]);

  // Get cart item quantity
  const getCartItemQuantity = useCallback((productId: string, variantId?: string) => {
    const cartItem = cartItems.find(item => 
      item.id === productId && item.variant === variantId
    );
    return cartItem?.quantity || 0;
  }, [cartItems]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    const variant = product.variants[0];
    const variantId = variant?.id;
    
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price || 0,
      image: product.image,
      variant: variantId
    };
    
    console.log('🛒 VirtualizedGrid: Adding to cart with exact variant:', { id: product.id, variant: variantId });
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

  if (loading && searchFilteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
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

  return (
    <div className={`relative ${className}`}>
      {/* Virtual scroll container */}
      <div
        style={{ height: containerHeight }}
        className="overflow-auto"
        onScroll={handleScroll}
      >
        {/* Virtual container with total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Grid container */}
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 p-2"
            style={{
              transform: `translateY(${searchFilteredItems[0]?.offsetTop || 0}px)`,
              transition: isGridReady ? 'transform 0.1s ease-out' : 'none'
            }}
          >
            {searchFilteredItems.map(({ item: product, index }) => {
              const variant = product.variants[0];
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

      {/* Loading more indicator */}
      {loading && searchFilteredItems.length > 0 && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
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
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-primary text-lg">
                ${(parseFloat(String(product.price)) || 0).toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity}
                </Badge>
              )}
            </div>

            {/* Quantity Controls */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-1 w-full mx-auto max-w-[80px]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDecrement}
                  className="h-5 w-5 p-0 flex-shrink-0 rounded-full"
                >
                  <Minus className="h-2.5 w-2.5" />
                </Button>
                <span className="font-medium min-w-[16px] text-center text-xs">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onIncrement}
                  className="h-5 w-5 p-0 flex-shrink-0 rounded-full"
                >
                  <Plus className="h-2.5 w-2.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAddToCart}
                className="w-full h-6 text-xs rounded-full mx-auto max-w-[80px]"
                size="sm"
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';