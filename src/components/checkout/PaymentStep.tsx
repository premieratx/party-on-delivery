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
  affiliateCode
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Stripe should always be available when this component renders
  // since it's wrapped by StripePaymentWrapper
  
  // Tip management
  const [tipAmount, setTipAmount] = useState(subtotal * 0.10); // Default 10%
  const [tipType, setTipType] = useState<'percentage' | 'custom'>('percentage');
  const [showCustomTip, setShowCustomTip] = useState(false);

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

      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
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
      });

      if (error) {
        throw new Error(error.message);
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
        
        // Create Shopify order immediately after successful payment
        console.log('📦 Creating Shopify order after successful payment...');
        try {
          const orderResponse = await supabase.functions.invoke('create-shopify-order', {
            body: {
              paymentIntentId: paymentIntentId,
              isAddingToOrder: isAddingToOrder || false,
              useSameAddress: false
            }
          });
          
          console.log('📦 Shopify order creation response:', orderResponse);
          
          if (orderResponse.error) {
            console.error('❌ Shopify order creation failed:', orderResponse.error);
            // Payment succeeded but order creation failed - still proceed
          } else {
            console.log('✅ Shopify order created successfully:', orderResponse.data);
          }
        } catch (orderError) {
          console.error('❌ Order creation error (payment succeeded):', orderError);
          // Payment succeeded but order creation failed - still proceed
        }
        
        // Call success handler
        onPaymentSuccess(paymentIntentId);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Tip Selection */}
        <div className="space-y-3">
          <Label className="font-medium">Add a tip for your delivery driver</Label>
          
          {!showCustomTip ? (
            <div className="grid grid-cols-5 gap-2">
              {calculateTipOptions().map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={tipAmount === option.value ? "default" : "outline"}
                  onClick={() => handleTipSelect(option)}
                  className="flex flex-col items-center py-3 h-auto"
                  size="sm"
                >
                  <span className="font-semibold text-xs">{option.label}</span>
                  <span className="text-xs opacity-75">${option.value.toFixed(0)}</span>
                </Button>
              ))}
              
              <Button
                type="button"
                variant={showCustomTip ? "default" : "outline"}
                onClick={() => setShowCustomTip(true)}
                className="flex flex-col items-center py-3 h-auto"
                size="sm"
              >
                <span className="font-semibold text-xs">Custom</span>
                <span className="text-xs opacity-75">$</span>
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
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomTip(false)}
                size="sm"
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
              <Label>Card Information</Label>
              <div className="p-3 border rounded-lg bg-background">
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            <Button 
              type="submit"
              className="w-full h-12 text-lg font-semibold"
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