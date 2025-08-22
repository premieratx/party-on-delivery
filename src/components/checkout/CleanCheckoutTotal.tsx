import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';

interface CleanCheckoutTotalProps {
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount: number;
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null;
}

export const CleanCheckoutTotal: React.FC<CleanCheckoutTotalProps> = ({
  subtotal,
  deliveryFee,
  salesTax,
  tipAmount,
  appliedDiscount
}) => {
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : deliveryFee;
  const finalTotal = discountedSubtotal + finalDeliveryFee + salesTax + tipAmount;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-primary">
          <Check className="w-5 h-5" />
          Order Total
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Purchase Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Product subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {appliedDiscount?.type === 'percentage' && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedDiscount.code})</span>
              <span>-${(subtotal * appliedDiscount.value / 100).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Delivery fee</span>
            <div className="text-right">
              {appliedDiscount?.type === 'free_shipping' && deliveryFee > 0 && (
                <div className="text-xs text-muted-foreground line-through">
                  ${deliveryFee.toFixed(2)}
                </div>
              )}
              <span className={`font-medium ${finalDeliveryFee === 0 ? 'text-green-600' : ''}`}>
                {finalDeliveryFee === 0 ? 'FREE' : `$${finalDeliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Sales tax</span>
            <span className="font-medium">${salesTax.toFixed(2)}</span>
          </div>
          
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Driver tip</span>
              <span className="font-medium">${tipAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />
        
        {/* Final Total */}
        <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-4">
          <span className="text-xl font-bold">Total</span>
          <span className="text-2xl font-bold text-primary">
            ${finalTotal.toFixed(2)}
          </span>
        </div>

        {(appliedDiscount || finalDeliveryFee === 0) && (
          <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-700">
              🎉 You're saving money with this order!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};