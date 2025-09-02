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
  
  // Check for delivery app free shipping settings
  const getDeliveryFee = () => {
    try {
      const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
      if (deliveryAppSettings.freeDeliveryEnabled) {
        return 0;
      }
    } catch (error) {
      console.warn('Failed to parse delivery app settings:', error);
    }
    return subtotal >= 200 ? subtotal * 0.1 : 20; // Standard delivery fee calculation
  };
  
  const deliveryFee = getDeliveryFee();
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

  // BULLETPROOF: Always scroll cart to top when opened + prevent page scroll
  useEffect(() => {
    if (isOpen) {
      // Lock page scroll when cart is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
      
      if (scrollContainerRef.current) {
        console.log('🛒 Cart opened, forcing scroll to top');
        
        const container = scrollContainerRef.current;
        container.scrollTop = 0;
        container.scrollTo({ top: 0, behavior: 'instant' });
        
        // Multiple resets to ensure it works
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
        
        console.log('🛒 Cart scroll position reset complete');
      }
    } else {
      // Restore page scroll when cart is closed
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    }
    
    // Cleanup function to restore scroll on component unmount
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <RobustCartErrorBoundary>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 animate-fade-in"
          onClick={onClose}
        />
        
        {/* Cart Sidebar - Always positioned from viewport top, independent of page scroll */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-floating animate-slide-in-right flex flex-col overflow-hidden" 
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, height: '100vh', maxWidth: '28rem' }}
        >
        
        {/* Sticky Header - Always at top of viewport */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-background flex-shrink-0 sticky top-0 z-20">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Your Cart</span>
            <span className="sm:hidden">Cart</span>
            <span className="text-sm font-normal">({totalProductCount})</span>
          </h2>
          <div className="flex gap-2">
            {cartItems.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={emptyCart}
                title="Empty Cart"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Enhanced Scrollable Content - Independent viewport scrolling */}
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
          style={{ 
            /* Complete scroll isolation from main page */
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            position: 'relative',
            /* Ensure this container creates its own scroll context */
            willChange: 'scroll-position',
            /* Ensure content takes full available space */
            minHeight: 0,
            height: '100%'
          }}
        >
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">{/* Removed bottom padding since checkout button is now separate */}
            {cartItems.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Your cart is empty</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add some products to get started</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <Card key={`${item.id}-${item.variant || ''}`} className="p-2 sm:p-3 shadow-sm">
                  <div className="flex gap-2">
                    <img 
                      src={item.image} 
                      alt={/* Clean alt text too */
                        item.title
                          .replace(/gid:\/\/shopify\/[^\s]+/g, '')
                          .replace(/https?:\/\/[^\s]+/g, '')
                          .replace(/\b\d{6,}\b/g, '')
                          .replace(/shopify[^\s]*/gi, '')
                          .replace(/\s+/g, ' ')
                          .trim()
                      }
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md bg-muted flex-shrink-0"
                    />
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-xs leading-tight line-clamp-2">
                            {/* Clean product title - remove GID URLs and Shopify identifiers */}
                            {item.title
                              .replace(/gid:\/\/shopify\/[^\s]+/g, '') // Remove GID URLs
                              .replace(/https?:\/\/[^\s]+/g, '') // Remove ALL URLs
                              .replace(/www\.[^\s]+/g, '') // Remove www URLs
                              .replace(/\b\d{8,}\b/g, '') // Remove long product IDs
                              .replace(/\b\d{7}\b/g, '') // Remove 7-digit product IDs
                              .replace(/\b\d{6}\b/g, '') // Remove 6-digit product IDs
                              .replace(/\|\s*\d+/g, '') // Remove | followed by numbers
                              .replace(/ID:\s*\d+/gi, '') // Remove ID: followed by numbers
                              .replace(/SKU:\s*[\w-]+/gi, '') // Remove SKU codes
                              .replace(/Product\s*ID:\s*\d+/gi, '') // Remove Product ID
                              .replace(/Handle:\s*[\w-]+/gi, '') // Remove handle references
                              .replace(/cdn\.shopify\.com[^\s]*/gi, '') // Remove Shopify CDN URLs
                              .replace(/shopify[^\s]*/gi, '') // Remove any shopify references
                              .replace(/\s+/g, ' ') // Normalize whitespace
                              .replace(/(\d+)\s*Pack/gi, '$1pk')
                              .replace(/(\d+)\s*oz/gi, '$1oz')
                              .replace(/(\d+)\s*ml/gi, '$1ml')
                              .replace(/(\d+)\s*cl/gi, '$1cl')
                              .replace(/(\d+)\s*liter/gi, '$1L')
                              .replace(/(\d+)\s*count/gi, '$1ct')
                              .trim()
                              .replace(/^[-\s|]+|[-\s|]+$/g, '') // Remove leading/trailing dashes, spaces, and pipes
                            }
                          </h4>
                          <p className="product-price text-primary font-semibold text-xs">${item.price}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(item.id, item.variant)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <Badge variant="secondary" className="min-w-[28px] justify-center text-xs px-2">
                          {item.quantity}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Order Summary - In scrollable content */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee {deliveryFee === 0 ? '(FREE)' : subtotal >= 200 ? '(10%)' : '($20 min)'}</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `$${formatPrice(deliveryFee)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (8.25%)</span>
                  <span>${formatPrice(salesTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sticky Footer - Checkout Button always visible at bottom */}
        {cartItems.length > 0 && (
          <div className="border-t bg-background p-4 flex-shrink-0 sticky bottom-0 z-20 mb-safe-area-inset-bottom" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            <Button 
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              size="lg" 
              onClick={handleCheckout}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Proceed to Checkout - </span>
              <span className="sm:hidden">Checkout - </span>
              ${formatPrice(finalTotal)}
            </Button>
          </div>
        )}
        
      </div>
      </RobustCartErrorBoundary>
    </div>
  );
};