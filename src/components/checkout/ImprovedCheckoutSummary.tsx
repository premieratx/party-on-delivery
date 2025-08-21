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
  tipAmount: number;
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null;
  onUpdateQuantity?: (id: string, variant: string | undefined, quantity: number) => void;
}

export const ImprovedCheckoutSummary: React.FC<ImprovedCheckoutSummaryProps> = ({
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

  // Enhanced product title cleaning for better display
  const cleanTitle = (title: string) => {
    return title
      .replace(/https?:\/\/[^\s]+/g, '') // Remove ALL URLs completely
      .replace(/www\.[^\s]+/g, '') // Remove www URLs
      .replace(/\b\d{8,}\b/g, '') // Remove long product IDs (8+ digits)
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
      .replace(/^[-\s|]+|[-\s|]+$/g, ''); // Remove leading/trailing dashes, spaces, and pipes
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Order Summary
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cart Items - Better Spacing */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {cartItems.map((item, index) => {
            const cleanedTitle = cleanTitle(item.title);
            
            return (
              <div key={`${item.id}-${item.variant || ''}-${index}`} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img 
                      src={item.image || '/placeholder.svg'} 
                      alt={cleanedTitle}
                      className="w-14 h-14 object-cover rounded-md bg-muted"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                      {cleanedTitle}
                    </h4>
                    
                    {item.variant && !item.variant.includes('gid://') && item.variant !== 'default' && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.variant}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        ${applyMarkup(item.price).toFixed(2)} each
                      </div>
                      
                      {/* Quantity Controls */}
                      {onUpdateQuantity ? (
                        <div className="flex items-center gap-1 bg-background rounded border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(0, item.quantity - 1))}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium">
                          Qty: {item.quantity}
                        </div>
                      )}
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right mt-1">
                      <span className="text-sm font-semibold">
                        ${(applyMarkup(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Pricing Breakdown - Better Spacing */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {appliedDiscount?.type === 'percentage' && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedDiscount.code})</span>
              <span>-${(subtotal * appliedDiscount.value / 100).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>
              Delivery Fee
              {subtotal >= 200 && (
                <span className="text-xs text-muted-foreground ml-1">(10%)</span>
              )}
            </span>
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
          
          {appliedDiscount?.type === 'free_shipping' && deliveryFee > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Free shipping savings</span>
              <span>-${deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Sales Tax (8.25%)</span>
            <span className="font-medium">${salesTax.toFixed(2)}</span>
          </div>
          
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tip</span>
              <span className="font-medium">${tipAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />
        
        {/* Final Total - Enhanced */}
        <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold text-primary">
            ${finalTotal.toFixed(2)}
          </span>
        </div>

        {/* Savings Summary */}
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