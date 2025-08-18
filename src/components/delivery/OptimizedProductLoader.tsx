import React from 'react';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { ProductSkeleton } from '@/components/common/ProductSkeleton';
import { OptimizedProductCard } from './OptimizedProductCard';

interface OptimizedProductLoaderProps {
  app_slug?: string;
  lightweight?: boolean;
  className?: string;
  onProductSelect?: (product: any) => void;
}

export const OptimizedProductLoader: React.FC<OptimizedProductLoaderProps> = ({
  app_slug,
  lightweight = true,
  className = '',
  onProductSelect
}) => {
  const { products, collections, loading, error, cached, refresh } = useOptimizedProductLoader({
    app_slug,
    lightweight,
    auto_refresh: true
  });

  if (loading && products.length === 0) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Failed to load products</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No products available</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {cached && (
        <div className="text-xs text-muted-foreground mb-2 text-center">
          Cached data • <button onClick={refresh} className="underline">Refresh</button>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <OptimizedProductCard
            key={product.id}
            product={product}
            isSearchFocused={false}
            selectedCategory={0}
            isCocktailsTab={false}
            selectedVariant={null}
            cartQty={0}
            onProductClick={onProductSelect || (() => {})}
            onAddToCart={() => {}}
            onQuantityChange={() => {}}
            onVariantChange={() => {}}
            applyMarkup={(price: number) => price}
          />
        ))}
      </div>
    </div>
  );
};