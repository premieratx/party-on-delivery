import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart, CheckCircle } from 'lucide-react';
import { haptic } from '@/utils/hapticFeedback';

interface MobileBottomNavProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onProceedToCheckout: () => void;
  onOpenSearch: () => void;
  currentAppSlug?: string;
  isVisible?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartItemCount,
  onOpenCart,
  onProceedToCheckout,
  onOpenSearch,
  isVisible = true
}) => {
  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t">
      <div className="grid grid-cols-4 gap-1 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-16 text-xs"
          onClick={() => {
            haptic.buttonPress();
            onOpenSearch();
          }}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Button>

        {/* Manage Order */}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-16 text-xs"
          onClick={() => {
            haptic.buttonPress();
            onOpenCart();
          }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="leading-tight">Manage Order</span>
        </Button>

        {/* Cart */}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-16 text-xs relative"
          onClick={() => {
            haptic.buttonPress();
            onOpenCart();
          }}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-primary text-primary-foreground text-[10px] px-1 leading-none min-w-[16px] text-center">
                {cartItemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Button>

        {/* Checkout */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 h-16 text-xs ${
            cartItemCount > 0 
              ? 'text-success checkout-blink' 
              : 'text-muted-foreground'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (cartItemCount > 0) {
              haptic.buttonPress();
              onProceedToCheckout();
            }
          }}
          disabled={cartItemCount === 0}
        >
          <CheckCircle className="w-5 h-5" />
          <span>Checkout</span>
        </Button>
      </div>
    </div>
  );
};