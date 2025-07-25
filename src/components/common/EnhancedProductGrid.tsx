import React, { useMemo } from 'react';
import { useVirtualList } from '@/hooks/useVirtualList';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { OptimizedImage } from './OptimizedImage';
import { ViewportOptimizer } from '@/utils/performanceOptimizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
}

interface EnhancedProductGridProps {
  products: Product[];
  cartItemQuantities: { [productId: string]: number };
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  className?: string;
}

export function EnhancedProductGrid({
  products,
  cartItemQuantities,
  onAddToCart,
  onUpdateQuantity,
  className
}: EnhancedProductGridProps) {
  const isMobile = ViewportOptimizer.isMobile();
  const isTablet = ViewportOptimizer.isTablet();
  
  // Responsive grid configuration
  const getGridConfig = () => {
    if (isMobile) return { columns: 2, itemHeight: 300 };
    if (isTablet) return { columns: 3, itemHeight: 350 };
    return { columns: 4, itemHeight: 400 };
  };

  const { columns, itemHeight } = getGridConfig();
  const containerHeight = 600; // Viewport height for virtual scrolling

  // Organize products into rows for virtual scrolling
  const productRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < products.length; i += columns) {
      rows.push(products.slice(i, i + columns));
    }
    return rows;
  }, [products, columns]);

  const {
    visibleItems: visibleRows,
    totalHeight,
    handleScroll
  } = useVirtualList(productRows, {
    itemHeight,
    containerHeight,
    overscan: 2
  });

  return (
    <div className={className}>
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map(({ item: row, offsetTop, index }) => (
            <div
              key={index}
              className={`absolute w-full grid gap-4 px-4 ${
                isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4'
              }`}
              style={{ 
                top: offsetTop,
                height: itemHeight
              }}
            >
              {row.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartItemQuantities[product.id] || 0}
                  onAddToCart={() => onAddToCart(product)}
                  onUpdateQuantity={(delta) => onUpdateQuantity(product.id, delta)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
  isMobile: boolean;
}

function ProductCard({ 
  product, 
  quantity, 
  onAddToCart, 
  onUpdateQuantity, 
  isMobile 
}: ProductCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <Card ref={ref as any} className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-3 md:p-4 flex flex-col h-full">
        {/* Product Image */}
        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
          {isIntersecting ? (
            <OptimizedImage
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className={`font-medium line-clamp-2 mb-2 ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {product.title}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-primary ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                ${product.price.toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              )}
            </div>

            {/* Quantity Controls */}
            {quantity > 0 ? (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-3 font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAddToCart}
                className="w-full"
                size={isMobile ? "sm" : "default"}
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}