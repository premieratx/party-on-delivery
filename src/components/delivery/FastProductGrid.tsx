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
      console.log('🛒 FastProductGrid: Adding product to cart:', item);
      // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
      const currentQty = cartItems.find(cartItem => 
        cartItem.id === item.id && cartItem.variant === item.variant
      )?.quantity || 0;
      
      updateQuantity(item.id, item.variant, currentQty + 1, {
        ...item,
        name: item.title,
        productId: item.id
      });
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