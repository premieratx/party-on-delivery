import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';

interface BottomCartBarProps {
  items: CartItem[];
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

  if (!isVisible || totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCart}
          className="flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart ({totalItems})</span>
        </Button>
        
        <div className="flex items-center gap-4">
          <span className="font-semibold text-lg">
            ${totalPrice.toFixed(2)}
          </span>
          <Button
            onClick={onCheckout}
            className="bg-green-600 hover:bg-green-700"
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};