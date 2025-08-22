import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

interface MobileBottomCartBarProps {
  cartItemCount: number;
  totalAmount?: number;
  className?: string;
  onOpenCart: () => void;
  onCheckout?: () => void;
}

export const MobileBottomCartBar: React.FC<MobileBottomCartBarProps> = ({
  cartItemCount,
  totalAmount,
  className = '',
  onOpenCart,
  onCheckout
}) => {
  
  if (cartItemCount === 0) return null;

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 
      bg-background border-t shadow-lg 
      p-2
      ${className}
    `}>
      <div className="flex gap-2">
        {/* Cart Button - Icon + Count */}
        <Button 
          onClick={onOpenCart}
          variant="outline"
          className="flex-1 h-10 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartItemCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-bold min-w-[1.5rem] h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Button>
        
        {/* Checkout Button - Checkmark + Total */}
        {onCheckout && totalAmount && (
          <Button 
            onClick={onCheckout}
            className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>${totalAmount.toFixed(2)}</span>
          </Button>
        )}
      </div>
    </div>
  );
};