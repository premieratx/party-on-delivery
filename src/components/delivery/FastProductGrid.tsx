import React from 'react';
import { VirtualizedProductGrid } from '@/components/common/VirtualizedProductGrid';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface FastProductGridProps {
  category?: string;
  searchQuery?: string;
  onAddToCart?: (item: any) => void;
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
  className?: string;
}

/**
 * Fast-loading product grid with virtualization for sub-1.5 second loading
 * Uses smart caching and progressive loading for optimal performance
 */
export const FastProductGrid: React.FC<FastProductGridProps> = ({
  category,
  searchQuery,
  onAddToCart,
  onUpdateQuantity,
  className
}) => {
  const { cartItems, addToCart, updateQuantity } = useUnifiedCart();

  const handleAddToCart = (item: any) => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      addToCart(item);
    }
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(id, variant, quantity);
    } else {
      updateQuantity(id, variant, quantity);
    }
  };

  return (
    <VirtualizedProductGrid
      category={category}
      searchQuery={searchQuery}
      onAddToCart={handleAddToCart}
      cartItems={cartItems}
      onUpdateQuantity={handleUpdateQuantity}
      containerHeight={window.innerHeight - 200} // Adjust based on header/footer
      className={className}
    />
  );
};