import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '../DeliveryWidget';
import { CustomerInfo } from '@/hooks/useCustomerInfo';
import { handlePaymentError, safeSupabaseInvoke, PaymentIntentResponse } from '@/utils/apiErrorHandler';

interface PaymentStepProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  customerInfo: CustomerInfo;
  deliveryInfo: any;
  appliedDiscount?: any;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  isAddingToOrder?: boolean;
  affiliateCode?: string;
  tipAmount?: number;
  onTipChange?: (amount: number) => void;
}

const tipOptions = [
  { label: '10%', value: 0, percentage: 10 },
  { label: '15%', value: 0, percentage: 15 },
  { label: '20%', value: 0, percentage: 20 },
  { label: '25%', value: 0, percentage: 25 }
];

export const PaymentStep: React.FC<PaymentStepProps> = ({
  cartItems,
  subtotal,
  deliveryFee,
  salesTax,
  customerInfo,
  deliveryInfo,
  appliedDiscount,
  onPaymentSuccess,
  isAddingToOrder = false,
  affiliateCode,
  tipAmount: externalTipAmount,
  onTipChange: externalOnTipChange
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Tip management - use external tip if provided, otherwise internal
  const [internalTipAmount, setInternalTipAmount] = useState(subtotal * 0.10);
  const [tipType, setTipType] = useState<'percentage' | 'custom'>('percentage');
  const [showCustomTip, setShowCustomTip] = useState(false);
  
  const tipAmount = externalTipAmount !== undefined ? externalTipAmount : internalTipAmount;
  const setTipAmount = (amount: number) => {
    if (externalOnTipChange) {
      externalOnTipChange(amount);
    } else {
      setInternalTipAmount(amount);
    }
  };

  // Calculate tip options based on subtotal
  const calculateTipOptions = () => {
    return tipOptions.map(option => ({
      ...option,
      value: subtotal * (option.percentage / 100)
    }));
  };

  const validTipAmount = typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : 0;
  const total = subtotal + deliveryFee + salesTax + validTipAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setPaymentError('Stripe is not initialized. Please refresh and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Validate amounts to prevent 100X errors
      const amountInCents = Math.round(total * 100);
      const calculatedTotal = subtotal + deliveryFee + salesTax + validTipAmount;
      
      if (Math.abs(total - calculatedTotal) > 0.01) {
        throw new Error(`Amount mismatch: Display total $${total.toFixed(2)} doesn't match calculated total $${calculatedTotal.toFixed(2)}`);
      }

      if (amountInCents < 50 || amountInCents > 1000000) {
        throw new Error(`Invalid payment amount: $${total.toFixed(2)}. Must be between $0.50 and $10,000.00`);
      }

      console.log('💰 PAYMENT VERIFICATION:', {
        displayTotal: `$${total.toFixed(2)}`,
        amountInCents,
        breakdown: {
          subtotal: `$${subtotal.toFixed(2)}`,
          deliveryFee: `$${deliveryFee.toFixed(2)}`,
          salesTax: `$${salesTax.toFixed(2)}`,
          tip: `$${validTipAmount.toFixed(2)}`
        }
      });

      // Create payment intent with enhanced error handling and retries
      const response = await safeSupabaseInvoke<PaymentIntentResponse>(
        supabase,
        'create-payment-intent',
        {
          body: {
            amount: amountInCents,
            currency: 'usd',
            cartItems,
            customerInfo,
            deliveryInfo,
            appliedDiscount,
            tipAmount: validTipAmount,
            subtotal,
            deliveryFee,
            salesTax,
            affiliateCode
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
      const { error: paymentError } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: cardElement,
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
        console.log('✅ Payment successful!');
        const paymentIntentId = data.client_secret.split('_secret_')[0];
        
        // Webhook will handle Shopify order creation automatically
        // Remove manual call to prevent duplicate orders
        console.log('💰 Payment successful - webhook will create Shopify order automatically');
        
        // Call success handler
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

  const handleTipSelect = (option: typeof tipOptions[0]) => {
    setTipAmount(option.value);
    setTipType('percentage');
    setShowCustomTip(false);
  };

  const handleCustomTip = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTipAmount(numValue);
    setTipType('custom');
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        
        {/* Tip Selection */}
        <div className="space-y-3">
          <Label className="font-medium text-sm sm:text-base">Add a tip for your delivery driver</Label>
          
          {!showCustomTip ? (
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {calculateTipOptions().map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={tipAmount === option.value ? "default" : "outline"}
                  onClick={() => handleTipSelect(option)}
                  className="flex flex-col items-center py-1 sm:py-3 h-auto text-xs sm:text-sm flex-1 min-w-0"
                  size="sm"
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="opacity-75">${option.value.toFixed(0)}</span>
                </Button>
              ))}
              
              <Button
                type="button"
                variant={showCustomTip ? "default" : "outline"}
                onClick={() => setShowCustomTip(true)}
                className="flex flex-col items-center py-1 sm:py-3 h-auto text-xs sm:text-sm"
                size="sm"
              >
                <span className="font-semibold">Custom</span>
                <span className="opacity-75">$</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                onChange={(e) => handleCustomTip(e.target.value)}
                className="flex-1 h-10 sm:h-auto"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomTip(false)}
                size="sm"
                className="h-10 sm:h-auto"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm sm:text-base font-medium">Card Information</Label>
              <div className="p-3 sm:p-4 border rounded-lg bg-background">
                <CardElement options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#374151',
                      '::placeholder': {
                        color: '#9CA3AF'
                      }
                    }
                  }
                }} />
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{paymentError}</p>
              </div>
            )}

            <Button 
              type="submit"
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
              disabled={!stripe || !elements || isProcessing}
            >
              {isProcessing 
                ? 'Processing...' 
                : `Pay $${total.toFixed(2)}`
              }
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};