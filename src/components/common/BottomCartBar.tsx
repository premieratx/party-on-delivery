import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CreditCard, Search, Package } from 'lucide-react';
import { UnifiedCartItem } from '@/hooks/useUnifiedCart';
import { DeliveryAppSelector } from '@/components/delivery/DeliveryAppSelector';

interface BottomCartBarProps {
  items: UnifiedCartItem[];
  totalPrice: number;
  isVisible: boolean;
  onOpenCart: () => void;
  onCheckout: () => void;
  shouldHide?: boolean;
  showAdmin?: boolean;
  currentAppSlug?: string;
}

export const BottomCartBar: React.FC<BottomCartBarProps> = ({
  items,
  totalPrice,
  isVisible,
  onOpenCart,
  onCheckout,
  shouldHide = false,
  showAdmin = false,
  currentAppSlug
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  // Apply affiliate/delivery-app markup to totals consistently
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const adjustedTotal = items.reduce((sum, item) => sum + applyMarkup(item.price) * item.quantity, 0);

  // Always show the bottom cart bar - never hide it completely
  // This ensures consistent sticky behavior across desktop and mobile

  return (
    <>
      {/* Always Sticky Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-auto lg:hidden">
        <div className="bg-background border-t shadow-lg p-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Left side: Search icon */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/search'}
              className="flex items-center gap-1 px-3 h-9"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Search</span>
            </Button>

            {/* Center: Manage Order, Delivery App Selector, Admin */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/customer/dashboard'}
                className="flex items-center gap-1 px-2 h-9"
              >
                <Package className="w-4 h-4" />
                <span className="text-xs">Manage Order</span>
              </Button>
              
              {showAdmin && (
                <Link 
                  to="/admin/dashboard"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors px-2"
                >
                  Admin
                </Link>
              )}
              
              <div className="scale-75 origin-center">
                <DeliveryAppSelector 
                  currentAppSlug={currentAppSlug}
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Right side: Cart, Total, and Checkout */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCart}
                className="flex items-center gap-1 px-2 h-9"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs">({totalItems})</span>
              </Button>
              
              <span className="font-semibold text-xs text-primary px-1">
                ${adjustedTotal.toFixed(2)}
              </span>
              
              <Button
                onClick={onCheckout}
                size="sm"
                variant="success"
                className="flex items-center gap-1 px-2 h-9 checkout-blink"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Checkout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Always Sticky Desktop Bottom Bar */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-[100] pointer-events-auto bg-background border-t shadow-lg p-2 sm:p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showAdmin && (
              <Link 
                to="/admin/dashboard"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Admin
              </Link>
            )}
            {/* Delivery App Selector moved here */}
            <div className="scale-75 origin-left">
              <DeliveryAppSelector 
                currentAppSlug={currentAppSlug}
                className="flex-shrink-0"
              />
            </div>
          </div>
          
          {/* Actions on the right: Cart, Subtotal, Checkout */}
          <div className="flex items-center gap-1 sm:gap-3 ml-auto">
            {/* Cart button - always visible */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { 
                console.log('🛒 BottomCartBar: Cart button clicked, items:', totalItems); 
                onOpenCart(); 
              }}
              aria-label="Open cart"
              className="flex items-center gap-1 sm:gap-2 h-9 sm:h-9 px-3 sm:px-3 touch-manipulation"
              data-cart-trigger="true"
              type="button"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="text-xs">({totalItems})</span>
            </Button>
            
            {/* Total price - always visible */}
            <span className="font-semibold text-sm sm:text-lg text-primary">
              ${adjustedTotal.toFixed(2)}
            </span>
            
            {/* Checkout button */}
            <Button
              onClick={onCheckout}
              size="sm"
              variant="success"
              className="font-medium flex items-center gap-1 sm:gap-2 sm:min-w-[120px] justify-center h-8 sm:h-9 touch-manipulation checkout-blink"
              data-checkout-trigger="true"
              type="button"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{totalItems > 0 ? 'Proceed to Checkout' : 'Checkout Now'}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};