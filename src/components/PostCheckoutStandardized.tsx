import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface PostCheckoutStandardizedProps {
  // Required order data
  orderNumber: string;
  customerName: string;
  
  // Optional order details
  deliveryDate?: string;
  deliveryTime?: string;
  lineItems?: Array<{ title?: string; name?: string; quantity?: number; qty?: number; variant_title?: string }>;
  
  // Optional order amounts (for proper summary rendering)
  subtotalAmount?: number;
  deliveryFeeAmount?: number;
  salesTaxAmount?: number;
  tipAmount?: number; // not shown as an item, included in total
  totalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  
  // Optional custom messaging from app config
  customHeading?: string;
  customSubheading?: string;
  customButtonText?: string;
  customButtonUrl?: string;
  
  // Optional styling
  backgroundColor?: string;
  textColor?: string;
}

export const PostCheckoutStandardized: React.FC<PostCheckoutStandardizedProps> = ({
  orderNumber,
  customerName,
  deliveryDate,
  deliveryTime,
  lineItems,
  subtotalAmount,
  deliveryFeeAmount,
  salesTaxAmount,
  tipAmount,
  totalAmount,
  discountCode,
  discountAmount,
  customHeading,
  customSubheading,
  customButtonText,
  customButtonUrl,
  backgroundColor = '#ffffff',
  textColor = '#000000'
}) => {
  const handleCustomButtonClick = () => {
    if (customButtonUrl) {
      // Open in new tab if external URL, same tab if internal
      if (customButtonUrl.startsWith('http')) {
        window.open(customButtonUrl, '_blank');
      } else {
        window.location.href = customButtonUrl;
      }
    }
  };
  const backUrl = (() => { try { return sessionStorage.getItem('home-override') || localStorage.getItem('deliveryAppReferrer') || '/'; } catch { return '/'; } })();
  const itemsToShow = Array.isArray(lineItems) ? lineItems.filter(item => !/(driver tip|tip)/i.test((item.title || item.name || ''))) : [];
  const hasSummary = [subtotalAmount, deliveryFeeAmount, salesTaxAmount, totalAmount].some(v => typeof v === 'number');
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700">
            Order Complete!
          </CardTitle>
          <p className="text-muted-foreground">
            Thank you, {customerName}! Your order #{orderNumber} has been confirmed.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Summary (totals) */}
          {hasSummary && (
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {typeof subtotalAmount === 'number' && (
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalAmount)}</span>
                  </div>
                )}
                {typeof deliveryFeeAmount === 'number' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(deliveryFeeAmount)}</span>
                  </div>
                )}
                {typeof salesTaxAmount === 'number' && (
                  <div className="flex justify-between">
                    <span>Sales Tax</span>
                    <span>{formatCurrency(salesTaxAmount)}</span>
                  </div>
                )}
                {typeof discountAmount === 'number' && discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount{discountCode ? ` (${discountCode})` : ''}</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(typeof totalAmount === 'number' ? totalAmount : ((subtotalAmount || 0) + (deliveryFeeAmount || 0) + (salesTaxAmount || 0) + (tipAmount || 0)))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Details (items and schedule) */}
          {(deliveryDate || deliveryTime || (itemsToShow && itemsToShow.length > 0)) && (
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-3">Order details</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {deliveryDate && (
                  <li>Delivery date: {deliveryDate}</li>
                )}
                {deliveryTime && (
                  <li>Delivery time: {deliveryTime}</li>
                )}
                {itemsToShow && itemsToShow.length > 0 && (
                  <li>
                    Items:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {itemsToShow.map((item, idx) => {
                        const title = item.title || item.name || 'Item';
                        const qty = item.quantity ?? item.qty ?? 1;
                        const variant = item.variant_title ? ` (${item.variant_title})` : '';
                        return (
                          <li key={idx}>{title}{variant} × {qty}</li>
                        );
                      })}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          )}


          {/* Custom App Messaging */}
          {(customHeading || customSubheading || customButtonText) && (
            <div className="text-center p-6 border-2 border-dashed border-primary rounded-lg">
              {customHeading && (
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ color: textColor }}
                >
                  {customHeading}
                </h3>
              )}
              {customSubheading && (
                <p 
                  className="text-lg mb-6"
                  style={{ color: textColor }}
                >
                  {customSubheading}
                </p>
              )}
              {customButtonText && customButtonUrl && (
                <Button 
                  onClick={handleCustomButtonClick}
                  size="lg"
                  className="text-white bg-primary hover:bg-primary/90"
                >
                  {customButtonText}
                </Button>
              )}
            </div>
          )}

          {/* Default Actions - Always shown */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/customer/login">Manage Order</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to={backUrl}>Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};