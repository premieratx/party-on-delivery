import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';

interface DeliveryCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onRemoveItem: (id: string, variant?: string) => void;
  totalPrice: number;
  onCheckout: () => void;
  deliveryInfo: DeliveryInfo;
  isAddingToOrder?: boolean;
  useSameAddress?: boolean;
  hasChanges?: boolean;
  appliedDiscount?: {code: string, type: 'percentage' | 'free_shipping', value: number} | null;
  tipAmount?: number;
  onEmptyCart: () => void;
}

export const DeliveryCart: React.FC<DeliveryCartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  totalPrice,
  onCheckout,
  deliveryInfo,
  isAddingToOrder = false,
  useSameAddress = false,
  hasChanges = false,
  appliedDiscount = null,
  tipAmount = 0,
  onEmptyCart
}) => {
  // Calculate pricing with simple logic to avoid hooks issues
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Use proper delivery fee calculation: $20 minimum for orders under $200, 10% for orders over $200
  const deliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20;
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : deliveryFee;
  
  console.log('DeliveryCart pricing:', { subtotal, deliveryFee, finalDeliveryFee, appliedDiscount });
  
  // Calculate discounted subtotal
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  const salesTax = subtotal * 0.0825; // 8.25% sales tax
  const finalTotal = discountedSubtotal + finalDeliveryFee + salesTax + tipAmount;

  if (!isOpen) return null;

  // Scroll to top when cart opens
  React.useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-floating z-50 animate-slide-in-right" onLoad={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Cart ({items.length})
            </h2>
            <div className="flex gap-2">
              {items.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onEmptyCart}
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

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add some products to get started</p>
                </div>
              ) : (
                items.map((item) => (
                  <Card key={`${item.id}-${item.variant || ''}`} className="p-4">
                    <div className="flex gap-3">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-md bg-muted"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2">{item.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz').replace(/Can/gi, '').replace(/Hard Seltzer/gi, '').replace(/\s+/g, ' ').trim()}</h4>
                            <p className="text-primary font-semibold text-xs sm:text-sm">${item.price}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemoveItem(item.id, item.variant)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                         <div className="flex items-center gap-1 sm:gap-2">
                           <Button
                             variant="outline"
                             size="icon"
                             className="h-6 w-6 sm:h-8 sm:w-8"
                             onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity - 1)}
                           >
                             <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                           </Button>
                           
                           <Badge variant="secondary" className="min-w-[32px] sm:min-w-[40px] justify-center text-xs">
                             {item.quantity}
                           </Badge>
                           
                           <Button
                             variant="outline"
                             size="icon"
                             className="h-6 w-6 sm:h-8 sm:w-8"
                             onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                           >
                             <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                           </Button>
                         </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Order Summary (scrollable with cart items) */}
            {items.length > 0 && (
              <div className="border-t p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(subtotal || 0).toFixed(2)}</span>
                  </div>
                  {appliedDiscount?.type === 'percentage' && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-${((subtotal || 0) * (appliedDiscount.value || 0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee {subtotal >= 200 ? '(10%)' : '($20 min)'}</span>
                    <span className={finalDeliveryFee === 0 ? 'text-green-600' : ''}>
                      {finalDeliveryFee === 0 ? 'FREE' : `$${(finalDeliveryFee || 0).toFixed(2)}`}
                    </span>
                  </div>
                  {appliedDiscount?.type === 'free_shipping' && deliveryFee > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Free shipping ({appliedDiscount.code})</span>
                      <span>-${(deliveryFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Sales Tax (8.25%)</span>
                    <span>${(salesTax || 0).toFixed(2)}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tip</span>
                      <span>${(tipAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(finalTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Checkout Button */}
          {items.length > 0 && (
            <div className="border-t p-4 bg-background">
              <Button 
                variant="delivery" 
                size="xl" 
                className="w-full"
                onClick={() => {
                  onCheckout();
                  onClose(); // Always close cart when proceeding to checkout
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};