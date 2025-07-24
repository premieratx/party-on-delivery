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
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft, User, CreditCard, Plus, Minus, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format, addHours, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';
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
  appliedDiscount?: {code: string, type: 'percentage' | 'free_shipping', value: number} | null;
  affiliateCode?: string;
}

// Available time slots
const timeSlots = [
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM', 
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
  '8:00 PM - 9:00 PM',
  '8:30 PM - 9:30 PM'
];

const CST_TIMEZONE = 'America/Chicago';

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
  onChangesDetected,
  appliedDiscount: appliedDiscountProp,
  affiliateCode
}) => {
  const navigate = useNavigate();
  
  console.log('CheckoutFlow START - isAddingToOrder:', isAddingToOrder);
  
  // Use custom hooks for cleaner state management
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo, saveCompletedOrder } = useCustomerInfo();
  const checkoutFlow = useCheckoutFlow({ isAddingToOrder, lastOrderInfo, deliveryInfo, onDeliveryInfoChange, affiliateCode });
  
  // Track abandoned cart when checkout starts
  useEffect(() => {
    if (cartItems.length > 0 && !isAddingToOrder) {
      // Track abandoned order after 30 seconds of inactivity
      const abandonedTimer = setTimeout(async () => {
        try {
          const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const totalAmount = totalPrice;
          const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
          
          await supabase.functions.invoke('track-abandoned-order', {
            body: {
              sessionId,
              customerEmail: customerInfo.email || undefined,
              customerName: customerInfo.firstName && customerInfo.lastName ? 
                `${customerInfo.firstName} ${customerInfo.lastName}` : undefined,
              customerPhone: customerInfo.phone || undefined,
              deliveryAddress: addressInfo.street ? 
                `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}` : 
                undefined,
              affiliateCode: affiliateCode || undefined,
              cartItems,
              subtotal: subtotal.toString(),
              totalAmount: totalAmount.toString()
            }
          });
        } catch (error) {
          console.error('Error tracking abandoned order:', error);
        }
      }, 30000); // 30 seconds
      
      return () => clearTimeout(abandonedTimer);
    }
  }, [cartItems, customerInfo, addressInfo, affiliateCode, totalPrice, isAddingToOrder]);
  
  // State declarations must come before any usage
  const [tipAmount, setTipAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  
  // State for managing discount - initialize from parent prop (which uses localStorage)
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(
    appliedDiscountProp || null
  );
  
  // Sync local discount state with parent prop when it changes
  useEffect(() => {
    if (appliedDiscountProp !== undefined) {
      setAppliedDiscount(appliedDiscountProp);
      // Initialize discount code from applied discount
      if (appliedDiscountProp) {
        setDiscountCode(appliedDiscountProp.code);
      }
    }
  }, [appliedDiscountProp]);
  
  // Pricing calculations
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate delivery fee using proper rules with discount consideration
  const baseDeliveryFee = useDeliveryFee(subtotal, appliedDiscount);
  
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
  
  
  // Initialize step logic and pre-select today's date if no saved date exists
  useEffect(() => {
    if (!confirmedDateTime && !confirmedAddress && !confirmedCustomer) {
      setCurrentStep('datetime');
    }
    
    // Pre-select today's date if no date is set and no saved delivery info exists
    if (!deliveryInfo.date && (!lastOrderInfo?.deliveryDate)) {
      const today = new Date();
      updateDeliveryInfo('date', today);
      console.log('Pre-selected today for delivery date:', today);
    }
  }, []);

  // Get available time slots based on selected date (same logic as DeliveryScheduler)
  const getAvailableTimeSlots = () => {
    if (!deliveryInfo.date) return timeSlots;
    
    // Get current time in CST
    const nowCST = toZonedTime(new Date(), CST_TIMEZONE);
    const minDeliveryDateCST = addHours(nowCST, 1);
    
    // Convert selected date to CST for comparison
    const selectedDateCST = toZonedTime(deliveryInfo.date, CST_TIMEZONE);
    
    // If today is selected, filter out time slots that are within 1 hour from current CST time
    if (isToday(selectedDateCST)) {
      return timeSlots.filter(slot => {
        const [timeRange] = slot.split(' - ');
        const [time, period] = timeRange.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let slotHours = hours;
        if (period === 'PM' && hours !== 12) slotHours += 12;
        if (period === 'AM' && hours === 12) slotHours = 0;
        
        // Create a date object for the slot time in CST
        const slotDateTime = new Date(selectedDateCST);
        slotDateTime.setHours(slotHours, minutes, 0, 0);
        const slotDateTimeCST = toZonedTime(slotDateTime, CST_TIMEZONE);
        
        // Check if slot is at least 1 hour from current CST time
        return slotDateTimeCST >= minDeliveryDateCST;
      });
    }
    
    return timeSlots;
  };

  
  // Pre-select tip to be 10% in all cases - but only set once to avoid loops
  useEffect(() => {
    if (subtotal > 0 && tipAmount === 0) {
      const defaultTip = Math.round(subtotal * 0.10 * 100) / 100; // Always 10%, rounded
      setTipAmount(defaultTip);
      if (onTipChange) {
        onTipChange(defaultTip);
      }
    }
  }, [subtotal]); // Removed tipAmount and onTipChange dependencies to prevent re-triggering

  // Check if delivery details match previous order exactly for automatic free shipping
  const deliveryDetailsMatch = isAddingToOrder && 
    originalOrderInfo &&
    addressInfo.street === originalOrderInfo.address?.split(',')[0]?.trim() &&
    deliveryInfo.date && originalOrderInfo.deliveryDate &&
    new Date(deliveryInfo.date).toDateString() === new Date(originalOrderInfo.deliveryDate).toDateString() &&
    deliveryInfo.timeSlot === originalOrderInfo.deliveryTime;

  // Auto-apply PREMIER2025 for group orders and when details match (but don't override user-applied discounts)
  useEffect(() => {
    if (isAddingToOrder || affiliateCode) {
      // For group orders or affiliate referrals, always apply PREMIER2025 for free shipping unless user has a different discount
      if (!appliedDiscount || appliedDiscount.code === 'SAME_ORDER') {
        setAppliedDiscount({ code: 'PREMIER2025', type: 'free_shipping', value: 0 });
        setDiscountCode('PREMIER2025');
        if (onDiscountChange) {
          onDiscountChange({ code: 'PREMIER2025', type: 'free_shipping', value: 0 });
        }
      }
    } else if (deliveryDetailsMatch && (!appliedDiscount || appliedDiscount.code === 'SAME_ORDER')) {
      // For same order details matching, apply auto discount
      setAppliedDiscount({ code: 'SAME_ORDER', type: 'free_shipping', value: 0 });
      if (onDiscountChange) {
        onDiscountChange({ code: 'SAME_ORDER', type: 'free_shipping', value: 0 });
      }
    } else if (!deliveryDetailsMatch && appliedDiscount?.code === 'SAME_ORDER') {
      // Remove auto-applied discount if details no longer match but not for group orders
      if (!isAddingToOrder && !affiliateCode) {
        setAppliedDiscount(null);
        if (onDiscountChange) {
          onDiscountChange(null);
        }
      }
    }
  }, [deliveryDetailsMatch, appliedDiscount?.code, onDiscountChange, isAddingToOrder, affiliateCode]);

  // Calculate discounted subtotal for sales tax calculation
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  // Sales tax is always 8.25% applied to the subtotal (after discount if applicable)
  const salesTax = discountedSubtotal * 0.0825;
  
  // Final delivery fee (already calculated in useDeliveryFee with discount consideration)
  const finalDeliveryFee = baseDeliveryFee;
  
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
    if (!isDateTimeComplete) return;
    
    setConfirmedDateTime(true);
    
    // Navigate to next incomplete step or payment if all confirmed
    if (!confirmedAddress) {
      setCurrentStep('address');
    } else if (!confirmedCustomer) {
      setCurrentStep('customer');
    } else if (confirmedAddress && confirmedCustomer) {
      setCurrentStep('payment');
    }
    
    // Smooth scroll to top after state update
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleConfirmAddress = async () => {
    if (!isAddressComplete) return;
    
    setConfirmedAddress(true);
    
    // Navigate to next incomplete step or payment if all confirmed
    if (!confirmedCustomer) {
      setCurrentStep('customer');
    } else if (confirmedDateTime && confirmedCustomer) {
      setCurrentStep('payment');
    }
    
    // Smooth scroll to top after state update
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleConfirmCustomer = () => {
    // Validate email and phone before proceeding
    const emailErr = getEmailErrorMessage(customerInfo.email);
    const phoneErr = getPhoneErrorMessage(customerInfo.phone);
    
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    
    if (!emailErr && !phoneErr && customerInfo.firstName?.trim() && customerInfo.lastName?.trim()) {
      setConfirmedCustomer(true);
      
      // Only proceed to payment if all sections confirmed
      if (confirmedDateTime && confirmedAddress) {
        setCurrentStep('payment');
      }
      
      // Smooth scroll to top after state update
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    // Create Shopify order after successful payment
    if (paymentIntentId) {
      try {
        const response = await supabase.functions.invoke('create-shopify-order', {
          body: { 
            paymentIntentId,
            customerInfo,
            addressInfo,
            cartItems,
            deliveryInfo: {
              ...deliveryInfo,
              address: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`
            },
            isAddingToOrder,
            useSameAddress,
            // Pass pricing details for verification
            subtotal: discountedSubtotal,
            deliveryFee: finalDeliveryFee,
            salesTax: salesTax,
            tipAmount: tipAmount,
            appliedDiscount: appliedDiscount,
            affiliateCode: affiliateCode
          }
        });
        
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
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            items: cartItems.map(item => ({
              id: item.id,
              title: item.title,
              variant: item.variant,
              price: item.price,
              quantity: item.quantity
            })),
            recentpurchase: true,
            completedAt: new Date().toISOString(),
            expiresAt: ''
          };
          
          saveCompletedOrder(orderInfo);
          localStorage.setItem('partyondelivery_last_order', JSON.stringify(orderInfo));
        }
      } catch (error) {
        console.error('Failed to create Shopify order:', error);
      }
    }
    
    // Clear cart and discount after successful order
    cartItems.forEach(item => {
      onUpdateQuantity(item.id, item.variant, 0);
    });
    
    localStorage.removeItem('partyondelivery_cart');
    localStorage.removeItem('partyondelivery_applied_discount'); // Clear discount after transaction
    navigate('/order-complete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5">
      <div className="relative">
        
        {/* Mobile-optimized back button */}
        <div className="p-3 md:p-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="text-xs md:text-sm py-2 px-3 md:py-2 md:px-4"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Back to Products
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-3 md:px-4 space-y-4 md:space-y-6">
          {/* Compact Header */}
          <Card className="shadow-floating animate-fade-in">
            <CardHeader className="text-center py-3 md:py-6">
              <CardTitle className="text-lg md:text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-1 md:gap-2">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                Complete Your Order
              </CardTitle>
              <p className="text-muted-foreground text-xs md:text-sm">
                Confirm your details step by step
              </p>
            </CardHeader>
          
            {/* Add-to-Order Notice */}
            {isAddingToOrder && (
              <CardContent className="border-t py-2 md:py-4">
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm md:text-base text-blue-800 font-medium text-center">
                    Adding to Previous Order
                  </p>
                  <p className="text-xs text-blue-600 text-center mt-1">
                    Match previous details for free delivery
                  </p>
                </div>
                
                {/* Changes Warning */}
                {hasChanges && (
                  <div className="p-3 border border-red-200 rounded-lg bg-red-50 text-red-800 mt-3">
                    <div className="text-sm font-medium">
                      ⚠️ Details don't match previous order
                    </div>
                    <div className="text-xs mt-2 space-y-1">
                      <div><strong>Previous order:</strong></div>
                      {originalOrderInfo?.address && (
                        <div>• Address: {originalOrderInfo.address}</div>
                      )}
                      {originalOrderInfo?.deliveryDate && (
                        <div>• Date: {format(new Date(originalOrderInfo.deliveryDate), "EEEE, MMMM do")}</div>
                      )}
                      {originalOrderInfo?.deliveryTime && (
                        <div>• Time: {originalOrderInfo.deliveryTime}</div>
                      )}
                      <div className="mt-2 font-medium text-xs">
                        Match these details to add to that order and get free delivery
                      </div>
                    </div>
                  </div>
                )}
             </CardContent>
           )}
          </Card>

          {/* Confirmed sections displayed compactly at top */}
          {(confirmedDateTime || confirmedAddress || confirmedCustomer) && (
            <div className="space-y-2">
              {confirmedDateTime && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        <div>
                          <span className="text-xs font-medium text-green-800">Delivery Time: </span>
                          <span className="text-xs text-green-700">
                            {format(new Date(deliveryInfo.date!), 'MMM d')} at {deliveryInfo.timeSlot}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmedDateTime(false);
                          setCurrentStep('datetime');
                        }}
                        className="text-green-600 hover:text-green-800 h-6 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {confirmedAddress && (
                <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <span className="text-xs font-medium text-blue-800">Address: </span>
                          <span className="text-xs text-blue-700">
                            {addressInfo.street}, {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmedAddress(false);
                          setCurrentStep('address');
                        }}
                        className="text-blue-600 hover:text-blue-800 h-6 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {confirmedCustomer && (
                <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                        <div>
                          <span className="text-xs font-medium text-purple-800">Contact: </span>
                          <span className="text-xs text-purple-700">
                            {customerInfo.firstName} {customerInfo.lastName} • {customerInfo.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmedCustomer(false);
                          setCurrentStep('customer');
                        }}
                        className="text-purple-600 hover:text-purple-800 h-6 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* Step-by-Step Forms - Mobile optimized */}
            <div className="space-y-3 md:space-y-6">
               
                {/* Date/Time Section - Only show when not confirmed */}
                {!confirmedDateTime && (
                  <Card className={`shadow-card ${currentStep === 'datetime' ? 'border-2 border-green-500' : 'border'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Schedule Your Delivery
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
                                 disabled={(date) => {
                                   // Allow same-day delivery but prevent past dates and Sundays
                                   const today = new Date();
                                   today.setHours(0, 0, 0, 0); // Reset time to start of day
                                   
                                   const checkDay = new Date(date);
                                   checkDay.setHours(0, 0, 0, 0); // Reset time to start of day
                                   
                                   // Check if it's Sunday (0 = Sunday)
                                   const isSunday = date.getDay() === 0;
                                   
                                   // Check if the date is before today (not including today)
                                   const isBeforeToday = checkDay.getTime() < today.getTime();
                                   
                                   return isBeforeToday || isSunday;
                                 }}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                         <div className="space-y-2">
                           <Label>Delivery Time *</Label>
                           <p className="text-xs text-muted-foreground">
                             Same-day delivery available with 1-hour advance notice. We're closed Sundays.
                           </p>
                           <Select 
                             value={deliveryInfo.timeSlot} 
                             onValueChange={(value) => updateDeliveryInfo('timeSlot', value)}
                           >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                             <SelectContent className="z-50 bg-background">
                               {getAvailableTimeSlots().map((slot) => (
                                 <SelectItem key={slot} value={slot}>
                                   <div className="flex items-center gap-2">
                                     <Clock className="w-4 h-4" />
                                     {slot}
                                   </div>
                                 </SelectItem>
                               ))}
                               {getAvailableTimeSlots().length === 0 && (
                                 <div className="p-2 text-sm text-muted-foreground text-center">
                                   No time slots available today. Please select a future date.
                                 </div>
                               )}
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
                      </div>
                    </CardContent>
                  </Card>
                )}

               {/* Address Section - Only show when not confirmed */}
               {!confirmedAddress && (
                <Card className={`shadow-card ${currentStep === 'address' ? 'border-2 border-green-500' : 'border'}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  
                    <CardContent className="space-y-2 md:space-y-4">
                       <div className="space-y-2 md:space-y-4">
                         <div className="space-y-1 md:space-y-2">
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
                        
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          <div className="space-y-1 md:space-y-2">
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
                          <div className="space-y-1 md:space-y-2">
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
                        
                        <div className="space-y-1 md:space-y-2">
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
                        
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                          <Textarea
                            id="instructions"
                            placeholder="Apartment number, gate code, delivery preferences..."
                            value={addressInfo.instructions}
                            onChange={(e) => setAddressInfo(prev => ({ ...prev, instructions: e.target.value }))}
                            className="min-h-[50px] md:min-h-[80px]"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleConfirmAddress}
                          disabled={!isAddressComplete}
                          className="w-full"
                        >
                          Confirm Address
                        </Button>
                        </div>
                     </CardContent>
                   </Card>
                )}

              {/* Customer Information - Only show when not confirmed */}
              {!confirmedCustomer && (
                <Card className={`shadow-card ${currentStep === 'customer' ? 'border-2 border-green-500' : 'border'}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Contact Information
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
                          Confirm Contact Info
                        </Button>
                      </div>
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
                deliveryPricing={{ fee: baseDeliveryFee, minimumOrder: 0, isDistanceBased: false }}
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
                       <p className="font-semibold min-w-[50px] sm:min-w-[60px] text-right text-xs sm:text-sm">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
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
                         <span>${(subtotal || 0).toFixed(2)}</span>
                       </div>
                       {appliedDiscount?.type === 'percentage' && (
                         <div className="flex justify-between text-green-600">
                           <span>Discount ({appliedDiscount.value}% off)</span>
                           <span>-${((subtotal || 0) * (appliedDiscount.value || 0) / 100).toFixed(2)}</span>
                         </div>
                       )}
                          <div className="flex justify-between">
                            <span>Delivery Fee {subtotal >= 200 ? '(10%)' : '($20 min)'}</span>
                             <div className="flex items-center gap-2">
                                 {appliedDiscount?.type === 'free_shipping' && (
                                   <span className="text-sm text-muted-foreground line-through">${(subtotal >= 200 ? subtotal * 0.1 : 20).toFixed(2)}</span>
                                 )}
                                 <span className={appliedDiscount?.type === 'free_shipping' ? 'text-green-600' : ''}>
                                   ${(finalDeliveryFee || 0).toFixed(2)}
                                   {appliedDiscount?.type === 'free_shipping' && finalDeliveryFee === 0 && (
                                     <span className="text-xs text-green-600 ml-1">(Free shipping)</span>
                                   )}
                                   {(isAddingToOrder && !hasChanges) && finalDeliveryFee === 0 && (
                                    <span className="text-xs text-green-600 ml-1">(Bundled Order)</span>
                                  )}
                               </span>
                             </div>
                          </div>
                       <div className="flex justify-between">
                         <span>Sales Tax (8.25%)</span>
                         <span>${(salesTax || 0).toFixed(2)}</span>
                       </div>
                       {tipAmount > 0 && (
                         <div className="flex justify-between">
                           <span>Driver Tip</span>
                           <span>${(tipAmount || 0).toFixed(2)}</span>
                         </div>
                       )}
                       <Separator />
                       <div className="flex justify-between font-bold text-lg">
                         <span>Total</span>
                         <span>${(finalTotal || 0).toFixed(2)}</span>
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