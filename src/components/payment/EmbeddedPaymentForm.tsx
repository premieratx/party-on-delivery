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
  // Calculate tip percentage based on subtotal (before delivery fee adjustment for $200+)
  const validSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0;
  const tipCalculationBase = validSubtotal >= 200 ? validSubtotal : validSubtotal;
  const [internalTipAmount, setInternalTipAmount] = useState(tipCalculationBase * 0.10); // 10% pre-selected
  
  // Early return for empty cart
  if (cartItems.length === 0) {
    return (
      <Card className="shadow-card border-2 border-green-500">
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
          <p className="text-gray-600">Add some items to your cart to continue with checkout.</p>
          <Button 
            onClick={() => {
              // Import useNavigate and use proper React Router navigation
              window.location.href = '/';
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

  // Use external tip state if provided, otherwise use internal
  const tipAmount = externalTipAmount !== undefined ? externalTipAmount : internalTipAmount;
  const setTipAmount = externalSetTipAmount || setInternalTipAmount;
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [customTipConfirmed, setCustomTipConfirmed] = useState(false);
  const [confirmedTipAmount, setConfirmedTipAmount] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const validDeliveryFee = typeof deliveryFee === 'number' && !isNaN(deliveryFee) ? deliveryFee : 0;
  const validSalesTax = typeof salesTax === 'number' && !isNaN(salesTax) ? salesTax : 0;
  const validTipAmount = typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : 0;
  const total = validSubtotal + validDeliveryFee + validSalesTax + validTipAmount;
  
  const tipOptions = [{
    label: '5%',
    value: tipCalculationBase * 0.05
  }, {
    label: '10%',
    value: tipCalculationBase * 0.10
  }, {
    label: '15%',
    value: tipCalculationBase * 0.15
  }, {
    label: '0%',
    value: 0
  }];

  // Only set initial tip amount to 10% if no tip has been set yet (user hasn't interacted)
  const [hasUserSetTip, setHasUserSetTip] = useState(false);
  
  useEffect(() => {
    if (!hasUserSetTip && tipAmount === 0 && tipCalculationBase > 0) {
      setTipAmount(tipCalculationBase * 0.10);
    }
  }, [tipCalculationBase]); // Removed hasUserSetTip and tipAmount dependencies to prevent tip adjustment when cart changes
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
      // Create payment intent with all pricing details
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          cartItems,
          customerInfo,
          deliveryInfo,
          appliedDiscount,
          tipAmount: validTipAmount,
          subtotal: validSubtotal,
          deliveryFee: validDeliveryFee,
          salesTax: validSalesTax,
          groupOrderToken: localStorage.getItem('groupOrderToken') // Add group order token
        }
      });
      if (error) {
        throw new Error(error.message);
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
          {/* Tip Selection - Condensed or Full */}
          {tipConfirmed ? <div className="p-2 border border-green-500 rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Driver Tip: ${(confirmedTipAmount || 0).toFixed(2)}</span>
                  {customTipConfirmed && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleEditTip} className="text-xs px-2 py-1 h-auto">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div> : <div className="space-y-2">
              <Label className="text-sm font-semibold">Add a tip for your delivery driver</Label>
              <div className="grid grid-cols-5 gap-1 w-full">
                {tipOptions.map(tip => <Button key={tip.label} type="button" variant={tipAmount === tip.value && !showCustomTip ? "default" : "outline"} onClick={() => {
              setTipAmount(tip.value);
              setHasUserSetTip(true); // Mark that user has interacted with tip
              setShowCustomTip(false);
              setTipConfirmed(false);
              setCustomTipConfirmed(false);
            }} className="text-xs flex flex-col items-center py-2 px-1 h-auto">
                    <span className="font-semibold">{tip.label}</span>
                    <span className="text-xs opacity-75">${(tip.value || 0).toFixed(0)}</span>
                  </Button>)}
                <Button type="button" variant={showCustomTip ? "default" : "outline"} onClick={() => {
              setShowCustomTip(true);
              setHasUserSetTip(true); // Mark that user has interacted with tip
              setTipAmount(0);
              setTipConfirmed(false);
              setCustomTipConfirmed(false);
            }} className="text-xs flex flex-col items-center py-2 px-1 h-auto">
                  <span className="font-semibold">Custom</span>
                  <span className="text-xs opacity-75">$</span>
                </Button>
              </div>
              {showCustomTip && <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="customTip" className="text-sm whitespace-nowrap">Custom tip:</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">$</span>
                      <Input id="customTip" type="text" placeholder="0.00" value={tipAmount === 0 ? '' : tipAmount.toString()} onChange={e => {
                  const value = e.target.value;
                  // Allow typing numbers and decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value) || 0;
                    setTipAmount(numValue);
                    setHasUserSetTip(true); // Mark that user has interacted with tip
                  }
                 }} onBlur={e => {
                  // Format to 2 decimal places on blur if there's a value
                  const value = parseFloat(e.target.value) || 0;
                  setTipAmount(value);
                  setHasUserSetTip(true);
                 }} onKeyDown={e => {
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    const value = parseFloat(e.currentTarget.value) || 0;
                    setTipAmount(value);
                    setHasUserSetTip(true);
                  }
                }} className="w-16 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="confirmCustomTip" checked={customTipConfirmed} onCheckedChange={checked => {
                if (checked && tipAmount > 0) {
                  handleCustomTipConfirm();
                }
              }} disabled={tipAmount === 0} />
                    <Label htmlFor="confirmCustomTip" className="text-sm">
                      Confirm tip: ${(tipAmount || 0).toFixed(2)}
                    </Label>
                  </div>
                </div>}
            </div>}

          <Separator />

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
            <div className="flex justify-between text-xs md:text-sm">
              <span>Tip</span>
              <span>${(validTipAmount || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-sm md:text-lg">
              <span>Total</span>
              <span>${(total || 0).toFixed(2)}</span>
            </div>
          </div>

          

          

          {/* Discount Code Section */}
          {setDiscountCode && handleApplyDiscount && handleRemoveDiscount && <div className="space-y-2 md:space-y-3 p-2 md:p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs md:text-sm font-medium">Discount Code</Label>
              {!appliedDiscount ? <div className="flex gap-2">
                  <Input placeholder="Enter code" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} onKeyDown={e => {
              if (e.key === 'Enter' && discountCode) {
                handleApplyDiscount();
              }
            }} className="flex-1 text-xs md:text-sm" />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={!discountCode} className="text-xs px-2 py-1">
                    Apply
                  </Button>
                </div> : <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-300">
                  <span className="text-xs md:text-sm font-medium text-green-800">
                    {appliedDiscount.code} applied
                    {appliedDiscount.type === 'percentage' && ` (${appliedDiscount.value}% off)`}
                    {appliedDiscount.type === 'free_shipping' && ' (Free shipping)'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleRemoveDiscount} className="text-green-800 hover:text-green-900 text-xs px-2 py-1">
                    Remove
                  </Button>
                </div>}
            </div>}

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