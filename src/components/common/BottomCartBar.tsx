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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left side - Cart button (only show if items exist) */}
        {totalItems > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCart}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span>({totalItems})</span>
          </Button>
        )}
        
        {/* Center/Right side - Total and Checkout */}
        <div className="flex items-center gap-3 ml-auto">
          {totalItems > 0 && (
            <span className="font-semibold text-lg text-primary">
              ${totalPrice.toFixed(2)}
            </span>
          )}
          
          <Button
            onClick={onCheckout}
            size={totalItems > 0 ? "default" : "lg"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2 min-w-[120px] justify-center"
            data-checkout-trigger="true"
          >
            <CreditCard className="w-4 h-4" />
            <span>{totalItems > 0 ? 'Checkout' : 'Checkout Now'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};