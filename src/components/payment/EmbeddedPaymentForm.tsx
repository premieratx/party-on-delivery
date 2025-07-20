import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '../DeliveryWidget';

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
  setTipAmount?: (tip: number) => void;
  deliveryPricing?: {fee: number, minimumOrder: number, isDistanceBased: boolean, distance?: number};
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
  const [internalTipAmount, setInternalTipAmount] = useState(subtotal * 0.10); // 10% pre-selected
  
  // Use external tip state if provided, otherwise use internal
  const tipAmount = externalTipAmount !== undefined ? externalTipAmount : internalTipAmount;
  const setTipAmount = externalSetTipAmount || setInternalTipAmount;
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const total = subtotal + deliveryFee + salesTax + tipAmount;

  const tipOptions = [
    { label: '5%', value: subtotal * 0.05 },
    { label: '10%', value: subtotal * 0.10 },
    { label: '15%', value: subtotal * 0.15 }
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
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
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          cartItems,
          customerInfo,
          deliveryInfo,
          appliedDiscount,
          tipAmount
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: card,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone,
          }
        }
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        setPaymentError(paymentError.message || 'Payment failed');
      } else {
        // Extract payment intent ID from client_secret
        const paymentIntentId = data.client_secret.split('_secret_')[0];
        onPaymentSuccess(paymentIntentId);
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
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
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card className="shadow-card border-2 border-green-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tip Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Add a tip for your delivery driver</Label>
            <div className="grid grid-cols-2 gap-2">
              {tipOptions.map((tip) => (
                <Button
                  key={tip.label}
                  type="button"
                  variant={tipAmount === tip.value && !showCustomTip ? "default" : "outline"}
                  onClick={() => {
                    setTipAmount(tip.value);
                    setShowCustomTip(false);
                  }}
                  className="text-sm"
                >
                  {tip.label} (${tip.value.toFixed(2)})
                </Button>
              ))}
              <Button
                type="button"
                variant={showCustomTip ? "default" : "outline"}
                onClick={() => {
                  setShowCustomTip(true);
                  setTipAmount(0);
                }}
                className="text-sm"
              >
                Custom
              </Button>
            </div>
            {showCustomTip && (
              <div className="flex items-center gap-2">
                <Label htmlFor="customTip" className="text-sm">Custom tip:</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm">$</span>
                  <Input
                    id="customTip"
                    type="text"
                    placeholder="0.00"
                    value={tipAmount === 0 ? '' : tipAmount.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value) || 0;
                        setTipAmount(numValue);
                      }
                    }}
                    onBlur={(e) => {
                      // Format to 2 decimal places on blur if there's a value
                      const value = parseFloat(e.target.value) || 0;
                      setTipAmount(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' || e.key === 'Enter') {
                        const value = parseFloat(e.currentTarget.value) || 0;
                        setTipAmount(value);
                      }
                    }}
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee {subtotal >= 200 ? '(10%)' : ''}</span>
              <div className="flex items-center gap-2">
                <span>
                  ${deliveryFee.toFixed(2)}
                  {(isAddingToOrder && useSameAddress && !hasChanges) && deliveryFee === 0 && (
                    <span className="text-xs text-green-600 ml-1">(Bundled Order)</span>
                  )}
                  {deliveryPricing?.isDistanceBased && deliveryPricing.distance && (
                    <span className="text-xs text-muted-foreground ml-1">({deliveryPricing.distance.toFixed(1)} mi)</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sales Tax</span>
              <span>${salesTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tip</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Discount Code Section */}
          {setDiscountCode && handleApplyDiscount && handleRemoveDiscount && (
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
          )}

          <Separator />

          {/* Card Input */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Card Information</Label>
            <div className="p-3 border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {paymentError && (
            <div className="text-red-600 text-sm">{paymentError}</div>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : `Complete Payment - $${total.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};