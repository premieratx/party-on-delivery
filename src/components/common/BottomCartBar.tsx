import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { UnifiedCartItem } from '@/hooks/useUnifiedCart';

interface BottomCartBarProps {
  items: UnifiedCartItem[];
  totalPrice: number;
  isVisible: boolean;
  onOpenCart: () => void;
  onCheckout: () => void;
}

export const BottomCartBar: React.FC<BottomCartBarProps> = ({
  items,
  totalPrice,
  isVisible,
  onOpenCart,
  onCheckout
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Always show the bar when isVisible is true, even with 0 items
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-2 sm:p-3">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-1 sm:gap-3">
        {/* Cart and Checkout buttons centered */}
        <div className="flex items-center gap-1 sm:gap-3 justify-center">
          {/* Cart button (only show if items exist) */}
          {totalItems > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCart}
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0 h-8 sm:h-9 px-2 sm:px-3"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="text-xs">({totalItems})</span>
            </Button>
          )}
          
          {/* Total price */}
          {totalItems > 0 && (
            <span className="font-semibold text-sm sm:text-lg text-primary flex-shrink-0">
              ${totalPrice.toFixed(2)}
            </span>
          )}
          
          {/* Checkout button */}
          <Button
            onClick={() => window.location.href = '/checkout'}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial sm:min-w-[120px] justify-center h-8 sm:h-9"
            data-checkout-trigger="true"
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{totalItems > 0 ? 'Checkout' : 'Checkout Now'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};