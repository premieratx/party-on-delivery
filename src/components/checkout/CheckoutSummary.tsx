import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount: number;
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null;
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  subtotal,
  deliveryFee,
  salesTax,
  tipAmount,
  appliedDiscount,
  onUpdateQuantity
}) => {
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : deliveryFee;
  const finalTotal = discountedSubtotal + finalDeliveryFee + salesTax + tipAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${item.variant || ''}-${index}`} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-16 h-16 sm:w-12 sm:h-12 object-cover rounded-md bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                  {item.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz')}
                </h4>
                {item.variant && (
                  <p className="text-xs text-muted-foreground mb-1">{item.variant}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>${applyMarkup(item.price).toFixed(2)} each</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Quantity Controls */}
                {onUpdateQuantity ? (
                  <div className="flex items-center gap-1 bg-background rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(0, item.quantity - 1))}
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                    Qty: {item.quantity}
                  </div>
                )}
                
                <div className="text-sm font-medium">
                  ${(applyMarkup(item.price) * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          {appliedDiscount?.type === 'percentage' && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedDiscount.code} - {appliedDiscount.value}% off)</span>
              <span>-${(subtotal * appliedDiscount.value / 100).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>
              Delivery Fee
              {subtotal >= 200 ? ' (10%)' : ' ($20 min)'}
            </span>
            <div className="flex items-center gap-2">
              {appliedDiscount?.type === 'free_shipping' && deliveryFee > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  ${deliveryFee.toFixed(2)}
                </span>
              )}
              <span className={finalDeliveryFee === 0 ? 'text-green-600' : ''}>
                {finalDeliveryFee === 0 ? 'FREE' : `$${finalDeliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>
          
          {appliedDiscount?.type === 'free_shipping' && deliveryFee > 0 && (
            <div className="flex justify-between text-green-600 text-xs">
              <span>Free shipping ({appliedDiscount.code})</span>
              <span>-${deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Sales Tax (8.25%)</span>
            <span>${salesTax.toFixed(2)}</span>
          </div>
          
          {tipAmount > 0 && (
            <div className="flex justify-between">
              <span>Driver Tip</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};