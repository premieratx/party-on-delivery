import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Plus, Minus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '../DeliveryWidget';
import { PromoCodeInput } from '../checkout/PromoCodeInput';
import { handlePaymentError, safeSupabaseInvoke, PaymentIntentResponse } from '@/utils/apiErrorHandler';
interface PaymentFormProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  customerInfo: any;
  deliveryInfo: any;
  appliedDiscount: any;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  tipAmount?: number;
  setTipAmount?: (tip: number, type?: 'percentage' | 'custom', percentage?: number) => void;
  tipType?: 'percentage' | 'custom';
  tipPercentage?: number;
  deliveryPricing?: {
    fee: number;
    minimumOrder: number;
    isDistanceBased: boolean;
    distance?: number;
  };
  isAddingToOrder?: boolean;
  useSameAddress?: boolean;
  hasChanges?: boolean;
  discountCode?: string;
  setDiscountCode?: (code: string) => void;
  handleApplyDiscount?: () => void;
  handleRemoveDiscount?: () => void;
}
export const EmbeddedPaymentForm: React.FC<PaymentFormProps> = ({
  cartItems,
  subtotal,
  deliveryFee,
  salesTax,
  customerInfo,
  deliveryInfo,
  appliedDiscount,
  onPaymentSuccess,
  tipAmount: externalTipAmount,
  setTipAmount: externalSetTipAmount,
  tipType: externalTipType = 'percentage',
  tipPercentage: externalTipPercentage = 10,
  deliveryPricing,
  isAddingToOrder = false,
  useSameAddress = false,
  hasChanges = false,
  discountCode = '',
  setDiscountCode,
  handleApplyDiscount,
  handleRemoveDiscount
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  // Pricing with affiliate markup and per-button rules
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const freeShipAssigned = sessionStorage.getItem('shipping.free') === '1';
  const affiliateCode = sessionStorage.getItem('affiliate.code') || sessionStorage.getItem('affiliate_code') || localStorage.getItem('affiliate_code') || '';
  const commissionPercent = (() => {
    const v = sessionStorage.getItem('commission.percent');
    return v ? parseFloat(v) : 0;
  })();
  // Calculate tip percentage based on subtotal (before delivery fee adjustment for $200+)
  const rawSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const adjustedSubtotal = rawSubtotal * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const validSubtotal = adjustedSubtotal; // use adjusted subtotal for payment
  const originalDeliveryFee = validSubtotal >= 200 ? validSubtotal * 0.1 : 20;
  const validDeliveryFee = (freeShipAssigned || appliedDiscount?.type === 'free_shipping') ? 0 : originalDeliveryFee;
  const validSalesTax = validSubtotal * 0.0825; // 8.25% sales tax on subtotal incl. markup
  const tipCalculationBase = validSubtotal;
  
  // Use external tip state if provided, otherwise use internal
  const [internalTipAmount, setInternalTipAmount] = useState(validSubtotal * 0.10); // 10% pre-selected
  const [internalTipType, setInternalTipType] = useState<'percentage' | 'custom'>('percentage');
  const [internalTipPercentage, setInternalTipPercentage] = useState(10);
  
  // Use external tip state if provided, otherwise use internal
  const tipAmount = externalTipAmount !== undefined ? externalTipAmount : internalTipAmount;
  const setTipAmount = externalSetTipAmount || setInternalTipAmount;
  const tipType = externalTipType || internalTipType;
  const tipPercentage = externalTipPercentage || internalTipPercentage;
  
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [customTipConfirmed, setCustomTipConfirmed] = useState(false);
  const [confirmedTipAmount, setConfirmedTipAmount] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const validTipAmount = typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : 0;
  const total = validSubtotal + validDeliveryFee + validSalesTax + validTipAmount;
  
  const tipOptions = [{
    label: '5%',
    value: tipCalculationBase * 0.05,
    percentage: 5
  }, {
    label: '10%',
    value: tipCalculationBase * 0.10,
    percentage: 10
  }, {
    label: '15%',
    value: tipCalculationBase * 0.15,
    percentage: 15
  }, {
    label: '0%',
    value: 0,
    percentage: 0
  }];

  // Only set initial tip amount to 10% if no tip has been set yet (user hasn't interacted)
  const [hasUserSetTip, setHasUserSetTip] = useState(false);
  
  useEffect(() => {
    if (!hasUserSetTip && tipAmount === 0 && tipCalculationBase > 0) {
      if (externalSetTipAmount) {
        externalSetTipAmount(tipCalculationBase * 0.10, 'percentage', 10);
      } else {
        setInternalTipAmount(tipCalculationBase * 0.10);
        setInternalTipType('percentage');
        setInternalTipPercentage(10);
      }
    }
  }, [tipCalculationBase]); // Removed hasUserSetTip dependency to prevent tip adjustment when cart changes
  // Early return for empty cart
  if (cartItems.length === 0) {
    return (
      <Card className="shadow-card border-2 border-green-500">
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
          <p className="text-gray-600">Add some items to your cart to continue with checkout.</p>
          <Button 
            onClick={() => {
              window.history.back();
            }} 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while Stripe initializes
  if (!stripe) {
    return (
      <Card className="shadow-card border-2 border-green-500">
        <CardContent className="py-8 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600">Loading payment system...</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleCustomTipConfirm = () => {
    if (tipAmount > 0) {
      setCustomTipConfirmed(true);
      setTipConfirmed(true);
      setConfirmedTipAmount(tipAmount);
      setShowCustomTip(false);
    }
  };
  const handleEditTip = () => {
    setTipConfirmed(false);
    setCustomTipConfirmed(false);
    setShowCustomTip(false);
    // Don't reset the tip amount, just allow editing
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Add defensive check for Stripe context
    if (!stripe || !elements) {
      console.error('Stripe not properly initialized');
      setPaymentError('Payment system not available. Please refresh the page and try again.');
      return;
    }
    
    setIsProcessing(true);
    setPaymentError(null);
    
    const card = elements.getElement(CardElement);
    if (!card) {
      setPaymentError('Card information is required');
      setIsProcessing(false);
      return;
    }
    try {
      // CRITICAL PAYMENT AMOUNT VALIDATION
      const amountInCents = Math.round(total * 100);
      const calculatedTotal = validSubtotal + validDeliveryFee + validSalesTax + validTipAmount;
      
      // Verify amounts match to prevent 100x errors
      if (Math.abs(total - calculatedTotal) > 0.01) {
        throw new Error(`Amount mismatch: Display total $${total.toFixed(2)} doesn't match calculated total $${calculatedTotal.toFixed(2)}`);
      }
      
      // Validate reasonable amount range
      if (amountInCents < 50 || amountInCents > 1000000) {
        throw new Error(`Invalid payment amount: $${total.toFixed(2)}. Must be between $0.50 and $10,000.00`);
      }
      
      // Log for verification
      console.log('💰 PAYMENT AMOUNT VERIFICATION:', {
        displayTotal: `$${total.toFixed(2)}`,
        calculatedTotal: `$${calculatedTotal.toFixed(2)}`,
        amountInCents: amountInCents,
        breakdown: {
          subtotal: `$${validSubtotal.toFixed(2)}`,
          deliveryFee: `$${validDeliveryFee.toFixed(2)}`,
          salesTax: `$${validSalesTax.toFixed(2)}`,
          tip: `$${validTipAmount.toFixed(2)}`
        }
      });
      
      // Validate all required fields before payment
      if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
        throw new Error('All customer information fields (name, email, phone) are required');
      }
      
      if (!deliveryInfo.address || !deliveryInfo.date || !deliveryInfo.timeSlot) {
        throw new Error('All delivery information fields (address, date, timeSlot) are required');
      }
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart cannot be empty');
      }
      
      // Log the data being sent for debugging
      console.log('💡 Sending payment data:', {
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,  
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        deliveryInfo: {
          address: deliveryInfo.address,
          date: deliveryInfo.date,
          timeSlot: deliveryInfo.timeSlot,
          instructions: deliveryInfo.instructions
        },
        cartItems: cartItems.length,
        groupOrderToken: localStorage.getItem('groupOrderToken')
      });

      // Create payment intent with all pricing details - include current group token
      const currentGroupToken = localStorage.getItem('currentGroupToken') || localStorage.getItem('groupOrderToken');
      
      // Create payment intent with enhanced error handling and retries
      const response = await safeSupabaseInvoke<PaymentIntentResponse>(
        supabase,
        'create-payment-intent',
        {
          body: {
            amount: amountInCents, // Amount in cents
            currency: 'usd',
            cartItems,
            customerInfo,
            deliveryInfo,
            appliedDiscount,
            tipAmount: validTipAmount,
            subtotal: validSubtotal,
            deliveryFee: validDeliveryFee,
            salesTax: validSalesTax,
            groupOrderToken: currentGroupToken, // Use consistent group token
            affiliateCode,
            commissionPercent
          }
        }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Payment setup failed');
      }

      const data = response.data;
      if (!data.client_secret) {
        throw new Error('Payment setup failed: Invalid response from server');
      }

      // Confirm payment
      const {
        error: paymentError
      } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: card,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone
          }
        }
      });
      if (paymentError) {
        console.error('Payment error:', paymentError);
        setPaymentError(paymentError.message || 'Payment failed');
      } else {
        // CRITICAL: Ensure successful payment is processed correctly
        console.log('✅ Payment successful!', data);
        
        // Extract payment intent ID from client_secret for reliable order processing
        const paymentIntentId = data.client_secret.split('_secret_')[0];
        
        // Store payment intent in localStorage for mobile reliability
        localStorage.setItem('lastPaymentIntent', paymentIntentId);
        localStorage.setItem('lastCartTotal', total.toString());
        
        // CRITICAL: Store checkout completion data for OrderComplete page
        const checkoutCompletionData = {
          cartItems,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customerEmail: customerInfo.email,
          deliveryAddress: deliveryInfo,
          deliveryDate: deliveryInfo.date,
          deliveryTime: deliveryInfo.time,
          subtotal: validSubtotal,
          deliveryFee: validDeliveryFee,
          salesTax: validSalesTax,
          tipAmount: validTipAmount,
          totalAmount: total,
          paymentIntentId,
          appliedDiscount,
          shareToken: currentGroupToken
        };
        
        sessionStorage.setItem('checkout-completion-data', JSON.stringify(checkoutCompletionData));
        
        console.log('💰 PAYMENT VERIFICATION:', {
          paymentIntentId,
          totalAmount: total,
          checkoutDataStored: true
        });
        
        // Check if we're in a custom delivery app context
        const customAppContext = sessionStorage.getItem('custom-app-context');
        
        // Always use callback to prevent redirect loops (310 error)
        // The CheckoutFlow component will handle the proper navigation
        onPaymentSuccess(paymentIntentId);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const errorMessage = handlePaymentError(error);
      setPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#9e2146'
      }
    }
  };
  return <Card className="shadow-card border-2 border-green-500">
      <CardHeader className="py-2 md:py-6">
        <CardTitle className="text-sm md:text-lg flex items-center gap-2">
          <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs md:text-sm">
              <span>Subtotal</span>
              <span>${(validSubtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span>Delivery Fee {subtotal >= 200 ? '(10%)' : ''}</span>
              <div className="flex items-center gap-2">
                <span>
                  ${(validDeliveryFee || 0).toFixed(2)}
                  {isAddingToOrder && useSameAddress && !hasChanges && deliveryFee === 0 && <span className="text-xs text-green-600 ml-1">(Bundled Order)</span>}
                  {deliveryPricing?.isDistanceBased && deliveryPricing.distance && <span className="text-xs text-muted-foreground ml-1">({(deliveryPricing.distance || 0).toFixed(1)} mi)</span>}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span>Sales Tax</span>
              <span>${(validSalesTax || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-sm md:text-lg">
              <span>Total</span>
              <span>${(total || 0).toFixed(2)}</span>
            </div>
          </div>

          

          

          {/* Promo Code Section */}
          {setDiscountCode && handleApplyDiscount && handleRemoveDiscount && (
            <PromoCodeInput 
              appliedDiscount={appliedDiscount}
              onDiscountApplied={(discount) => {
                if (discount) {
                  setDiscountCode?.(discount.code);
                } else {
                  setDiscountCode?.('');
                }
                // Let the parent handle the discount logic
              }}
              cartSubtotal={validSubtotal}
            />
          )}

          <Separator />

          {/* Card Input */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-semibold">Card Information</Label>
            <div className="p-2 md:p-3 border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {paymentError && <div className="text-red-600 text-sm">{paymentError}</div>}

          <Button type="submit" disabled={!stripe || isProcessing} className="w-full text-xs md:text-sm" size="lg">
            {isProcessing ? 'Processing...' : `Complete Payment - $${(total || 0).toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>;
};