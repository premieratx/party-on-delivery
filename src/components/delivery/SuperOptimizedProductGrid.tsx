import React, { useMemo } from 'react';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { ProductSkeleton } from '@/components/common/ProductSkeleton';
import { OptimizedProductCard } from './OptimizedProductCard';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface SuperOptimizedProductGridProps {
  app_slug?: string;
  selectedCategory?: string;
  searchTerm?: string;
  className?: string;
  limit?: number;
}

export const SuperOptimizedProductGrid: React.FC<SuperOptimizedProductGridProps> = ({
  app_slug,
  selectedCategory,
  searchTerm,
  className = '',
  limit = 30
}) => {
  const { products, loading, error, refresh } = useOptimizedProductLoader({
    app_slug,
    lightweight: true,
    auto_refresh: true
  });

  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm && searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.vendor?.toLowerCase().includes(term)
      );
    }

    return filtered.slice(0, limit);
  }, [products, selectedCategory, searchTerm, limit]);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(product.price) || 0,
      image: product.image,
      variant: undefined
    };
    addToCart(cartItem);
  };

  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const currentQty = getCartItemQuantity(productId, variantId);
    const newQty = Math.max(0, currentQty + delta);
    updateQuantity(productId, variantId, newQty);
  };

  if (loading && filteredProducts.length === 0) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && filteredProducts.length === 0) {
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

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchTerm ? 'No products found for your search' : 'No products available'}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {filteredProducts.map((product) => (
        <OptimizedProductCard
          key={product.id}
          product={product}
          isSearchFocused={!!searchTerm}
          selectedCategory={0}
          isCocktailsTab={false}
          selectedVariant={null}
          cartQty={getCartItemQuantity(product.id)}
          onProductClick={() => {}}
          onAddToCart={handleAddToCart}
          onQuantityChange={handleQuantityChange}
          onVariantChange={() => {}}
          applyMarkup={(price: number) => price}
        />
      ))}
    </div>
  );
};