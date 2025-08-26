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
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Products and Purchase Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Items Section */}
              {itemsToShow && itemsToShow.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Items ({itemsToShow.length})</h3>
                  <div className="space-y-3">
                    {itemsToShow.map((item, idx) => {
                      const title = item.title || item.name || 'Item';
                      const qty = item.quantity ?? item.qty ?? 1;
                      const variant = item.variant_title ? ` (${item.variant_title})` : '';
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{title}{variant}</span>
                            <span className="text-muted-foreground ml-2">× {qty}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchase Details Section - All pricing consolidated */}
              {hasSummary && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Purchase Details</h3>
                  <div className="space-y-2 text-sm">
                    {typeof subtotalAmount === 'number' && (
                      <div className="flex justify-between items-center">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotalAmount)}</span>
                      </div>
                    )}
                    {typeof discountAmount === 'number' && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Discount{discountCode ? ` (${discountCode})` : ''}</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {typeof deliveryFeeAmount === 'number' && (
                      <div className="flex justify-between items-center">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(deliveryFeeAmount)}</span>
                      </div>
                    )}
                    {typeof salesTaxAmount === 'number' && (
                      <div className="flex justify-between items-center">
                        <span>Sales Tax</span>
                        <span>{formatCurrency(salesTaxAmount)}</span>
                      </div>
                    )}
                    {typeof tipAmount === 'number' && tipAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Driver Tip</span>
                        <span>{formatCurrency(tipAmount)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 space-y-2">
                      <div className="flex justify-between items-center font-bold text-base">
                        <span>Total</span>
                        <span>{formatCurrency(typeof totalAmount === 'number' ? totalAmount : ((subtotalAmount || 0) + (deliveryFeeAmount || 0) + (salesTaxAmount || 0) + (tipAmount || 0)))}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-base">
                        <span>Amount Paid</span>
                        <span className="text-success">{formatCurrency(typeof totalAmount === 'number' ? totalAmount : ((subtotalAmount || 0) + (deliveryFeeAmount || 0) + (salesTaxAmount || 0) + (tipAmount || 0)))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Notes Section - Top Right */}
            <div className="lg:col-span-1">
              {(deliveryDate || deliveryTime) && (
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Order Notes</h3>
                  <div className="space-y-2 text-sm">
                    {deliveryDate && (
                      <div><span className="font-medium">Delivery Date:</span> {deliveryDate}</div>
                    )}
                    {deliveryTime && (
                      <div><span className="font-medium">Delivery Time:</span> {deliveryTime}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>


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