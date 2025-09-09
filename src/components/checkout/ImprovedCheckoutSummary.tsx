import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../DeliveryWidget';

interface ImprovedCheckoutSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount?: number;
  appliedDiscount?: {
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  } | null;
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
}

export const ImprovedCheckoutSummary: React.FC<ImprovedCheckoutSummaryProps> = ({
  cartItems,
  subtotal,
  deliveryFee,
  salesTax,
  tipAmount = 0,
  appliedDiscount,
  onUpdateQuantity
}) => {
  // Get markup percent for consistent calculations
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  
  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    if (appliedDiscount.type === 'percentage') {
      return subtotal * (parseFloat(appliedDiscount.value) / 100);
    } else if (appliedDiscount.type === 'fixed_amount') {
      return Math.min(appliedDiscount.amount, subtotal); // Don't exceed subtotal
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  
  // Check if discount provides free shipping (100% discount or specific free shipping codes)
  const hasDiscountFreeShipping = appliedDiscount?.type === 'percentage' && parseFloat(appliedDiscount.value) === 100;
  
  const finalDeliveryFee = hasDiscountFreeShipping ? 0 : deliveryFee;
  
  const finalTotal = discountedSubtotal + finalDeliveryFee + salesTax + tipAmount;

  // Clean title function to remove URLs and unnecessary text
  const cleanTitle = (title: string): string => {
    return title
      .replace(/https?:\/\/[^\s]+/gi, '') // Remove URLs
      .replace(/\s*\|\s*[^|]*$/gi, '') // Remove everything after the last |
      .replace(/\s*-\s*[^-]*$/gi, '') // Remove everything after the last -
      .replace(/\s*\([^)]*\)\s*/gi, '') // Remove content in parentheses
      .replace(/\s*\[[^\]]*\]\s*/gi, '') // Remove content in brackets
      .replace(/\b\d{10,}\b/gi, '') // Remove long numbers (IDs)
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="w-5 h-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${item.variant || 'default'}-${index}`} className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight text-foreground">
                  {cleanTitle(item.name)}
                </h4>
                {item.variant && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.variant}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold">
                    ${applyMarkup(item.price).toFixed(2)} each
                  </span>
                  {onUpdateQuantity && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium mx-2 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {!onUpdateQuantity && (
                    <Badge variant="secondary" className="text-xs">
                      Qty: {item.quantity}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold">
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
          
          {appliedDiscount && discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedDiscount.code})</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>
              {finalDeliveryFee === 0 ? (
                (() => {
                  try {
                    const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                    if (deliveryAppSettings.freeDeliveryEnabled) {
                      return 'FREE (App)';
                    } else if (hasDiscountFreeShipping) {
                      return `FREE (${appliedDiscount?.code})`;
                    }
                    return 'FREE';
                  } catch (error) {
                    return hasDiscountFreeShipping ? `FREE (${appliedDiscount?.code})` : 'FREE';
                  }
                })()
              ) : `$${finalDeliveryFee.toFixed(2)}`}
            </span>
          </div>

          {finalDeliveryFee === 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>
                {(() => {
                  try {
                    const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                    if (deliveryAppSettings.freeDeliveryEnabled) {
                      return 'Free delivery savings (App)';
                    } else if (hasDiscountFreeShipping) {
                      return `Free shipping savings (${appliedDiscount?.code})`;
                    }
                    return 'Free delivery savings';
                  } catch (error) {
                    return hasDiscountFreeShipping ? `Free shipping savings (${appliedDiscount?.code})` : 'Free delivery savings';
                  }
                })()}
              </span>
              <span>
                ${(subtotal >= 200 ? subtotal * 0.1 : 20).toFixed(2)}
              </span>
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

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>

        {/* Savings Message */}
        {(appliedDiscount || finalDeliveryFee === 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              🎉 {(() => {
                try {
                  const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                  if (deliveryAppSettings.freeDeliveryEnabled && appliedDiscount?.type === 'percentage') {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! (${appliedDiscount.value}% off + Free delivery)`;
                  } else if (deliveryAppSettings.freeDeliveryEnabled && appliedDiscount?.type === 'fixed_amount') {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! ($${discountAmount.toFixed(2)} off + Free delivery)`;
                  } else if (deliveryAppSettings.freeDeliveryEnabled) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  } else if (appliedDiscount?.type === 'percentage' && hasDiscountFreeShipping) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! (${appliedDiscount.value}% off + Free shipping)`;
                  } else if (appliedDiscount?.type === 'fixed_amount' && hasDiscountFreeShipping) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! ($${discountAmount.toFixed(2)} off + Free shipping)`;
                  } else if (appliedDiscount?.type === 'percentage') {
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (appliedDiscount?.type === 'fixed_amount') {
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (finalDeliveryFee === 0) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  }
                  return 'You\'re saving money with this order!';
                } catch (error) {
                  if (appliedDiscount?.type === 'percentage' && hasDiscountFreeShipping) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total!`;
                  } else if (appliedDiscount?.type === 'fixed_amount' && hasDiscountFreeShipping) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total!`;
                  } else if (appliedDiscount?.type === 'percentage') {
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (appliedDiscount?.type === 'fixed_amount') {
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (finalDeliveryFee === 0) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  }
                  return 'You\'re saving money with this order!';
                }
              })()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};