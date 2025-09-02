import React from 'react';
import { useUltraFastProductLoader } from '@/hooks/useUltraFastProductLoader';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Card, CardContent } from '@/components/ui/card';
import { CartQuantityManager } from './CartQuantityManager';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface FastProductGridProps {
  category?: string;
  searchQuery?: string;
  onAddToCart?: (item: any) => void;
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
  className?: string;
}

/**
 * Fast-loading product grid using existing ultra-fast systems
 * Preserves Shopify collection ordering from instant-product-cache
 */
export const FastProductGrid: React.FC<FastProductGridProps> = ({
  category,
  searchQuery,
  onAddToCart,
  onUpdateQuantity,
  className
}) => {
  const { cartItems } = useUnifiedCart();
  
  // Use existing ultra-fast system that connects to instant-product-cache
  const { 
    products, 
    loading,
    searchProducts 
  } = useUltraFastProductLoader();

  // Filter by category if specified
  const filteredProducts = React.useMemo(() => {
    let filtered = products;
    
    if (category) {
      filtered = filtered.filter(product => 
        product.collection_handles?.includes(category) ||
        product.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (searchQuery?.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [products, category, searchQuery]);

  // Perform search when query changes
  React.useEffect(() => {
    if (searchQuery?.trim()) {
      searchProducts(searchQuery, { limit: 100 });
    }
  }, [searchQuery, searchProducts]);

  const handleAddToCart = (item: any) => {
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(id, variant, quantity);
    }
  };

  if (loading && filteredProducts.length === 0) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {filteredProducts.map((product: any) => (
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
                <p className="text-lg font-bold text-primary">${parseFloat(product.price || 0).toFixed(2)}</p>
              </div>
              
              <CartQuantityManager
                productId={product.id}
                product={{
                  id: product.id,
                  title: product.title,
                  price: parseFloat(product.price || 0),
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