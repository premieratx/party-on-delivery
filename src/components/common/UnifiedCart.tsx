import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
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
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice } = useUnifiedCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Always scroll cart to top when opened - enhanced with multiple methods
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      // Use multiple approaches to ensure scroll reset
      const scrollContainer = scrollContainerRef.current;
      
      // Immediate scroll reset
      scrollContainer.scrollTop = 0;
      
      // Backup with scrollTo
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
      
      // Additional timeout to ensure it works even with delayed rendering
      const timeoutId = setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }, 10);
      
      return () => clearTimeout(timeoutId);
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
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-floating z-50 animate-slide-in-right flex flex-col">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({cartItems.length})
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add some products to get started</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <Card key={`${item.id}-${item.variant || ''}`} className="p-4">
                  <div className="flex gap-3">
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
                      className="w-16 h-16 object-cover rounded-md bg-muted"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-xs sm:text-sm line-clamp-2">
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
                          <p className="product-price text-primary font-semibold text-xs sm:text-sm">${item.price}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id, item.variant)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-3.5 w-3.5 sm:h-5 sm:w-5"
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                        >
                          <Minus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </Button>
                        
                        <Badge variant="secondary" className="min-w-[24px] sm:min-w-[40px] justify-center text-xs">
                          {item.quantity}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-3.5 w-3.5 sm:h-5 sm:w-5"
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                        >
                          <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Order Summary - Scrollable with content */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee {subtotal >= 200 ? '(10%)' : '($20 min)'}</span>
                  <span>${formatPrice(deliveryFee)}</span>
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

        {/* Sticky Checkout Button - Always at Bottom */}
        {cartItems.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 border-t p-4 bg-background shadow-lg z-20">
            <Button 
              className="w-full checkout-blink bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-6"
              size="lg" 
              onClick={handleCheckout}
            >
              Proceed to Checkout - ${formatPrice(finalTotal)}
            </Button>
          </div>
        )}
        
      </div>
    </RobustCartErrorBoundary>
  );
};