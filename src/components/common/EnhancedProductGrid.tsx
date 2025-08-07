import React, { useMemo } from 'react';
import { useVirtualList } from '@/hooks/useVirtualList';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { OptimizedImage } from './OptimizedImage';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { ViewportOptimizer } from '@/utils/performanceOptimizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { parseProductTitle } from '@/utils/productUtils';

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

  const optimizedImage = useImageOptimization(product.image, false);

  return (
    <Card ref={ref as any} className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className={`flex flex-col h-full ${isMobile ? 'p-2' : 'p-3 md:p-4'}`}>
        {/* Product Image */}
        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
          {isIntersecting ? (
            <OptimizedImage
              src={optimizedImage.src}
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
          {(() => {
            const { cleanTitle, packageSize } = parseProductTitle(product.title);
            return (
              <>
                <h3 className={`font-medium line-clamp-2 mb-1 ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  {cleanTitle}
                </h3>
                {packageSize && (
                  <p className={`text-muted-foreground mb-2 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {packageSize}
                  </p>
                )}
              </>
            );
          })()}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-primary ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                ${(parseFloat(String(product.price)) || 0).toFixed(2)}
              </span>
              {quantity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quantity} in cart
                </Badge>
              )}
            </div>

            {/* Quantity Controls - Smaller mobile buttons */}
            {quantity > 0 ? (
              <div className="flex items-center justify-center gap-1 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(-1)}
                  className={`p-0 flex-shrink-0 ${
                    isMobile ? 'h-5 w-5' : 'h-8 w-8'
                  }`}
                >
                  <Minus className={`${isMobile ? 'h-2 w-2' : 'h-4 w-4'}`} />
                </Button>
                <span className={`font-medium min-w-[20px] text-center flex-1 ${
                  isMobile ? 'text-xs' : 'text-base'
                }`}>
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(1)}
                  className={`p-0 flex-shrink-0 ${
                    isMobile ? 'h-5 w-5' : 'h-8 w-8'
                  }`}
                >
                  <Plus className={`${isMobile ? 'h-2 w-2' : 'h-4 w-4'}`} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAddToCart}
                className={`w-full ${isMobile ? 'h-8 text-xs' : 'h-9 text-sm'}`}
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