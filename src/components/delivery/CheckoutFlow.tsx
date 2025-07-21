import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddedPaymentForm } from '@/components/payment/EmbeddedPaymentForm';

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
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft, User, CreditCard, Plus, Minus } from 'lucide-react';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';
import { validateEmail, validatePhoneNumber, formatPhoneNumber, getEmailErrorMessage, getPhoneErrorMessage } from '@/utils/validation';

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
  // Use custom hooks for cleaner state management
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  const checkoutFlow = useCheckoutFlow({ isAddingToOrder, lastOrderInfo, deliveryInfo, onDeliveryInfoChange });
  const { deliveryPricing, isPricingLoading } = useDeliveryPricing({ 
    addressInfo, 
    subtotal: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    isAddingToOrder,
    hasChanges: checkoutFlow.hasChanges
  });
  
  // Extract from checkout flow hook
  const {
    currentStep,
    setCurrentStep,
    confirmedDateTime,
    setConfirmedDateTime,
    confirmedAddress,
    setConfirmedAddress,
    confirmedCustomer,
    setConfirmedCustomer,
    originalOrderInfo,
    hasChanges,
    changedFields,
    updateDeliveryInfo,
    isDateTimeComplete,
    isAddressComplete,
    isCustomerComplete
  } = checkoutFlow;

  // Local UI state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [hasAddressBeenCleared, setHasAddressBeenCleared] = useState(false);

  // For new orders, clear address info once
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
  }, [isAddingToOrder, hasAddressBeenCleared]);

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
  
  // State declarations
  const [tipAmount, setTipAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(null);

  // Check if delivery details match previous order exactly for automatic free shipping
  const deliveryDetailsMatch = isAddingToOrder && 
    originalOrderInfo &&
    addressInfo.street === originalOrderInfo.address?.split(',')[0]?.trim() &&
    deliveryInfo.date && originalOrderInfo.deliveryDate &&
    new Date(deliveryInfo.date).toDateString() === new Date(originalOrderInfo.deliveryDate).toDateString() &&
    deliveryInfo.timeSlot === originalOrderInfo.deliveryTime;

  // Auto-apply free shipping when details match (overrides any other discount)
  useEffect(() => {
    if (deliveryDetailsMatch) {
      setAppliedDiscount({ code: 'SAME_ORDER', type: 'free_shipping', value: 0 });
      if (onDiscountChange) {
        onDiscountChange({ code: 'SAME_ORDER', type: 'free_shipping', value: 0 });
      }
    } else if (appliedDiscount?.code === 'SAME_ORDER') {
      // Remove auto-applied discount if details no longer match
      setAppliedDiscount(null);
      if (onDiscountChange) {
        onDiscountChange(null);
      }
    }
  }, [deliveryDetailsMatch, appliedDiscount?.code, onDiscountChange]);

  const salesTax = subtotal * 0.0825;
  
  // Calculate discounted subtotal
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  // Calculate delivery fee using hook data
  const baseDeliveryFee = deliveryPricing.fee;
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : baseDeliveryFee;
  
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

  const handleConfirmDateTime = () => {
    if (isDateTimeComplete) {
      setConfirmedDateTime(true);
      // Navigate to next incomplete step
      if (!confirmedAddress) {
        setCurrentStep('address');
      } else if (!confirmedCustomer) {
        setCurrentStep('customer');
      } else {
        setCurrentStep('payment');
      }
      // Scroll to top of next section on mobile
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleConfirmAddress = async () => {
    if (isAddressComplete) {
      // Delivery pricing is automatically calculated by the hook
      setConfirmedAddress(true);
      // Navigate to next incomplete step
      if (!confirmedCustomer) {
        setCurrentStep('customer');
      } else {
        setCurrentStep('payment');
      }
      // Scroll to top of next section on mobile
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleConfirmCustomer = () => {
    // Validate email and phone before proceeding
    const emailErr = getEmailErrorMessage(customerInfo.email);
    const phoneErr = getPhoneErrorMessage(customerInfo.phone);
    
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    
    if (!emailErr && !phoneErr && customerInfo.firstName && customerInfo.lastName) {
      setConfirmedCustomer(true);
      setCurrentStep('payment');
      // Scroll to top of next section on mobile
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    console.log('Payment success called with:', {
      paymentIntentId,
      cartItemsCount: cartItems.length,
      cartItems: cartItems.map(item => ({ id: item.id, title: item.title, quantity: item.quantity }))
    });
    
    // Create Shopify order after successful payment
    if (paymentIntentId) {
      try {
        console.log('Creating Shopify order with items:', cartItems.length);
        
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
    
    console.log('About to clear cart and redirect. Current cart items:', cartItems.length);
    // Clear cart after successful order
    cartItems.forEach(item => {
      onUpdateQuantity(item.id, item.variant, 0);
    });
    
    // Also clear localStorage as backup
    localStorage.removeItem('partyondelivery_cart');
    
    // Redirect to order complete page
    if (window.top) {
      window.top.location.href = '/order-complete';
    } else {
      window.open('/order-complete', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      <div className="flex-1">
        {/* Mobile-optimized back button */}
        <div className="p-2 pt-1 md:p-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mb-1 md:mb-4 text-xs md:text-sm py-1 px-2 md:py-2 md:px-4 h-auto"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Back to Products
          </Button>
        </div>

        <div className="max-w-4xl mx-auto px-2 md:px-4 space-y-2 md:space-y-6">
          {/* Compact Header */}
          <Card className="shadow-floating animate-fade-in">
            <CardHeader className="text-center py-2 md:py-6">
              <CardTitle className="text-lg md:text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-1 md:gap-2">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                Complete Your Order
              </CardTitle>
              <p className="text-muted-foreground text-xs md:text-sm">
                Confirm your details step by step
              </p>
            </CardHeader>
          
            {/* Confirmation Summary - Condensed for mobile */}
            {(confirmedDateTime || confirmedAddress || confirmedCustomer) && (
              <CardContent className="border-t py-2 md:py-4">
                {isAddingToOrder && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm md:text-base text-blue-800 font-medium text-center">
                      Please Confirm Previous Delivery Details
                    </p>
                    <p className="text-xs text-blue-600 text-center mt-1">
                      (Edit to make changes)
                    </p>
                  </div>
                )}
                <div className="space-y-1 md:space-y-3">
                   {confirmedDateTime && (
                     <div className="p-1.5 md:p-3 border border-black rounded-lg bg-muted/30">
                        <div className="text-xs md:text-lg font-semibold text-primary flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                            <span className="shrink-0 text-xs md:text-sm">Date & Time:</span>
                            <span className="text-foreground text-xs md:text-sm truncate">
                              {deliveryInfo.date ? format(deliveryInfo.date, "MMM d") : ''} 
                              {deliveryInfo.date && deliveryInfo.timeSlot ? ' • ' : ''}
                              {deliveryInfo.timeSlot || ''}
                            </span>
            {isAddingToOrder && !hasChanges && <span className="text-xs text-green-600 hidden md:inline">(Same as previous)</span>}
            {hasChanges && (changedFields.includes('delivery date') || changedFields.includes('delivery time')) && (
              <span className="text-xs text-red-600 font-medium hidden md:inline">
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
                            className="shrink-0 text-xs px-2 py-1 h-auto"
                          >
                            Edit
                         </Button>
                       </div>
                     </div>
                   )}
                
                   {confirmedAddress && (
                     <div className="p-1.5 md:p-3 border border-black rounded-lg bg-muted/30">
                       <div className="text-xs md:text-lg font-semibold text-primary flex items-center justify-between gap-2">
                         <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                           <span className="shrink-0 text-xs md:text-sm">Address:</span>
                           <span className="text-foreground text-xs md:text-sm truncate">{addressInfo.street} • {addressInfo.city}, {addressInfo.state}</span>
            {isAddingToOrder && !hasChanges && <span className="text-xs text-green-600 hidden md:inline">(Same as previous)</span>}
            {hasChanges && (changedFields.includes('delivery address')) && (
              <span className="text-xs text-red-600 font-medium hidden md:inline">(Address changed)</span>
            )}
                         </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setConfirmedAddress(false);
                              setCurrentStep('address');
                            }}
                            className="shrink-0 text-xs px-2 py-1 h-auto"
                          >
                            Edit
                          </Button>
                       </div>
                       {addressInfo.instructions && (
                         <div className="text-xs md:text-sm font-normal text-foreground mt-1">
                           {addressInfo.instructions}
                         </div>
                       )}
                     </div>
                   )}
                
                  {confirmedCustomer && (
                    <div className="p-1.5 md:p-3 border border-black rounded-lg bg-muted/30">
                      <div className="text-xs md:text-lg font-semibold text-primary flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                          <span className="shrink-0 text-xs md:text-sm">Contact:</span>
                          <span className="text-foreground text-xs md:text-sm truncate">{customerInfo.firstName} {customerInfo.lastName} • {customerInfo.phone}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setConfirmedCustomer(false);
                            setCurrentStep('customer');
                          }}
                          className="shrink-0 text-xs px-2 py-1 h-auto"
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

         <div className="grid md:grid-cols-2 gap-2 md:gap-6">
           {/* Step-by-Step Forms - Smart display based on data state */}
           <div className="space-y-2 md:space-y-6">
             
              {/* Date/Time Section */}
              <Card className={`shadow-card ${currentStep === 'datetime' ? 'border-2 border-green-500' : 'border'}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Schedule Your Delivery
                    {confirmedDateTime && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-4">
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
                      {confirmedDateTime ? "Date & Time Confirmed" : "Confirm Date & Time"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

             {/* Address Section */}
             <Card className={`shadow-card ${currentStep === 'address' ? 'border-2 border-green-500' : 'border'}`}>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <MapPin className="w-5 h-5" />
                   Delivery Address
                   {confirmedAddress && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                 </CardTitle>
               </CardHeader>
               
               <CardContent className="space-y-4">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="street">Street Address *</Label>
                      <GooglePlacesAutocomplete
                        value={addressInfo.street}
                        onChange={(value) => setAddressInfo(prev => ({ ...prev, street: value }))}
                        onPlaceSelect={(place) => {
                          const components = place.address_components || [];
                          const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || '';
                          const route = components.find(c => c.types.includes('route'))?.long_name || '';
                          const city = components.find(c => c.types.includes('locality'))?.long_name || 
                                      components.find(c => c.types.includes('sublocality'))?.long_name || '';
                          const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
                          const zipCode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
                          
                          setAddressInfo(prev => ({
                            ...prev,
                            street: `${streetNumber} ${route}`.trim(),
                            city: city,
                            state: state, 
                            zipCode: zipCode
                          }));
                        }}
                       placeholder="Start typing your address..."
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
                    {confirmedAddress ? "Address Confirmed" : "Confirm Address"}
                  </Button>
                 </div>
               </CardContent>
             </Card>

            {/* Customer Information */}
            <Card className={`shadow-card ${currentStep === 'customer' ? 'border-2 border-green-500' : 'border'}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                  {confirmedCustomer && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-4">
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
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setCustomerInfo(prev => ({ ...prev, phone: formatted }));
                        if (phoneError) setPhoneError(null);
                      }}
                      className={phoneError ? 'border-red-500' : ''}
                    />
                    {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
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
                      onChange={(e) => {
                        setCustomerInfo(prev => ({ ...prev, email: e.target.value }));
                        if (emailError) setEmailError(null);
                      }}
                      className={emailError ? 'border-red-500' : ''}
                    />
                    {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  </div>
                  
                  <Button 
                    onClick={handleConfirmCustomer}
                    disabled={!isCustomerComplete}
                    className="w-full"
                  >
                    {confirmedCustomer ? "Contact Info Confirmed" : "Confirm Contact Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                deliveryPricing={deliveryPricing}
                isAddingToOrder={isAddingToOrder}
                useSameAddress={useSameAddress}
                hasChanges={hasChanges}
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                handleApplyDiscount={handleApplyDiscount}
                handleRemoveDiscount={handleRemoveDiscount}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-2 md:space-y-6">
            <Card className="shadow-card">
              <CardHeader className="py-2 md:py-6">
                <CardTitle className="text-sm md:text-lg flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                  Order Summary ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 {cartItems.map((item) => (
                   <div key={`${item.id}-${item.variant || ''}`} className="flex justify-between items-center gap-2">
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-xs sm:text-sm line-clamp-2">{item.title.replace(/(\d+)\s*Pack/gi, '$1pk').replace(/(\d+)\s*oz/gi, '$1oz').replace(/Can/gi, '').replace(/Hard Seltzer/gi, '').replace(/\s+/g, ' ').trim()}</p>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs sm:text-sm text-muted-foreground">${item.price} each</span>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                       {/* Quantity Controls */}
                       <div className="flex items-center gap-1">
                         <Button
                           variant="outline"
                           size="icon"
                           className="h-6 w-6 sm:h-7 sm:w-7"
                           onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity - 1)}
                         >
                           <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                         </Button>
                         
                         <Badge variant="secondary" className="min-w-[28px] sm:min-w-[35px] justify-center px-1 sm:px-2 text-xs">
                           {item.quantity}
                         </Badge>
                         
                         <Button
                           variant="outline"
                           size="icon"
                           className="h-6 w-6 sm:h-7 sm:w-7"
                           onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                         >
                           <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                         </Button>
                       </div>
                       
                       {/* Total Price for Item */}
                       <p className="font-semibold min-w-[50px] sm:min-w-[60px] text-right text-xs sm:text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                     </div>
                   </div>
                ))}
                
                <Separator />
                
                 {/* Only show pricing summary during payment step or when not on payment step */}
                 {currentStep !== 'payment' && (
                   <>
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
                               {(appliedDiscount?.type === 'free_shipping' || (isAddingToOrder && !hasChanges)) && baseDeliveryFee > 0 && (
                                 <span className="text-sm text-muted-foreground line-through">${baseDeliveryFee.toFixed(2)}</span>
                               )}
                               <span className={(appliedDiscount?.type === 'free_shipping' || (isAddingToOrder && !hasChanges)) && baseDeliveryFee > 0 ? 'text-green-600' : ''}>
                                 ${finalDeliveryFee.toFixed(2)}
                                 {(isAddingToOrder && !hasChanges) && finalDeliveryFee === 0 && (
                                   <span className="text-xs text-green-600 ml-1">(Bundled Order)</span>
                                 )}
                                {deliveryPricing.isDistanceBased && deliveryPricing.distance && (
                                  <span className="text-xs text-muted-foreground ml-1">({deliveryPricing.distance.toFixed(1)} mi)</span>
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
                   </>
                 )}
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