import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddedPaymentForm } from '@/components/payment/EmbeddedPaymentForm';

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
import { useCustomerInfo } from '@/hooks/useCustomerInfo';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  deliveryInfo: DeliveryInfo;
  totalPrice: number;
  onBack: () => void;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  isAddingToOrder?: boolean;
  useSameAddress?: boolean;
  lastOrderInfo?: any;
  onDiscountChange?: (discount: {code: string, type: 'percentage' | 'free_shipping', value: number} | null) => void;
  onTipChange?: (tip: number) => void;
  onChangesDetected?: (hasChanges: boolean) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cartItems,
  deliveryInfo,
  totalPrice,
  onBack,
  onDeliveryInfoChange,
  onUpdateQuantity,
  isAddingToOrder = false,
  useSameAddress = false,
  lastOrderInfo,
  onDiscountChange,
  onTipChange,
  onChangesDetected
}) => {
  // Step management - if same address is confirmed, skip to customer info
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'customer' | 'payment'>(
    useSameAddress ? 'customer' : 'datetime'
  );
  const [confirmedDateTime, setConfirmedDateTime] = useState(useSameAddress);
  const [confirmedAddress, setConfirmedAddress] = useState(useSameAddress);
  const [confirmedCustomer, setConfirmedCustomer] = useState(false);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use persistent customer info (always persistent)
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  
  // Track if address has been cleared for new orders to prevent infinite loop
  const [hasAddressBeenCleared, setHasAddressBeenCleared] = useState(false);
  
  // Track changes from original order
  const [originalOrderInfo, setOriginalOrderInfo] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);
  
  // For new orders or new visitors, clear address info once
  useEffect(() => {
    if (!isAddingToOrder && !hasAddressBeenCleared) {
      setAddressInfo({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: ''
      });
      setHasAddressBeenCleared(true);
    }
    if (isAddingToOrder) {
      setHasAddressBeenCleared(false);
    }
  }, [isAddingToOrder, hasAddressBeenCleared]);

  // Pre-fill delivery info when using same address and store original info
  useEffect(() => {
    if (useSameAddress && lastOrderInfo) {
      // Store original order info for comparison
      setOriginalOrderInfo(lastOrderInfo);
      
      // Pre-fill delivery date and time if available
      if (lastOrderInfo.deliveryDate) {
        const date = new Date(lastOrderInfo.deliveryDate);
        updateDeliveryInfo('date', date);
      }
      if (lastOrderInfo.deliveryTime) {
        updateDeliveryInfo('timeSlot', lastOrderInfo.deliveryTime);
      }
      
      // Pre-fill address info with full address
      if (lastOrderInfo.address) {
        const addressParts = lastOrderInfo.address.split(',').map(part => part.trim());
        setAddressInfo({
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2]?.split(' ')[0] || '',
          zipCode: addressParts[2]?.split(' ')[1] || '',
          instructions: lastOrderInfo.instructions || ''
        });
      }
    }
  }, [useSameAddress, lastOrderInfo]);

  // Check for changes from original order
  useEffect(() => {
    if (originalOrderInfo && useSameAddress) {
      const changes: string[] = [];
      
      // Check address changes
      const currentAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      if (currentAddress !== originalOrderInfo.address && addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
        changes.push('delivery address');
      }
      
      // Check date changes
      if (deliveryInfo.date && originalOrderInfo.deliveryDate) {
        const originalDate = new Date(originalOrderInfo.deliveryDate).toDateString();
        const currentDate = deliveryInfo.date.toDateString();
        if (originalDate !== currentDate) {
          changes.push('delivery date');
        }
      }
      
      // Check time changes
      if (deliveryInfo.timeSlot && originalOrderInfo.deliveryTime) {
        if (deliveryInfo.timeSlot !== originalOrderInfo.deliveryTime) {
          changes.push('delivery time');
        }
      }
      
      // Check instructions changes
      if (addressInfo.instructions !== (originalOrderInfo.instructions || '')) {
        if (!changes.includes('delivery address')) {
          changes.push('delivery instructions');
        }
      }
      
      setChangedFields(changes);
      setHasChanges(changes.length > 0);
      
      // Notify parent component about changes
      if (onChangesDetected) {
        onChangesDetected(changes.length > 0);
      }
    }
  }, [addressInfo, deliveryInfo, originalOrderInfo, useSameAddress, onChangesDetected]);

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
  // Free delivery for bundled orders (adding to same address) - but remove if changes detected
  const deliveryFee = (isAddingToOrder && useSameAddress && !hasChanges) ? 0 : (subtotal >= 200 ? subtotal * 0.1 : 20);
  const salesTax = subtotal * 0.0825;
  const [tipAmount, setTipAmount] = useState(0);
  const [hasEnteredCardInfo, setHasEnteredCardInfo] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(null);
  
  // Calculate discounted subtotal
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  // Calculate delivery fee (based on original subtotal, not discounted) - but remove if changes detected
  const originalDeliveryFee = (isAddingToOrder && useSameAddress && !hasChanges) ? 0 : (subtotal >= 200 ? subtotal * 0.1 : 20);
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
      if (onDiscountChange) {
        onDiscountChange(discount);
      }
    } else {
      alert('Invalid discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    if (onDiscountChange) {
      onDiscountChange(null);
    }
  };
  
  // Sync tip changes with parent
  const handleTipChange = (newTip: number) => {
    setTipAmount(newTip);
    if (onTipChange) {
      onTipChange(newTip);
    }
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

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    // Create Shopify order after successful payment
    if (paymentIntentId) {
      try {
        console.log('Creating Shopify order for payment intent:', paymentIntentId);
        const response = await supabase.functions.invoke('create-shopify-order', {
          body: { 
            paymentIntentId,
            customerInfo,
            addressInfo,
            cartItems,
            deliveryInfo,
            isAddingToOrder,
            useSameAddress
          }
        });
        
        if (response.error) {
          console.error('Error creating Shopify order:', response.error);
        } else {
          console.log('Shopify order created:', response.data);
          // Save last order info for potential future "add to order"
          if (response.data?.order) {
            const orderInfo = {
              orderNumber: response.data.order.order_number || response.data.order.id,
              total: finalTotal,
              date: new Date().toLocaleDateString(),
              orderId: response.data.order.id,
              address: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
              deliveryDate: deliveryInfo.date ? format(deliveryInfo.date, "yyyy-MM-dd") : '',
              deliveryTime: deliveryInfo.timeSlot || '',
              instructions: addressInfo.instructions || '',
              recentpurchase: true // Mark as recent purchase for app identification
            };
            localStorage.setItem('partyondelivery_last_order', JSON.stringify(orderInfo));
          }
        }
      } catch (error) {
        console.error('Failed to create Shopify order:', error);
      }
    }
    
    // Clear cart after successful order
    localStorage.removeItem('partyondelivery_cart');
    
    // Redirect to your domain (home page)
    if (window.top) {
      window.top.location.href = 'https://partyondelivery.com';
    } else {
      window.open('https://partyondelivery.com', '_blank');
    }
  };

  const isDateTimeComplete = deliveryInfo.date && deliveryInfo.timeSlot;
  const isAddressComplete = addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode;
  const isCustomerComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.phone && customerInfo.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex flex-col">
      <div className="flex-1">
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
                     <div className="text-lg font-semibold text-primary flex flex-wrap items-center justify-between gap-2">
                       <div className="flex flex-wrap items-center gap-2">
                         <span>Delivery:</span>
                         <span className="text-foreground">{deliveryInfo.date && format(deliveryInfo.date, "MMM d, yyyy")} • {deliveryInfo.timeSlot}</span>
                         {useSameAddress && !hasChanges && <span className="text-sm text-green-600">(Same as previous order)</span>}
                         {hasChanges && (changedFields.includes('delivery date') || changedFields.includes('delivery time')) && (
                           <span className="text-sm text-red-600 font-medium">
                             ({changedFields.includes('delivery date') && changedFields.includes('delivery time') ? 'Date & time changed' : 
                               changedFields.includes('delivery date') ? 'Date changed' : 'Time changed'})
                           </span>
                         )}
                       </div>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => {
                           setConfirmedDateTime(false);
                           setCurrentStep('datetime');
                         }}
                       >
                         Edit
                       </Button>
                     </div>
                   </div>
                 )}
                
                 {confirmedAddress && (
                   <div className="p-3 border border-black rounded-lg bg-muted/30">
                     <div className="text-lg font-semibold text-primary">
                       <div className="flex flex-wrap items-center justify-between gap-2">
                         <div className="flex flex-wrap items-center gap-2">
                           <span>Address:</span>
                           <span className="text-foreground">{addressInfo.street} • {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</span>
                           {useSameAddress && !hasChanges && <span className="text-sm text-green-600">(Same as previous order)</span>}
                           {hasChanges && (changedFields.includes('delivery address') || changedFields.includes('delivery instructions')) && (
                             <span className="text-sm text-red-600 font-medium">
                               ({changedFields.includes('delivery address') ? 'Address changed' : 'Instructions changed'})
                             </span>
                           )}
                         </div>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={() => {
                             setConfirmedAddress(false);
                             setCurrentStep('address');
                           }}
                         >
                           Edit
                         </Button>
                       </div>
                       {addressInfo.instructions && (
                         <div className="text-sm font-normal text-foreground mt-1">
                           {addressInfo.instructions}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
                
                {confirmedCustomer && (
                  <div className="p-3 border border-black rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold text-primary flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>Contact:</span>
                        <span className="text-foreground">{customerInfo.firstName} {customerInfo.lastName} • {customerInfo.phone} • {customerInfo.email}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setConfirmedCustomer(false);
                          setCurrentStep('customer');
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                 )}
                 
                 {/* Changes Warning */}
                 {hasChanges && (
                   <div className="p-3 border border-red-200 rounded-lg bg-red-50 text-red-800">
                     <div className="text-sm font-medium">
                       ⚠️ Changes detected: {changedFields.join(', ')}
                     </div>
                     <div className="text-xs mt-1">
                       Free delivery has been removed - this is being treated as a new order.
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
                      name="street-address"
                      autoComplete={isAddingToOrder ? "street-address" : "off"}
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
                        name="address-level2"
                        autoComplete={isAddingToOrder ? "address-level2" : "off"}
                        placeholder="Austin"
                        value={addressInfo.city}
                        onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="address-level1"
                        autoComplete={isAddingToOrder ? "address-level1" : "off"}
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
                      name="postal-code"
                      autoComplete={isAddingToOrder ? "postal-code" : "off"}
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
                        name="given-name"
                        autoComplete="given-name"
                        placeholder="John"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="family-name"
                        autoComplete="family-name"
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
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 123-4567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="john.doe@example.com"
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

            {/* Embedded Payment */}
            {currentStep === 'payment' && (
              <EmbeddedPaymentForm
                cartItems={cartItems}
                subtotal={discountedSubtotal}
                deliveryFee={finalDeliveryFee}
                salesTax={salesTax}
                customerInfo={customerInfo}
                deliveryInfo={{
                  ...deliveryInfo,
                  address: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
                  date: deliveryInfo.date ? format(deliveryInfo.date, "yyyy-MM-dd") : '',
                  time: deliveryInfo.timeSlot || ''
                }}
                appliedDiscount={appliedDiscount}
                onPaymentSuccess={handlePaymentSuccess}
                tipAmount={tipAmount}
                setTipAmount={handleTipChange}
              />
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
                         {(appliedDiscount?.type === 'free_shipping' || (isAddingToOrder && useSameAddress && !hasChanges)) && originalDeliveryFee > 0 && (
                           <span className="text-sm text-muted-foreground line-through">${(subtotal >= 200 ? subtotal * 0.1 : 20).toFixed(2)}</span>
                         )}
                         <span className={(appliedDiscount?.type === 'free_shipping' || (isAddingToOrder && useSameAddress && !hasChanges)) && originalDeliveryFee > 0 ? 'text-green-600' : ''}>
                           ${finalDeliveryFee.toFixed(2)}
                           {(isAddingToOrder && useSameAddress && !hasChanges) && finalDeliveryFee === 0 && (
                             <span className="text-xs text-green-600 ml-1">(Bundled Order)</span>
                           )}
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
      
      {/* Navigation Footer */}
      <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="text-sm text-muted-foreground">
            Step 4 of 4
          </div>
        </div>
      </div>
    </div>
  );
};