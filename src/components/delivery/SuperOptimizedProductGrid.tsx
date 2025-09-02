import React, { useMemo } from 'react';
import { useUltraFastProductLoader } from '@/hooks/useUltraFastProductLoader';
import { ProductSkeleton } from '@/components/common/ProductSkeleton';
import { OptimizedProductCard } from './OptimizedProductCard';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Card, CardContent } from '@/components/ui/card';
import { CartQuantityManager } from './CartQuantityManager';
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
  limit = 500
}) => {
  // Use existing ultra-fast system that preserves Shopify collection order
  const { products, loading, error, searchProducts } = useUltraFastProductLoader();

  const { addToCart, getCartItemQuantity, updateQuantity } = useUnifiedCart();

  // Filter products based on category and search - preserves Shopify order
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.collection_handles?.includes(selectedCategory) ||
        product.search_category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm && searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
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
          onClick={searchProducts ? () => searchProducts('', { limit: 500 }) : undefined}
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
        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <OptimizedImage
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                <p className="text-lg font-bold text-primary">${parseFloat(product.price).toFixed(2)}</p>
              </div>
              
                <CartQuantityManager
                  productId={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: parseFloat(String(product.price)) || 0,
                    image: product.image
                  }}
                  size="sm"
                  className="w-full"
                />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};