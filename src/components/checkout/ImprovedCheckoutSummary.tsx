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
  tipAmount?: number; // Add tip amount prop
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
  tipAmount = 0, // Default tip amount to 0
  appliedDiscount,
  onUpdateQuantity
}) => {
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  const finalDeliveryFee = (() => {
    // Check for delivery app free shipping settings first
    try {
      const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
      if (deliveryAppSettings.freeDeliveryEnabled) {
        return 0;
      }
    } catch (error) {
      console.warn('Failed to parse delivery app settings:', error);
    }
    
    // Then check for promo code free shipping
    return appliedDiscount?.type === 'free_shipping' ? 0 : deliveryFee;
  })();

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
        {/* Cart Items - Show ALL products without images */}
        <div className="space-y-2">
          {cartItems.map((item, index) => {
            const cleanedTitle = cleanTitle(item.title);
            
            return (
              <div key={`${item.id}-${item.variant || ''}-${index}`} className="flex items-center gap-2 py-2 border-b border-border/30">
                {/* Mobile-optimized single row layout */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm leading-tight truncate">
                    {cleanedTitle}
                  </div>
                  {item.variant && !item.variant.includes('gid://') && item.variant !== 'default' && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {item.variant}
                    </div>
                  )}
                </div>
                
                {/* Mobile: Compact quantity and price on same line */}
                <div className="flex items-center gap-2 text-xs">
                  {/* Quantity Controls */}
                  {onUpdateQuantity ? (
                    <div className="flex items-center gap-0.5 bg-background rounded border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(0, item.quantity - 1))}
                        className="h-5 w-5 p-0"
                      >
                        <Minus className="w-2 h-2" />
                      </Button>
                      <span className="text-xs font-medium min-w-[1rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="w-2 h-2" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs">×{item.quantity}</span>
                  )}
                  
                  <span className="font-semibold text-xs text-right min-w-[2.5rem]">
                    ${(applyMarkup(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-3" />
        
        {/* Pricing Details */}
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
              {(appliedDiscount?.type === 'free_shipping' || (() => {
                try {
                  const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                  return deliveryAppSettings.freeDeliveryEnabled;
                } catch (error) {
                  return false;
                }
              })()) && deliveryFee > 0 && (
                <div className="text-xs text-muted-foreground line-through">
                  ${deliveryFee.toFixed(2)}
                </div>
              )}
              <span className={`font-medium ${finalDeliveryFee === 0 ? 'text-green-600' : ''}`}>
                {finalDeliveryFee === 0 ? (
                  (() => {
                    try {
                      const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                      if (deliveryAppSettings.freeDeliveryEnabled) {
                        return 'FREE (App)';
                      } else if (appliedDiscount?.type === 'free_shipping') {
                        return `FREE (${appliedDiscount.code})`;
                      }
                      return 'FREE';
                    } catch (error) {
                      return appliedDiscount?.type === 'free_shipping' ? `FREE (${appliedDiscount.code})` : 'FREE';
                    }
                  })()
                ) : `$${finalDeliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>
          
          {finalDeliveryFee === 0 && deliveryFee > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>
                {(() => {
                  try {
                    const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                    if (deliveryAppSettings.freeDeliveryEnabled) {
                      return 'Free delivery savings (App)';
                    } else if (appliedDiscount?.type === 'free_shipping') {
                      return `Free shipping savings (${appliedDiscount.code})`;
                    }
                    return 'Free delivery savings';
                  } catch (error) {
                    return appliedDiscount?.type === 'free_shipping' ? `Free shipping savings (${appliedDiscount.code})` : 'Free delivery savings';
                  }
                })()}
              </span>
              <span>-${deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Sales Tax (8.25%)</span>
            <span className="font-medium">${salesTax.toFixed(2)}</span>
          </div>

          {/* Driver Tip Display */}
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Driver Tip</span>
              <span className="font-medium">${tipAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />
        
        {/* Final Total with Tip */}
        <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-4">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold text-primary">
            ${(discountedSubtotal + finalDeliveryFee + salesTax + tipAmount).toFixed(2)}
          </span>
        </div>

        {/* Savings Summary */}
        {(appliedDiscount || finalDeliveryFee === 0) && (
          <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-700">
              🎉 {(() => {
                try {
                  const deliveryAppSettings = JSON.parse(sessionStorage.getItem('delivery-app-settings') || '{}');
                  if (deliveryAppSettings.freeDeliveryEnabled && appliedDiscount?.type === 'percentage') {
                    const discountAmount = subtotal * (appliedDiscount.value / 100);
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! (${appliedDiscount.value}% off + Free delivery)`;
                  } else if (deliveryAppSettings.freeDeliveryEnabled) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  } else if (appliedDiscount?.type === 'percentage' && finalDeliveryFee === 0) {
                    const discountAmount = subtotal * (appliedDiscount.value / 100);
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total! (${appliedDiscount.value}% off + Free shipping)`;
                  } else if (appliedDiscount?.type === 'percentage') {
                    const discountAmount = subtotal * (appliedDiscount.value / 100);
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (finalDeliveryFee === 0) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  }
                  return 'You\'re saving money with this order!';
                } catch (error) {
                  if (appliedDiscount?.type === 'percentage' && finalDeliveryFee === 0) {
                    const discountAmount = subtotal * (appliedDiscount.value / 100);
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${(discountAmount + deliverySavings).toFixed(2)} total!`;
                  } else if (appliedDiscount?.type === 'percentage') {
                    const discountAmount = subtotal * (appliedDiscount.value / 100);
                    return `Saving $${discountAmount.toFixed(2)} with promo ${appliedDiscount.code}!`;
                  } else if (finalDeliveryFee === 0) {
                    const deliverySavings = subtotal >= 200 ? subtotal * 0.1 : 20;
                    return `Saving $${deliverySavings.toFixed(2)} on delivery!`;
                  }
                  return 'You\'re saving money with this order!';
                }
              })()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};