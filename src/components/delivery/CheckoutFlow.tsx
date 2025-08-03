// CRITICAL: DO NOT MODIFY IMPORTS WITHOUT TESTING CHECKOUT FLOW END-TO-END
import { calculateDistanceBasedDeliveryFee, getStandardDeliveryFee } from '@/utils/deliveryPricing';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddedPaymentForm } from '@/components/payment/EmbeddedPaymentForm';
import { TimeSelector } from './TimeSelector';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';


// Removed SimpleDatePicker import - using native date input
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ShoppingBag, ExternalLink, ArrowLeft, User, CreditCard, Plus, Minus, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { format, addHours, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getActiveDeliveryInfo, formatDeliveryDate, parseDeliveryDate } from '@/utils/deliveryInfoManager';
import { cn } from '@/lib/utils';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useToast } from '@/hooks/use-toast';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useProgressSaver } from '@/hooks/useProgressSaver';
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
  '7:30 PM - 8:30 PM',
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
  const { saveOrderDraft, saveProgress } = useProgressSaver();
  
  // Ensure checkout flow state is accessible
  const { 
    currentStep, 
    setCurrentStep, 
    confirmedDateTime, 
    confirmedAddress, 
    confirmedCustomer,
    updateDeliveryInfo,
    isDateTimeComplete,
    isAddressComplete,
    isCustomerComplete,
    hasChanges,
    changedFields
  } = checkoutFlow;
  
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
  
  // Pricing calculations - moved before state declarations
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // State declarations must come before any usage  
  const [tipAmount, setTipAmount] = useState(() => {
    // Always start with a minimum $2 tip (10% of $20 minimum order) for new checkouts
    const calculatedTip = Math.round(subtotal * 0.10 * 100) / 100;
    return Math.max(calculatedTip, 2.00);
  });
  const [tipType, setTipType] = useState<'percentage' | 'custom'>('percentage'); // Track tip type
  const [tipPercentage, setTipPercentage] = useState(10); // Track selected percentage
  const [discountCode, setDiscountCode] = useState('');
  
  // State for managing discount - initialize from parent prop (which uses localStorage)
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(
    appliedDiscountProp || null
  );
  
  // Check for custom site free shipping and auto-apply
  useEffect(() => {
    const freeShippingEnabled = localStorage.getItem('free_shipping_enabled') === 'true';
    const customSiteData = localStorage.getItem('customSiteData');
    
    if (freeShippingEnabled && customSiteData) {
      const siteData = JSON.parse(customSiteData);
      if (siteData.promoCode && !appliedDiscount) {
        const customSiteDiscount = {
          code: siteData.promoCode,
          type: 'free_shipping' as const,
          value: 0
        };
        setAppliedDiscount(customSiteDiscount);
        setDiscountCode(siteData.promoCode);
        if (onDiscountChange) {
          onDiscountChange(customSiteDiscount);
        }
        console.log('Auto-applied custom site free shipping:', customSiteDiscount);
      }
    }
  }, []);
  
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
  
  // Calculate delivery fee using proper rules with discount consideration
  const baseDeliveryFee = useDeliveryFee(subtotal, appliedDiscount);
  
  // State for distance-based delivery pricing
  const [distanceDeliveryFee, setDistanceDeliveryFee] = useState<number>(baseDeliveryFee);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  
  // Extract additional properties from checkout flow hook
  const {
    originalOrderInfo,
    setConfirmedDateTime,
    setConfirmedAddress,
    setConfirmedCustomer
  } = checkoutFlow;

  // Local UI state
  const [previousStep, setPreviousStep] = useState<'datetime' | 'address' | 'payment'>('payment'); // Track step to return to after editing
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  
  // Initialize step logic - only run once on mount
  useEffect(() => {
    console.log('Initializing checkout step logic - Current confirmations:', {
      confirmedDateTime,
      confirmedAddress,
      isDateTimeComplete,
      isAddressComplete,
      isCustomerComplete
    });

    // Only set initial step if not already confirmed
    if (!confirmedDateTime && !confirmedAddress) {
      console.log('Starting fresh checkout - going to datetime step');
      setCurrentStep('datetime');
    } else if (confirmedDateTime && !confirmedAddress) {
      console.log('DateTime confirmed, going to address step');
      setCurrentStep('address');
    } else if (confirmedDateTime && confirmedAddress) {
      console.log('Both sections confirmed, going to payment');
      setCurrentStep('payment');
    }
    
    // Pre-select today's date if no date is set and no saved delivery info exists
    if (!deliveryInfo.date && (!lastOrderInfo?.deliveryDate)) {
      const today = new Date();
      updateDeliveryInfo('date', today);
      console.log('Pre-selected today for delivery date:', today);
    }
  }, []); // Only run once on mount

  // Get available time slots based on selected date (same logic as DeliveryScheduler)
  const getAvailableTimeSlots = () => {
    if (!deliveryInfo.date) return timeSlots;
    
    // Get current time in CST
    const CST_TIMEZONE = 'America/Chicago';
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
        
        // Create a date object for the slot time
        const slotDateTime = new Date(selectedDateCST);
        slotDateTime.setHours(slotHours, minutes, 0, 0);
        
        // Check if slot is at least 1 hour from current time
        return slotDateTime >= minDeliveryDateCST;
      });
    }
    
    return timeSlots;
  };

  // Calculate distance-based delivery fee when address is available
  useEffect(() => {
    const calculateDeliveryFee = async () => {
      // Only calculate if we have a complete address and no free shipping discount
      if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode && appliedDiscount?.type !== 'free_shipping') {
        setIsCalculatingDelivery(true);
        console.log('🚚 Calculating distance-based delivery fee for:', {
          address: addressInfo.street,
          city: addressInfo.city,
          state: addressInfo.state,
          zip: addressInfo.zipCode,
          subtotal
        });
        
        try {
          const pricing = await calculateDistanceBasedDeliveryFee(
            addressInfo.street,
            addressInfo.city,
            addressInfo.state,
            addressInfo.zipCode,
            subtotal
          );
          
          setDistanceDeliveryFee(pricing.fee);
          setDeliveryDistance(pricing.distance || null);
          
          console.log('🚚 Distance-based delivery fee calculated:', {
            fee: pricing.fee,
            distance: pricing.distance,
            isDistanceBased: pricing.isDistanceBased,
            minimumOrder: pricing.minimumOrder
          });
        } catch (error) {
          console.error('❌ Failed to calculate distance-based delivery fee:', error);
          // Fallback to standard delivery fee
          const standardPricing = getStandardDeliveryFee(subtotal);
          setDistanceDeliveryFee(standardPricing.fee);
        } finally {
          setIsCalculatingDelivery(false);
        }
      } else if (appliedDiscount?.type === 'free_shipping') {
        // Free shipping applied
        setDistanceDeliveryFee(0);
        setDeliveryDistance(null);
      } else {
        // No address yet, use base delivery fee
        setDistanceDeliveryFee(baseDeliveryFee);
        setDeliveryDistance(null);
      }
    };

    calculateDeliveryFee();
  }, [addressInfo.street, addressInfo.city, addressInfo.state, addressInfo.zipCode, subtotal, appliedDiscount, baseDeliveryFee]);


  
  // Handle tip calculation based on type
  useEffect(() => {
    if (subtotal > 0) {
      if (tipType === 'percentage') {
        // Recalculate percentage-based tips when subtotal changes
        const newTipAmount = Math.round(subtotal * (tipPercentage / 100) * 100) / 100;
        setTipAmount(newTipAmount);
        if (onTipChange) {
          onTipChange(newTipAmount);
        }
      }
      // For custom tips, don't change the amount when subtotal changes
    }
    // Don't reset tip to 0 when subtotal is 0 - keep the 10% preset
  }, [subtotal, tipType, tipPercentage]); // Only recalculate when these change

  // Check if delivery details match previous order exactly for automatic free shipping
  const deliveryDetailsMatch = isAddingToOrder && 
    originalOrderInfo &&
    addressInfo.street === originalOrderInfo.address?.split(',')[0]?.trim() &&
    deliveryInfo.date && originalOrderInfo.deliveryDate &&
    new Date(deliveryInfo.date + 'T12:00:00').toDateString() === new Date(originalOrderInfo.deliveryDate + 'T12:00:00').toDateString() &&
    deliveryInfo.timeSlot === originalOrderInfo.deliveryTime;

  // Enhanced group order matching using single source of truth
  const activeDeliveryInfo = getActiveDeliveryInfo();
  const isGroupOrderMatch = activeDeliveryInfo.source === 'group_order' && (() => {
    const groupData = activeDeliveryInfo.data;
    const groupAddress = activeDeliveryInfo.addressInfo;
    
    if (groupData) {
      const deliveryDateStr = deliveryInfo.date instanceof Date ? deliveryInfo.date.toISOString().split('T')[0] : deliveryInfo.date;
      const groupDateStr = groupData.date instanceof Date ? groupData.date.toISOString().split('T')[0] : groupData.date;
      
      const dateMatch = deliveryDateStr && groupDateStr &&
        parseDeliveryDate(deliveryDateStr).toDateString() === parseDeliveryDate(groupDateStr).toDateString();
      const timeMatch = deliveryInfo.timeSlot === groupData.timeSlot;
      const addressMatch = groupAddress ? addressInfo.street === groupAddress.street : addressInfo.street === groupData.address;
      
      console.log('🎯 Group order match check:', { dateMatch, timeMatch, addressMatch });
      return dateMatch && timeMatch && addressMatch;
    }
    return false;
    return false;
  })();

  // Auto-apply group discount for group orders - check localStorage first, then fetch if needed
  useEffect(() => {
    console.log('🔄 Discount effect triggered:', { 
      isAddingToOrder, 
      affiliateCode, 
      appliedDiscount: appliedDiscount?.code,
      hasStoredDiscount: !!localStorage.getItem('partyondelivery_applied_discount')
    });
    
    if (isAddingToOrder || affiliateCode) {
      // First check if discount was already set in localStorage from GroupOrderView
      const storedDiscount = localStorage.getItem('partyondelivery_applied_discount');
      if (storedDiscount && isAddingToOrder && !appliedDiscount) {
        try {
          const parsedDiscount = JSON.parse(storedDiscount);
          if (parsedDiscount.code && (parsedDiscount.code.startsWith('GROUP-SHIPPING-') || parsedDiscount.code === 'PREMIER2025')) {
            console.log('✅ Using pre-stored group discount:', parsedDiscount);
            setAppliedDiscount(parsedDiscount);
            setDiscountCode(parsedDiscount.code);
            if (onDiscountChange) {
              onDiscountChange(parsedDiscount);
            }
            return; // Exit early since we found the discount
          }
        } catch (error) {
          console.log('Error parsing stored discount, will fetch:', error);
        }
      }
      
      // Only fetch group order if we're actually adding to an order AND have a valid token
      const groupOrderToken = localStorage.getItem('groupOrderToken');
      if (groupOrderToken && isAddingToOrder && !appliedDiscount) {
        console.log('🔗 Group order token found, fetching buyer info:', groupOrderToken);
        supabase.functions.invoke('get-group-order', {
          body: { shareToken: groupOrderToken }
        }).then(({ data, error }) => {
          console.log('📊 Group order response:', { data, error });
          
          if (data?.success && data.originalOrder) {
            const customerName = data.originalOrder.customer_name || '';
            const lastName = customerName.split(' ').pop()?.toUpperCase() || 'ORDER';
            const groupDiscountCode = `GROUP-SHIPPING-${lastName}`;
            
            console.log('✅ Generated group discount code:', groupDiscountCode);
            
            const discount = { code: groupDiscountCode, type: 'free_shipping' as const, value: 0 };
            setAppliedDiscount(discount);
            setDiscountCode(groupDiscountCode);
            if (onDiscountChange) {
              onDiscountChange(discount);
            }
            
            // Store for future use
            localStorage.setItem('partyondelivery_applied_discount', JSON.stringify(discount));
          } else {
            console.log('❌ Could not get original order info or token is invalid, clearing group token. Error:', error);
            // Clear invalid group token and use fallback
            localStorage.removeItem('groupOrderToken');
            const fallbackDiscount = { code: 'PREMIER2025', type: 'free_shipping' as const, value: 0 };
            setAppliedDiscount(fallbackDiscount);
            setDiscountCode('PREMIER2025');
            if (onDiscountChange) {
              onDiscountChange(fallbackDiscount);
            }
          }
        }).catch(err => {
          console.error('❌ Error invoking get-group-order function:', err);
          // Clear invalid group token and use fallback on error
          localStorage.removeItem('groupOrderToken');
          const fallbackDiscount = { code: 'PREMIER2025', type: 'free_shipping' as const, value: 0 };
          setAppliedDiscount(fallbackDiscount);
          setDiscountCode('PREMIER2025');
          if (onDiscountChange) {
            onDiscountChange(fallbackDiscount);
          }
        });
      } else if (!appliedDiscount && (isAddingToOrder || affiliateCode)) {
        // Non-group orders or affiliate referrals use PREMIER2025
        const defaultDiscount = { code: 'PREMIER2025', type: 'free_shipping' as const, value: 0 };
        setAppliedDiscount(defaultDiscount);
        setDiscountCode('PREMIER2025');
        if (onDiscountChange) {
          onDiscountChange(defaultDiscount);
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
  }, [deliveryDetailsMatch, appliedDiscount?.code, onDiscountChange, isAddingToOrder, affiliateCode, appliedDiscount]);

  // Calculate discounted subtotal for sales tax calculation
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? subtotal * (1 - appliedDiscount.value / 100)
    : subtotal;
  
  // Sales tax is always 8.25% applied to the subtotal (after discount if applicable)
  const salesTax = discountedSubtotal * 0.0825;
  
  // Final delivery fee (uses distance-based calculation with discount consideration)
  const finalDeliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : distanceDeliveryFee;
  
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
        // Check if it's a group shipping code (GROUP-SHIPPING-*)
        if (upperCode.startsWith('GROUP-SHIPPING-')) {
          return { code: upperCode, type: 'free_shipping' as const, value: 0 };
        }
        return null;
    }
  };

  const handleApplyDiscount = () => {
    console.log('Applying discount code:', discountCode);
    const discount = validateDiscountCode(discountCode);
    console.log('Validated discount:', discount);
    
    if (discount) {
      console.log('Setting applied discount:', discount);
      setAppliedDiscount(discount);
      if (onDiscountChange) {
        console.log('Calling onDiscountChange with:', discount);
        onDiscountChange(discount);
      }
    } else {
      console.log('Invalid discount code:', discountCode);
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
  
  // Sync tip changes with parent and track tip type
  const handleTipChange = (newTip: number, type?: 'percentage' | 'custom', percentage?: number) => {
    setTipAmount(newTip);
    if (type) setTipType(type);
    if (percentage !== undefined) setTipPercentage(percentage);
    if (onTipChange) {
      onTipChange(newTip);
    }
  };

  const handleConfirmDateTime = () => {
    // Combined datetime and customer validation
    if (!isDateTimeComplete || !isCustomerComplete) return;
    
    // Validate email and phone before proceeding
    const emailErr = getEmailErrorMessage(customerInfo.email || '');
    const phoneErr = getPhoneErrorMessage(customerInfo.phone || '');
    
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    
    if (!emailErr && !phoneErr && customerInfo.firstName?.trim() && customerInfo.lastName?.trim()) {
      setConfirmedDateTime(true);
      setConfirmedCustomer(true);
      
      // Navigate to address step
      if (!confirmedAddress) {
        setCurrentStep('address');
      } else {
        setCurrentStep('payment');
      }
      
      // Smooth scroll to top after state update
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handleConfirmAddress = async () => {
    console.log('🔵 CONFIRM ADDRESS CLICKED - Address info:', addressInfo);
    if (!isAddressComplete) return;
    
    console.log('🟢 Address validation passed, confirming...');
    setConfirmedAddress(true);
    
    // Return to previous step if editing, otherwise auto-proceed to payment if all sections are confirmed  
    if (previousStep !== currentStep) {
      console.log('Returning to previous step after editing:', previousStep);
      setTimeout(() => setCurrentStep(previousStep), 100);
    } else if (confirmedDateTime) {
      console.log('All sections confirmed, proceeding to payment automatically...');
      setTimeout(() => setCurrentStep('payment'), 100);
    }
    
    // Smooth scroll to top after state update
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleConfirmCustomer = () => {
    console.log('🔵 CONFIRM CUSTOMER CLICKED - Confirming customer with info:', customerInfo);
    
    // Validate email and phone before proceeding
    const emailErr = getEmailErrorMessage(customerInfo.email || '');
    const phoneErr = getPhoneErrorMessage(customerInfo.phone || '');
    
    console.log('Email error:', emailErr);
    console.log('Phone error:', phoneErr);
    console.log('First name:', customerInfo.firstName?.trim());
    console.log('Last name:', customerInfo.lastName?.trim());
    
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    
    if (!emailErr && !phoneErr && customerInfo.firstName?.trim() && customerInfo.lastName?.trim()) {
      console.log('🟢 Customer validation passed, confirming DateTime...');
      setConfirmedDateTime(true);
      
      // Return to previous step if editing, otherwise proceed to address step if not confirmed yet
      if (previousStep !== currentStep) {
        console.log('Returning to previous step after editing:', previousStep);
        setTimeout(() => setCurrentStep(previousStep), 100);
      } else if (!confirmedAddress) {
        console.log('DateTime confirmed, proceeding to address step...');
        setTimeout(() => setCurrentStep('address'), 100);
      } else {
        console.log('All sections confirmed, proceeding to payment automatically...');
        setTimeout(() => setCurrentStep('payment'), 100);
      }
      
      // Smooth scroll to top after state update
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      console.log('Customer validation failed');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    console.log("🔥 PAYMENT SUCCESS - Starting order creation", { paymentIntentId });
    
    // Store checkout completion data IMMEDIATELY for instant order confirmation
    // Generate share token for group orders - every order can be shared
    const shareToken = crypto.randomUUID();
    
    const checkoutCompletionData = {
      cartItems,
      totalAmount: finalTotal,
      subtotal: discountedSubtotal,
      salesTax,
      deliveryFee: finalDeliveryFee,
      tipAmount,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerEmail: customerInfo.email,
      deliveryAddress: addressInfo.street ? 
        `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}` : 
        deliveryInfo.address,
      deliveryDate: deliveryInfo.date ? format(deliveryInfo.date, 'yyyy-MM-dd') : null,
      deliveryTime: deliveryInfo.timeSlot,
      appliedDiscount,
      paymentIntentId,
      shareToken, // Add share token for group order functionality
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('checkout-completion-data', JSON.stringify(checkoutCompletionData));
    console.log("🔥 ✅ STORED CHECKOUT DATA FOR INSTANT DISPLAY:", checkoutCompletionData);
    if (paymentIntentId) {
      try {
        console.log("🔥 CALLING create-shopify-order with:", {
          paymentIntentId,
          customerEmail: customerInfo.email,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          deliveryAddress: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
          cartItemsCount: cartItems.length,
          finalTotal,
          affiliateCode
        });

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
        
        console.log("🔥 CREATE-SHOPIFY-ORDER RESPONSE:", response);
        
        if (response.error) {
          console.error("🔥 ERROR from create-shopify-order:", response.error);
          throw new Error(`Order creation failed: ${response.error.message || response.error}`);
        }
        
        if (response.data?.order) {
          const orderNumber = response.data.order.order_number || response.data.order.id;
          console.log("🔥 ORDER CREATED SUCCESSFULLY:", {
            orderNumber,
            orderId: response.data.order.id,
            shopifyOrderId: response.data.shopifyOrderId
          });
          
          const orderInfo = {
            orderNumber,
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
          
          // Save completed order data to progress tracking
          await saveProgress({
            progressType: 'completed_order',
            data: {
              paymentIntentId,
              orderDetails: response.data,
              customerInfo,
              addressInfo,
              cartItems,
              deliveryInfo,
              appliedDiscount,
              completedAt: new Date().toISOString()
            },
            pageContext: 'order-completion'
          });
          
          console.log("🔥 NAVIGATING TO ORDER COMPLETE:", {
            url: `/order-complete?order_number=${orderNumber}&session_id=${paymentIntentId}`,
            orderNumber,
            sessionId: paymentIntentId
          });
          
          // Navigate with order details for proper loading
          navigate(`/order-complete?order_number=${orderNumber}&session_id=${paymentIntentId}`);
          return; // Early return to prevent the default navigation
        } else {
          console.error("🔥 NO ORDER DATA IN RESPONSE:", response.data);
          throw new Error("No order data received from order creation");
        }
      } catch (error) {
        console.error('🔥 CRITICAL ERROR in handlePaymentSuccess:', error);
        console.error('🔥 ERROR DETAILS:', {
          message: error.message,
          stack: error.stack,
          paymentIntentId,
          customerInfo,
          cartItems: cartItems.length
        });
        
        // Still navigate to avoid getting stuck, but with error info
        navigate(`/order-complete?error=creation_failed&session_id=${paymentIntentId}`);
      }
    }
    
    // Clear cart and discount after successful order
    cartItems.forEach(item => {
      onUpdateQuantity(item.id, item.variant, 0);
    });
    
    localStorage.removeItem('partyondelivery_cart');
    localStorage.removeItem('partyondelivery_applied_discount'); // Clear discount after transaction
    
    // Only navigate here if we didn't already navigate with order details above
    navigate('/order-complete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5">
      <div className="relative">
        
        {/* Mobile-optimized back button */}
        <div className="p-2 md:p-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="text-xs md:text-sm py-1 px-2 md:py-2 md:px-4 h-6 md:h-auto"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Back to Products
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-2 md:px-4 space-y-2 md:space-y-6">
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
                        <div>• Date: {format(
                          new Date(originalOrderInfo.deliveryDate + 'T12:00:00'), 
                          "EEEE, MMMM do, yyyy"
                        )}</div>
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

          {/* Saved Information Display - Compact mobile layout */}
          {(confirmedDateTime || confirmedAddress) && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-card">
              <CardContent className="py-2 px-3 md:py-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 w-full">
                    <div className="flex items-center mb-1 md:mb-2">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-green-600 flex-shrink-0" />
                      <span className="text-sm md:text-lg font-semibold text-green-800">Saved Information</span>
                    </div>
                    
                    {confirmedDateTime && (
                      <div className="space-y-1 ml-4 md:ml-8 grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                        <div className="text-xs md:text-sm text-green-700">
                          <strong>Date:</strong> {deliveryInfo.date && format(
                            toZonedTime(deliveryInfo.date instanceof Date ? deliveryInfo.date : new Date(deliveryInfo.date), 'America/Chicago'), 
                            'MMM do'
                          )} at {deliveryInfo.timeSlot}
                        </div>
                        <div className="text-xs md:text-sm text-green-700">
                          <strong>Contact:</strong> {customerInfo.firstName} {customerInfo.lastName}
                        </div>
                      </div>
                    )}
                    
                    {confirmedAddress && (
                      <div className="space-y-1 ml-4 md:ml-8 mt-1 md:mt-2">
                        <div className="text-xs md:text-sm text-green-700">
                          <strong>Address:</strong> {addressInfo.street}, {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}
                        </div>
                        {addressInfo.instructions && (
                          <div className="text-xs md:text-sm text-green-600">
                            <strong>Notes:</strong> {addressInfo.instructions}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Edit buttons for each section */}
                  <div className="flex gap-1 md:gap-2 mt-2 md:mt-0 md:ml-4 flex-shrink-0">
                    {confirmedDateTime && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviousStep(currentStep);
                          setConfirmedDateTime(false);
                          setCurrentStep('datetime');
                        }}
                        className="text-green-600 hover:text-green-800 h-6 md:h-8 px-2 md:px-3 text-xs md:text-sm"
                      >
                        <Edit2 className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    {confirmedAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviousStep(currentStep);
                          setConfirmedAddress(false);
                          setCurrentStep('address');
                        }}
                        className="text-green-600 hover:text-green-800 h-6 md:h-8 px-2 md:px-3 text-xs md:text-sm"
                      >
                        <Edit2 className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                        Edit Address
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* Step 1: Date/Time + Contact Information */}
            {currentStep === 'datetime' && (
              <Card className="shadow-card border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Step 1: Schedule Delivery & Contact Info
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
                            "w-full justify-start text-left font-normal bg-background",
                            !deliveryInfo.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryInfo.date ? (
                            format(deliveryInfo.date instanceof Date ? deliveryInfo.date : new Date(deliveryInfo.date), "EEEE, PPP")
                          ) : (
                            <span>Pick a delivery date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryInfo.date instanceof Date ? deliveryInfo.date : deliveryInfo.date ? new Date(deliveryInfo.date) : undefined}
                          onSelect={(selectedDate) => {
                            console.log('📅 Date selected:', selectedDate);
                            if (selectedDate) {
                              const updatedDeliveryInfo = { 
                                ...deliveryInfo, 
                                date: selectedDate, 
                                timeSlot: '' // Reset time when date changes
                              };
                              onDeliveryInfoChange(updatedDeliveryInfo);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkDay = new Date(date);
                            checkDay.setHours(0, 0, 0, 0);
                            return checkDay.getTime() < today.getTime();
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slot */}
                  <div className="space-y-2">
                    <Label>Delivery Time *</Label>
                    <p className="text-xs text-muted-foreground">
                      Same-day delivery available with 1-hour advance notice.
                    </p>
                    <select
                      value={deliveryInfo.timeSlot || ""}
                      onChange={(e) => {
                        const updatedDeliveryInfo = { ...deliveryInfo, timeSlot: e.target.value };
                        onDeliveryInfoChange(updatedDeliveryInfo);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Select a time slot</option>
                      {getAvailableTimeSlots().map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {getAvailableTimeSlots().length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground text-center bg-yellow-50 border border-yellow-200 rounded">
                        No time slots available today. Please select a future date.
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <Label className="text-base font-medium">Contact Information</Label>
                    </div>
                    
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
                          className="text-sm"
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
                          className="text-sm"
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
                        className={`text-sm ${phoneError ? 'border-red-500' : ''}`}
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
                        className={`text-sm ${emailError ? 'border-red-500' : ''}`}
                      />
                      {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmCustomer}
                    disabled={!deliveryInfo.date || !deliveryInfo.timeSlot || !customerInfo.firstName?.trim() || !customerInfo.lastName?.trim() || !customerInfo.email?.trim() || !customerInfo.phone?.trim()}
                    className="w-full"
                  >
                    Save Date, Time & Contact Info
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Address Section */}
            {currentStep === 'address' && (
              <Card className="shadow-card border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Step 2: Delivery Address
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
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep('datetime')}
                        className="flex-1"
                      >
                        Back to Date & Contact
                      </Button>
                      <Button 
                        onClick={handleConfirmAddress}
                        disabled={!isAddressComplete}
                        className="flex-1"
                      >
                        Save Delivery Address
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Section - No redundant summary needed */}
            {currentStep === 'payment' && (
              <div className="space-y-4">
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
                  tipType={tipType}
                  tipPercentage={tipPercentage}
                  deliveryPricing={{ fee: baseDeliveryFee, minimumOrder: 0, isDistanceBased: false }}
                  isAddingToOrder={isAddingToOrder}
                  useSameAddress={useSameAddress}
                  hasChanges={hasChanges}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  handleApplyDiscount={handleApplyDiscount}
                  handleRemoveDiscount={handleRemoveDiscount}
                />
              </div>
            )}


          {/* Order Summary */}

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
                {currentStep === 'payment' && (
                  <div className="text-center py-2 text-sm text-muted-foreground border-b mb-4">
                    Edit qty of products below
                  </div>
                )}
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
                            className="h-5 w-5 sm:h-7 sm:w-7"
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
                            className="h-5 w-5 sm:h-7 sm:w-7"
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
                            <span>
                              Delivery Fee 
                              {subtotal >= 200 ? ' (10%)' : ' ($20 min)'}
                              {deliveryDistance && ` - ${deliveryDistance.toFixed(1)} miles`}
                              {isCalculatingDelivery && (
                                <span className="text-xs text-muted-foreground ml-1">(calculating...)</span>
                              )}
                            </span>
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
                        
                        {/* Group Order Share Link */}
                        {confirmedDateTime && confirmedAddress && confirmedCustomer && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                              🎉 Want friends to join this order?
                            </p>
                            <Button
                              onClick={() => {
                                // Generate a group order token and save it
                                const groupToken = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                
                                // Store group order data for sharing
                                const groupOrderData = {
                                  deliveryDate: deliveryInfo.date,
                                  deliveryTime: deliveryInfo.timeSlot,
                                  deliveryAddress: addressInfo,
                                  customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
                                  groupToken,
                                  cartItems,
                                  totalAmount: finalTotal
                                };
                                
                                sessionStorage.setItem('pendingGroupOrder', JSON.stringify(groupOrderData));
                                
                                // Create share URL
                                const shareUrl = `${window.location.origin}/?group=${groupToken}`;
                                
                                // Copy to clipboard and show modal
                                navigator.clipboard.writeText(shareUrl).then(() => {
                                  alert(`Group order link copied! Share this with friends:\n\n${shareUrl}\n\nThey can add their items to your delivery and split the delivery fee!`);
                                }).catch(() => {
                                  alert(`Share this link with friends:\n\n${shareUrl}\n\nThey can add their items to your delivery and split the delivery fee!`);
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              📤 Share Group Order Link
                            </Button>
                            <p className="text-xs text-blue-600 mt-2 text-center">
                              Friends can add items and split delivery costs!
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
       </div>
       
        {/* Navigation Footer - Smaller on mobile */}
        <div className="p-2 md:p-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex justify-center">
            <div className="text-xs md:text-sm text-muted-foreground">
              Step 4 of 4
            </div>
          </div>
        </div>
    </div>
  );
};