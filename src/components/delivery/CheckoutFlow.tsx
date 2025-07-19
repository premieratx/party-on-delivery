import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Calendar, Clock, MapPin, ShoppingBag, ExternalLink } from 'lucide-react';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format } from 'date-fns';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  deliveryInfo: DeliveryInfo;
  totalPrice: number;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cartItems,
  deliveryInfo,
  totalPrice
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    phone: '',
    name: '',
    notes: ''
  });

  const deliveryFee = 4.99;
  const finalTotal = totalPrice + deliveryFee;

  const handleShopifyCheckout = () => {
    // In a real implementation, this would:
    // 1. Create a Shopify checkout session
    // 2. Add all cart items to the checkout
    // 3. Add delivery info as customer notes
    // 4. Redirect to Shopify checkout
    
    const deliveryNotes = `
DELIVERY INFO:
Date: ${deliveryInfo.date ? format(deliveryInfo.date, 'EEE, MMM d, yyyy') : 'Not set'}
Time: ${deliveryInfo.timeSlot || 'Not set'}
Address: ${deliveryInfo.address || 'Not set'}
Instructions: ${deliveryInfo.instructions || 'None'}

Customer Info:
Name: ${customerInfo.name}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone}
Additional Notes: ${customerInfo.notes || 'None'}
    `.trim();

    // Mock Shopify checkout URL - replace with actual Shopify integration
    const shopifyCheckoutUrl = `https://your-store.myshopify.com/cart/add?quantity=1&id=variant_id&properties[Delivery Notes]=${encodeURIComponent(deliveryNotes)}`;
    
    console.log('Redirecting to Shopify checkout with delivery info:', deliveryNotes);
    
    // In real implementation, you would redirect here:
    // window.location.href = shopifyCheckoutUrl;
    
    // For demo purposes, show an alert
    alert('Redirecting to Shopify checkout with delivery information attached!');
  };

  const updateCustomerInfo = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = customerInfo.email && customerInfo.phone && customerInfo.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-floating animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Review Your Order
            </CardTitle>
            <p className="text-muted-foreground">
              Confirm your details before checkout
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChange={(e) => updateCustomerInfo('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={customerInfo.email}
                  onChange={(e) => updateCustomerInfo('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={customerInfo.phone}
                  onChange={(e) => updateCustomerInfo('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or notes..."
                  value={customerInfo.notes}
                  onChange={(e) => updateCustomerInfo('notes', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Delivery Details */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">
                      {deliveryInfo.date ? format(deliveryInfo.date, 'EEE, MMM d, yyyy') : 'Date not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <p>{deliveryInfo.timeSlot || 'Time not set'}</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">
                      {deliveryInfo.address || 'Address not set'}
                    </p>
                    {deliveryInfo.instructions && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{deliveryInfo.instructions}"
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.variant || ''}`} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        <span className="text-sm text-muted-foreground">${item.price} each</span>
                      </div>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Checkout Button */}
        <Card className="shadow-floating">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                You will be redirected to our secure Shopify checkout to complete your purchase.
                Your delivery information will be automatically included with your order.
              </p>
              
              <Button 
                variant="delivery" 
                size="xl" 
                className="w-full max-w-md mx-auto"
                onClick={handleShopifyCheckout}
                disabled={!isFormValid}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Complete Purchase on Shopify
              </Button>
              
              {!isFormValid && (
                <p className="text-sm text-destructive">
                  Please fill in all required customer information fields
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};