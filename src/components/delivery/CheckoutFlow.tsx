
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft } from 'lucide-react';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  deliveryInfo: DeliveryInfo;
  totalPrice: number;
  onBack: () => void;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cartItems,
  deliveryInfo,
  totalPrice,
  onBack,
  onDeliveryInfoChange
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    phone: '',
    name: '',
    notes: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState({
    address: '',
    instructions: ''
  });

  // Available time slots
  const timeSlots = [
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM', 
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM'
  ];

  const deliveryFee = 4.99;
  const finalTotal = totalPrice + deliveryFee;

  const handleShopifyCheckout = () => {
    const deliveryNotes = `
DELIVERY INFO:
Date: ${deliveryInfo.date ? format(deliveryInfo.date, 'EEE, MMM d, yyyy') : 'Not set'}
Time: ${deliveryInfo.timeSlot || 'Not set'}
Address: ${deliveryAddress.address || 'Not set'}
Instructions: ${deliveryAddress.instructions || 'None'}

Customer Info:
Name: ${customerInfo.name}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone}
Additional Notes: ${customerInfo.notes || 'None'}
    `.trim();

    console.log('Redirecting to Shopify checkout with delivery info:', deliveryNotes);
    alert('Redirecting to Shopify checkout with delivery information attached!');
  };

  const updateCustomerInfo = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateDeliveryAddress = (field: string, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    const newInfo = { ...deliveryInfo, [field]: value };
    onDeliveryInfoChange(newInfo);
  };

  const isFormValid = customerInfo.email && customerInfo.phone && customerInfo.name && 
                     deliveryAddress.address && deliveryInfo.date && deliveryInfo.timeSlot;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        {/* Header */}
        <Card className="shadow-floating animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Complete Your Order
            </CardTitle>
            <p className="text-muted-foreground">
              Confirm your details and delivery address
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer & Delivery Information */}
          <div className="space-y-6">
            {/* Schedule Your Delivery */}
            <Card className="shadow-card border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Schedule Your Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label>Delivery Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deliveryInfo.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deliveryInfo.date ? format(deliveryInfo.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deliveryInfo.date || undefined}
                        onSelect={(date) => updateDeliveryInfo('date', date)}
                        disabled={(date) => date < new Date() || date < new Date(Date.now() + 24 * 60 * 60 * 1000)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Slot Picker */}
                <div className="space-y-2">
                  <Label>Delivery Time *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={deliveryInfo.timeSlot === slot ? "default" : "outline"}
                        onClick={() => updateDeliveryInfo('timeSlot', slot)}
                        className="justify-start"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    placeholder="Street address, city, state, zip code"
                    value={deliveryAddress.address}
                    onChange={(e) => updateDeliveryAddress('address', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Apartment number, gate code, delivery preferences..."
                    value={deliveryAddress.instructions}
                    onChange={(e) => updateDeliveryAddress('instructions', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
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
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
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
                  Please fill in all required fields including delivery date, time, and address
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
