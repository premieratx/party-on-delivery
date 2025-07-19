import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Declare Shopify Web Components types
// No need for Shopify components in JSX since we're using embedded form
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
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft, User, CreditCard, Plus, Minus } from 'lucide-react';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  deliveryInfo: DeliveryInfo;
  totalPrice: number;
  onBack: () => void;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cartItems,
  deliveryInfo,
  totalPrice,
  onBack,
  onDeliveryInfoChange,
  onUpdateQuantity
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

  // Remove ShopPay script loading since we're doing embedded checkout
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

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

  // Pricing calculations
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20;
  const salesTax = subtotal * 0.0825;
  const [tipAmount, setTipAmount] = useState(0);
  const [hasEnteredCardInfo, setHasEnteredCardInfo] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(null);
  
  // Calculate discounted subtotal
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  // Calculate delivery fee (based on original subtotal, not discounted)
  const originalDeliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20;
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : originalDeliveryFee;
  
  const finalTotal = discountedSubtotal + finalDeliveryFee + salesTax + tipAmount;

  // Validate and apply discount codes
  const validateDiscountCode = (code: string) => {
    const upperCode = code.toUpperCase();
    switch (upperCode) {
      case 'PREMIER2025':
        return { code: upperCode, type: 'free_shipping' as const, value: 0 };
      case 'PARTYON10':
        return { code: upperCode, type: 'percentage' as const, value: 10 };
      default:
        return null;
    }
  };

  const handleApplyDiscount = () => {
    const discount = validateDiscountCode(discountCode);
    if (discount) {
      setAppliedDiscount(discount);
    } else {
      alert('Invalid discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

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

  const handleCompleteOrder = async () => {
    console.log('Completing order...');
    setIsPaymentProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          cartItems,
          deliveryInfo: {
            ...deliveryInfo,
            address: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
            date: deliveryInfo.date ? format(deliveryInfo.date, "yyyy-MM-dd") : '',
            time: deliveryInfo.timeSlot || ''
          },
          customerInfo,
          appliedDiscount,
          tipAmount
        }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        alert('Error creating checkout. Please try again.');
        return;
      }

      // Redirect to Stripe checkout at top level to avoid iframe restrictions
      if (data.url) {
        window.open(data.url, '_top');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating checkout. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
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
                    {/* Embedded Payment Form */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-semibold mb-6">Payment Information</h3>
                      
                      <div className="space-y-4">
                        {/* Credit Card Fields */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <Input 
                            placeholder="1234 5678 9012 3456" 
                            className="w-full"
                            maxLength={19}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date
                            </label>
                            <Input 
                              placeholder="MM/YY" 
                              className="w-full"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <Input 
                              placeholder="123" 
                              className="w-full"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                             Cardholder Name
                           </label>
                           <Input 
                             placeholder="John Doe" 
                             className="w-full"
                             onChange={(e) => {
                               // Detect when card info is entered
                               if (e.target.value.length > 2) {
                                 setHasEnteredCardInfo(true);
                               }
                             }}
                           />
                         </div>
                         
                         {/* Tip the Driver Section - Shows after card info entered */}
                         {hasEnteredCardInfo && (
                           <div className="pt-4 border-t border-gray-200">
                             <h4 className="text-sm font-medium text-gray-700 mb-3">Tip the Driver</h4>
                             <div className="grid grid-cols-4 gap-2 mb-3">
                               {[0, 2, 5, 8].map((tipPercent) => (
                                 <Button
                                   key={tipPercent}
                                   variant={tipAmount === (subtotal * tipPercent / 100) ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => setTipAmount(subtotal * tipPercent / 100)}
                                   className="text-xs"
                                 >
                                   {tipPercent === 0 ? "No Tip" : `${tipPercent}%`}
                                 </Button>
                               ))}
                             </div>
                             <div className="flex items-center gap-2">
                               <Label htmlFor="customTip" className="text-sm">Custom: $</Label>
                               <Input
                                 id="customTip"
                                 type="number"
                                 placeholder="0.00"
                                 value={tipAmount > 0 && ![0, 2, 5, 8].map(p => subtotal * p / 100).includes(tipAmount) ? tipAmount.toFixed(2) : ''}
                                 onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                                 className="w-20 text-sm"
                                 step="0.01"
                                 min="0"
                               />
                             </div>
                             {tipAmount > 0 && (
                               <p className="text-xs text-gray-600 mt-2">
                                 Tip amount: ${tipAmount.toFixed(2)}
                               </p>
                             )}
                           </div>
                         )}
                         
                         {/* Payment Button */}
                        <Button 
                          className="w-full mt-6"
                          size="lg"
                          disabled={isPaymentProcessing}
                          onClick={handleCompleteOrder}
                        >
                          {isPaymentProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing Payment...
                            </>
                           ) : (
                             `Complete Payment • $${finalTotal.toFixed(2)}`
                           )}
                        </Button>
                        
                        <div className="text-center text-xs text-gray-500 mt-4">
                          🔒 Your payment information is secure and encrypted
                        </div>
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
                        const checkoutUrl = `https://premier-concierge.myshopify.com/cart/${lineItems}?note=${orderNote}`;
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
                        <span className="text-sm text-muted-foreground">${item.price} each</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <Badge variant="secondary" className="min-w-[35px] justify-center px-2">
                          {item.quantity}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Total Price for Item */}
                      <p className="font-semibold min-w-[60px] text-right">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                {/* Discount Code Section */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <Label className="text-sm font-medium">Discount Code</Label>
                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && discountCode) {
                            handleApplyDiscount();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleApplyDiscount}
                        disabled={!discountCode}
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-300">
                      <span className="text-sm font-medium text-green-800">
                        {appliedDiscount.code} applied
                        {appliedDiscount.type === 'percentage' && ` (${appliedDiscount.value}% off)`}
                        {appliedDiscount.type === 'free_shipping' && ' (Free shipping)'}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRemoveDiscount}
                        className="text-green-800 hover:text-green-900"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span>Subtotal</span>
                     <span>${subtotal.toFixed(2)}</span>
                   </div>
                   {appliedDiscount?.type === 'percentage' && (
                     <div className="flex justify-between text-green-600">
                       <span>Discount ({appliedDiscount.value}% off)</span>
                       <span>-${(subtotal * appliedDiscount.value / 100).toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between">
                     <span>Delivery Fee {subtotal >= 200 ? '(10%)' : ''}</span>
                     <div className="flex items-center gap-2">
                       {appliedDiscount?.type === 'free_shipping' && originalDeliveryFee > 0 && (
                         <span className="text-sm text-muted-foreground line-through">${originalDeliveryFee.toFixed(2)}</span>
                       )}
                       <span className={appliedDiscount?.type === 'free_shipping' && originalDeliveryFee > 0 ? 'text-green-600' : ''}>
                         ${finalDeliveryFee.toFixed(2)}
                       </span>
                     </div>
                   </div>
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