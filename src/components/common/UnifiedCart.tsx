import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus, ShoppingCart, Trash2, Check } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { safeNumber, formatPrice } from '@/utils/safeCalculations';
import { RobustCartErrorBoundary } from './RobustCartErrorBoundary';

interface UnifiedCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedCart: React.FC<UnifiedCartProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate total product count (sum of all quantities)
  const totalProductCount = getTotalItems();

  // BULLETPROOF pricing calculations to prevent crashes
  const subtotal = cartItems.reduce((total, item) => {
    const safePrice = safeNumber(item.price);
    const safeQuantity = safeNumber(item.quantity);
    return total + (safePrice * safeQuantity);
  }, 0);
  
  const deliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20; // Fixed: Use percentage calculation for orders over $200
  const salesTax = subtotal * 0.0825; // 8.25% sales tax
  const finalTotal = subtotal + deliveryFee + salesTax;

  const handleCheckout = () => {
    console.log('Navigating to checkout from unified cart');
    // Store current delivery app referrer for back navigation
    localStorage.setItem('deliveryAppReferrer', window.location.pathname);
    // Navigate to the main checkout flow
    navigate('/checkout');
    onClose();
  };

  // BULLETPROOF: Always scroll cart to top when opened - Complete scroll isolation
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      console.log('🛒 Cart opened, forcing scroll to top');
      
      // Multiple aggressive scroll resets to handle all edge cases
      const container = scrollContainerRef.current;
      
      // Immediate reset
      container.scrollTop = 0;
      container.scrollTo({ top: 0, behavior: 'instant' });
      
      // Force focus to ensure container has proper scroll context
      container.focus({ preventScroll: true });
      
      // Additional resets with increasing delays
      const resetScrolling = () => {
        if (container) {
          container.scrollTop = 0;
          container.scrollTo({ top: 0, behavior: 'instant' });
        }
      };
      
      requestAnimationFrame(resetScrolling);
      setTimeout(resetScrolling, 0);
      setTimeout(resetScrolling, 10);
      setTimeout(resetScrolling, 50);
      setTimeout(resetScrolling, 100);
      setTimeout(resetScrolling, 200);
      
      console.log('🛒 Cart scroll position reset complete');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <RobustCartErrorBoundary>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Cart Sidebar - Full height with sticky header/footer */}
      <div 
        className="fixed right-0 top-0 w-full max-w-md bg-background shadow-floating z-50 animate-slide-in-right flex flex-col overflow-hidden isolate h-screen"
      >
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0 sticky top-0 z-20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
            {totalProductCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                {totalProductCount}
              </Badge>
            )}
          </h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar"
        >
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">Add some delicious items to get started!</p>
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full max-w-xs"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Cart Items */}
              {cartItems.map((item) => (
                <Card key={`${item.id}-${item.variant || 'default'}`} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight truncate">{item.title}</h3>
                        {item.variant && item.variant !== 'default' && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{item.variant}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-sm">{formatPrice(safeNumber(item.price))}</span>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.variant, Math.max(0, safeNumber(item.quantity) - 1))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {safeNumber(item.quantity)}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.variant, safeNumber(item.quantity) + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(item.id, item.variant)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Footer with Order Summary and Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t bg-background flex-shrink-0 sticky bottom-0 z-20">
            <div className="p-4 space-y-3">
              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax</span>
                  <span>{formatPrice(salesTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl animate-heartbeat overflow-hidden relative"
                size="lg" 
                onClick={handleCheckout}
              >
                {/* Liquid flowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-liquid-flow -translate-x-full"></div>
                <Check className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Proceed to Checkout - {formatPrice(finalTotal)}</span>
              </Button>

              {/* Clear Cart Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={emptyCart}
                className="w-full text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </RobustCartErrorBoundary>
  );
};