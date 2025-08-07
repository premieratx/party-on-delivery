import React, { memo, useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  handle: string;
  description?: string;
  category?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface SuperFastProductGridProps {
  products: Product[];
  category?: string;
  searchQuery?: string;
  onProductClick?: (product: Product) => void;
  className?: string;
  maxProducts?: number;
}

// Memoized product card component for maximum performance
const ProductCard = memo(({ 
  product, 
  quantity, 
  onQuantityChange, 
  onProductClick 
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: string, variantId: string | undefined, delta: number) => void;
  onProductClick?: (product: Product) => void;
}) => {
  const defaultVariant = product.variants?.[0];
  const variantId = defaultVariant?.id;
  
  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantityChange(product.id, variantId, 1);
  }, [product.id, variantId, onQuantityChange]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantityChange(product.id, variantId, -1);
  }, [product.id, variantId, onQuantityChange]);

  const handleCardClick = useCallback(() => {
    onProductClick?.(product);
  }, [product, onProductClick]);

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30 bg-card"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <OptimizedImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
          />
          
          {/* Quick Add/Remove Buttons */}
          {quantity > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full p-1 border">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleDecrement}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[1.5rem] text-center">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleIncrement}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {quantity === 0 && (
            <Button
              size="sm"
              className="absolute top-2 right-2 h-8 px-3 rounded-full"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
              {product.title}
            </h3>
            {product.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {product.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              ${(parseFloat(String(product.price)) || 0).toFixed(2)}
            </span>
            
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={handleDecrement}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium min-w-[1.5rem] text-center">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={handleIncrement}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleIncrement}
                className="h-8 px-3"
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
});

ProductCard.displayName = 'ProductCard';

// Main component with virtualization and smart filtering
export const SuperFastProductGrid: React.FC<SuperFastProductGridProps> = memo(({
  products,
  category,
  searchQuery,
  onProductClick,
  className = '',
  maxProducts = 50
}) => {
  const { cartItems, getCartItemQuantity, updateQuantity } = useUnifiedCart();
  const [visibleCount, setVisibleCount] = useState(20);

  // Smart product filtering with memoization
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filtering
    if (category && category !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase().includes(category.toLowerCase()) ||
        product.title.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Search filtering
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    // Limit max products for performance
    return filtered.slice(0, maxProducts);
  }, [products, category, searchQuery, maxProducts]);

  // Virtualized products for rendering
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Load more products on scroll
  const handleLoadMore = useCallback(() => {
    if (visibleCount < filteredProducts.length) {
      setVisibleCount(prev => Math.min(prev + 20, filteredProducts.length));
    }
  }, [visibleCount, filteredProducts.length]);

  // FIXED: SIMPLE STORE INCREMENT/DECREMENT
  const handleIncrement = useCallback((productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 SuperFast Increment:', { productId, variantId, currentQty, newQty: currentQty + 1 });
    
    // Always just increment by 1
    updateQuantity(productId, variantId, currentQty + 1);
  }, [getCartItemQuantity, updateQuantity]);

  const handleDecrement = useCallback((productId: string, variantId: string | undefined) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    console.log('🛒 SuperFast Decrement:', { productId, variantId, currentQty, newQty: currentQty - 1 });
    
    // Always just decrement by 1 (updateQuantity handles removal if qty becomes 0)
    if (currentQty > 0) {
      updateQuantity(productId, variantId, currentQty - 1);
    }
  }, [getCartItemQuantity, updateQuantity]);

  // Scroll listener for infinite loading
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= documentHeight - 200 && visibleCount < filteredProducts.length) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore, visibleCount, filteredProducts.length]);

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          {searchQuery ? (
            <>
              <p className="text-lg mb-2">No products found</p>
              <p>Try adjusting your search terms</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No products available</p>
              <p>This category is currently empty</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {visibleProducts.length} of {filteredProducts.length} products
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getCartItemQuantity(product.id, product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.title : undefined)}
            onQuantityChange={(productId, variantId, delta) => {
              if (delta > 0) {
                handleIncrement(productId, variantId);
              } else {
                handleDecrement(productId, variantId);
              }
            }}
            onProductClick={onProductClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredProducts.length && (
        <div className="text-center mt-8">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="px-8"
          >
            Load More Products ({filteredProducts.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
});

SuperFastProductGrid.displayName = 'SuperFastProductGrid';