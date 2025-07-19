import React, { useState, useEffect } from 'react';

// Declare Shopify Web Components types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'shopify-accelerated-checkout': any;
      'shopify-store': any;
    }
  }
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft, User, CreditCard } from 'lucide-react';
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
  // Step management
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'customer' | 'payment'>('datetime');
  const [confirmedDateTime, setConfirmedDateTime] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(false);
  const [confirmedCustomer, setConfirmedCustomer] = useState(false);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  
  // Address state
  const [addressInfo, setAddressInfo] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  // ShopPay integration state
  const [isShopPayLoading, setIsShopPayLoading] = useState(true);

  useEffect(() => {
    // Load correct Shopify Web Components script
    const script = document.createElement('script');
    script.src = 'https://cdn.shopify.com/shopifycloud/web-components/assets/shopify-web.js';
    script.async = true;
    script.type = 'module';
    
    script.onload = () => {
      console.log('Shopify Web Components loaded successfully');
      setIsShopPayLoading(false);
    };
    
    script.onerror = () => {
      console.error('Failed to load Shopify Web Components');
      setIsShopPayLoading(false);
    };
    
    // Only add if not already present
    if (!document.querySelector('script[src*="shopify-web"]')) {
      document.head.appendChild(script);
    }
  }, []);

  // Available time slots - 1 hour windows starting at 30 min intervals from 10am
  const timeSlots = [
    '10:00 AM - 11:00 AM',
    '10:30 AM - 11:30 AM',
    '11:00 AM - 12:00 PM',
    '11:30 AM - 12:30 PM',
    '12:00 PM - 1:00 PM',
    '12:30 PM - 1:30 PM',
    '1:00 PM - 2:00 PM',
    '1:30 PM - 2:30 PM',
    '2:00 PM - 3:00 PM',
    '2:30 PM - 3:30 PM',
    '3:00 PM - 4:00 PM',
    '3:30 PM - 4:30 PM',
    '4:00 PM - 5:00 PM',
    '4:30 PM - 5:30 PM',
    '5:00 PM - 6:00 PM',
    '5:30 PM - 6:30 PM',
    '6:00 PM - 7:00 PM',
    '6:30 PM - 7:30 PM',
    '7:00 PM - 8:00 PM',
    '7:30 PM - 8:30 PM'
  ];

  const deliveryFee = 4.99;
  const finalTotal = totalPrice + deliveryFee;

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    const newInfo = { ...deliveryInfo, [field]: value };
    onDeliveryInfoChange(newInfo);
  };

  const handleConfirmDateTime = () => {
    if (deliveryInfo.date && deliveryInfo.timeSlot) {
      setConfirmedDateTime(true);
      setCurrentStep('address');
    }
  };

  const handleConfirmAddress = () => {
    if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
      setConfirmedAddress(true);
      setCurrentStep('customer');
    }
  };

  const handleConfirmCustomer = () => {
    if (customerInfo.firstName && customerInfo.lastName && customerInfo.phone && customerInfo.email) {
      setConfirmedCustomer(true);
      setCurrentStep('payment');
    }
  };

  const handleCompleteOrder = () => {
    console.log('Order completed with all information');
    alert('Order placed successfully!');
  };

  const isDateTimeComplete = deliveryInfo.date && deliveryInfo.timeSlot;
  const isAddressComplete = addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode;
  const isCustomerComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.phone && customerInfo.email;

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

        {/* Header with Confirmation Summary */}
        <Card className="shadow-floating animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Complete Your Order
            </CardTitle>
            <p className="text-muted-foreground">
              Confirm your details step by step
            </p>
          </CardHeader>
          
          {/* Confirmation Summary */}
          {(confirmedDateTime || confirmedAddress || confirmedCustomer) && (
            <CardContent className="border-t">
              <div className="space-y-3">
                {confirmedDateTime && (
                  <div className="p-3 border border-black rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold text-primary flex flex-wrap items-center justify-start gap-2">
                      <span>Delivery:</span>
                      <span className="text-foreground">{deliveryInfo.date && format(deliveryInfo.date, "MMM d, yyyy")} • {deliveryInfo.timeSlot}</span>
                    </div>
                  </div>
                )}
                
                {confirmedAddress && (
                  <div className="p-3 border border-black rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold text-primary">
                      <div className="flex flex-wrap items-center justify-start gap-2">
                        <span>Address:</span>
                        <span className="text-foreground">{addressInfo.street} • {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</span>
                      </div>
                      {addressInfo.instructions && (
                        <div className="text-sm font-normal text-foreground mt-1 ml-20">
                          {addressInfo.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {confirmedCustomer && (
                  <div className="p-3 border border-black rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold text-primary flex flex-wrap items-center justify-start gap-2">
                      <span>Contact:</span>
                      <span className="text-foreground">{customerInfo.firstName} {customerInfo.lastName} • {customerInfo.phone} • {customerInfo.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Step-by-Step Forms */}
          <div className="space-y-6">
            {/* Date/Time Selection */}
            {currentStep === 'datetime' && (
              <Card className="shadow-card border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Schedule Your Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Delivery Date *</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                      <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryInfo.date || undefined}
                          onSelect={(date) => {
                            updateDeliveryInfo('date', date);
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date() || date < new Date(Date.now() + 24 * 60 * 60 * 1000)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Time *</Label>
                    <Select 
                      value={deliveryInfo.timeSlot} 
                      onValueChange={(value) => updateDeliveryInfo('timeSlot', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {slot}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmDateTime}
                    disabled={!isDateTimeComplete}
                    className="w-full"
                  >
                    Confirm Date & Time
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Address Section */}
            {currentStep === 'address' && (
              <Card className="shadow-card border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      placeholder="123 Main Street"
                      value={addressInfo.street}
                      onChange={(e) => setAddressInfo(prev => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Austin"
                        value={addressInfo.city}
                        onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="TX"
                        value={addressInfo.state}
                        onChange={(e) => setAddressInfo(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="78701"
                      value={addressInfo.zipCode}
                      onChange={(e) => setAddressInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Apartment number, gate code, delivery preferences..."
                      value={addressInfo.instructions}
                      onChange={(e) => setAddressInfo(prev => ({ ...prev, instructions: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleConfirmAddress}
                    disabled={!isAddressComplete}
                    className="w-full"
                  >
                    Confirm Address
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {currentStep === 'customer' && (
              <Card className="shadow-card border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleConfirmCustomer}
                    disabled={!isCustomerComplete}
                    className="w-full"
                  >
                    Confirm Contact Info
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ShopPay Payment */}
            {currentStep === 'payment' && (
              <Card className="shadow-card border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment with ShopPay
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Secure checkout powered by Shopify
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-6">
                    {/* Single Unified Checkout Section */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Complete Your Payment</h3>
                      
                      {/* ShopPay Express Checkout */}
                      <div className="mb-4">
                        {isShopPayLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm">Loading payment options...</span>
                          </div>
                        ) : (
                          <shopify-accelerated-checkout
                            shop-domain="thecannacorp"
                            storefront-access-token="a49fa69332729e9f8329ad8caacc37ba"
                            variant-ids={cartItems.map(item => {
                              const variantId = item.variant?.toString().split('/').pop() || '';
                              console.log('ShopPay variant ID:', variantId, 'for:', item.title);
                              return variantId;
                            }).filter(id => id).join(',')}
                            quantities={cartItems.map(item => item.quantity).join(',')}
                            style={{
                              width: '100%',
                              minHeight: '120px'
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="text-center text-sm text-gray-500 my-4">
                        or continue with manual checkout below
                      </div>
                    </div>
                  </div>
                  
                  {/* Fallback Manual Checkout */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                      Or complete your order manually
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Create cart line items
                        const lineItems = cartItems.map(item => {
                          // Extract variant ID from the product data
                          const variantId = item.variant || item.id;
                          console.log('Adding item to cart:', { item, variantId });
                          return `${variantId.replace('gid://shopify/ProductVariant/', '')}:${item.quantity}`;
                        }).join(',');
                        
                        const orderNote = encodeURIComponent([
                          `Customer: ${customerInfo.firstName} ${customerInfo.lastName}`,
                          `Email: ${customerInfo.email}`,
                          `Phone: ${customerInfo.phone}`,
                          `Delivery Address: ${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
                          `Delivery Date: ${deliveryInfo.date && format(deliveryInfo.date, "MMM d, yyyy")} at ${deliveryInfo.timeSlot}`,
                          `Age Verified: Yes`,
                          `Total: $${finalTotal.toFixed(2)} (includes $${deliveryFee.toFixed(2)} delivery fee)`,
                          addressInfo.instructions ? `Instructions: ${addressInfo.instructions}` : ''
                        ].filter(Boolean).join('\n'));
                        
                        // Redirect to Shopify cart with all info
                        const checkoutUrl = `https://thecannacorp.myshopify.com/cart/${lineItems}?note=${orderNote}`;
                        console.log('Redirecting to:', checkoutUrl);
                        window.open(checkoutUrl, '_blank');
                      }}
                    >
                      Complete Order - ${finalTotal.toFixed(2)}
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground space-y-2">
                      <p>Secure checkout powered by Shopify</p>
                      <p>Total: ${finalTotal.toFixed(2)} (including ${deliveryFee.toFixed(2)} delivery fee)</p>
                      <p className="text-xs">You'll be redirected to our secure Shopify checkout</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
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
      </div>
    </div>
  );
};