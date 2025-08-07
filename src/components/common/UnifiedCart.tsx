import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';

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

  // Calculate pricing
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20; // Fixed: Use percentage calculation for orders over $200
  const salesTax = subtotal * 0.0825; // 8.25% sales tax
  const finalTotal = subtotal + deliveryFee + salesTax;

  const handleCheckout = () => {
    console.log('Navigating to checkout from unified cart');
    // Navigate to the main checkout flow
    navigate('/?checkout=true');
    onClose();
  };

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
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-floating z-50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
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

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
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
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-md bg-muted"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2">{item.title}</h4>
                            <p className="text-primary font-semibold text-xs sm:text-sm">${item.price}</p>
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
                            className="h-6 w-6 sm:h-8 sm:w-8"
                            onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
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

            {/* Order Summary */}
            {cartItems.length > 0 && (
              <div className="border-t p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee {subtotal >= 200 ? '(10%)' : '($20 min)'}</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax (8.25%)</span>
                    <span>${salesTax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Checkout Button */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 bg-background">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg"
                onClick={handleCheckout}
              >
                Checkout Now - ${finalTotal.toFixed(2)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};