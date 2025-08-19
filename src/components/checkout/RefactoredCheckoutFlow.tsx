import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useToast } from '@/hooks/use-toast';

// Import our new modular components
import { CheckoutSteps } from './CheckoutSteps';
import { DateTimeStep } from './DateTimeStep';
import { AddressStep } from './AddressStep';
import { CustomerInfoStep } from './CustomerInfoStep';
import { CheckoutSummary } from './CheckoutSummary';
import { PaymentStep } from './PaymentStep';

interface RefactoredCheckoutFlowProps {
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

export const RefactoredCheckoutFlow: React.FC<RefactoredCheckoutFlowProps> = ({
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
  appliedDiscount,
  affiliateCode
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Custom hooks for state management
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  const checkoutFlow = useCheckoutFlow({ 
    isAddingToOrder, 
    lastOrderInfo, 
    deliveryInfo, 
    onDeliveryInfoChange, 
    affiliateCode 
  });

  // Extract checkout flow state
  const { 
    currentStep, 
    setCurrentStep,
    confirmedDateTime,
    setConfirmedDateTime,
    confirmedAddress,
    setConfirmedAddress,
    confirmedCustomer,
    setConfirmedCustomer,
    isDateTimeComplete,
    isAddressComplete,
    isCustomerComplete,
    hasChanges
  } = checkoutFlow;

  // Pricing calculations
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const calculatedSubtotal = cartItems.reduce((total, item) => total + (applyMarkup(item.price) * item.quantity), 0);
  
  const calculatedDeliveryFee = calculatedSubtotal >= 200 ? calculatedSubtotal * 0.1 : 20;
  const assignedFreeShipping = sessionStorage.getItem('shipping.free') === '1';
  const finalDeliveryFee = (appliedDiscount?.type === 'free_shipping' || assignedFreeShipping) ? 0 : calculatedDeliveryFee;
  
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? calculatedSubtotal * (1 - appliedDiscount.value / 100)
    : calculatedSubtotal;
  
  const calculatedSalesTax = discountedSubtotal * 0.0825; // 8.25% sales tax
  
  // Tip management
  const [tipAmount, setTipAmount] = useState(calculatedSubtotal * 0.10); // Default 10%

  const finalTotal = discountedSubtotal + finalDeliveryFee + calculatedSalesTax + tipAmount;

  // Step confirmation handlers
  const handleDateTimeConfirm = () => {
    if (isDateTimeComplete) {
      setConfirmedDateTime(true);
      setCurrentStep('address');
      toast({
        title: "Date & Time Confirmed",
        description: "Please confirm your delivery address.",
      });
    }
  };

  const handleAddressConfirm = () => {
    if (isAddressComplete) {
      setConfirmedAddress(true);
      // Customer info is handled inline with address step
      setConfirmedCustomer(true);
      setCurrentStep('payment');
      toast({
        title: "Address & Contact Confirmed", 
        description: "Ready for payment.",
      });
    }
  };

  const handleCustomerConfirm = () => {
    if (isCustomerComplete) {
      setConfirmedCustomer(true);
      setCurrentStep('payment');
      toast({
        title: "Contact Information Confirmed",
        description: "Ready for payment.",
      });
    }
  };

  const handlePaymentSuccess = (paymentIntentId?: string) => {
    // Clear checkout session
    try {
      sessionStorage.removeItem('checkout_session_id');
      localStorage.removeItem('unified-cart');
    } catch (error) {
      console.warn('Failed to clear checkout session:', error);
    }

    // Navigate to success page
    navigate('/order-complete', { 
      state: { 
        paymentIntentId,
        orderDetails: {
          cartItems,
          customerInfo,
          deliveryInfo,
          total: finalTotal,
          appliedDiscount
        }
      }
    });
  };

  // Auto-progression logic
  useEffect(() => {
    if (confirmedDateTime && !confirmedAddress && currentStep === 'datetime') {
      setCurrentStep('address');
    } else if (confirmedDateTime && confirmedAddress && !confirmedCustomer && currentStep === 'address') {
      setCurrentStep('address'); // Stay on address until customer info is also confirmed
    } else if (confirmedDateTime && confirmedAddress && confirmedCustomer && currentStep !== 'payment') {
      setCurrentStep('payment');
    }
  }, [confirmedDateTime, confirmedAddress, confirmedCustomer, currentStep, setCurrentStep]);

  // Notify parent of changes
  useEffect(() => {
    if (onChangesDetected) {
      onChangesDetected(hasChanges);
    }
  }, [hasChanges, onChangesDetected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <CheckoutSteps
          currentStep={currentStep}
          confirmedDateTime={confirmedDateTime}
          confirmedAddress={confirmedAddress}
          confirmedCustomer={confirmedCustomer}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Date & Time Step */}
            <DateTimeStep
              deliveryInfo={deliveryInfo}
              onDeliveryInfoChange={onDeliveryInfoChange}
              onConfirm={handleDateTimeConfirm}
              isConfirmed={confirmedDateTime}
            />

            {/* Address & Customer Info Step */}
            {(confirmedDateTime || currentStep === 'address') && (
              <>
                <AddressStep
                  addressInfo={addressInfo}
                  setAddressInfo={setAddressInfo}
                  onConfirm={handleAddressConfirm}
                  isConfirmed={confirmedAddress}
                />
                
                {/* Customer Info - shown inline with address */}
                {!confirmedCustomer && (
                  <CustomerInfoStep
                    customerInfo={customerInfo}
                    setCustomerInfo={setCustomerInfo}
                    onConfirm={handleCustomerConfirm}
                    isConfirmed={confirmedCustomer}
                  />
                )}
              </>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && confirmedDateTime && confirmedAddress && (
              <div className="space-y-6">
                <PaymentStep
                  cartItems={cartItems}
                  subtotal={discountedSubtotal}
                  deliveryFee={finalDeliveryFee}
                  salesTax={calculatedSalesTax}
                  customerInfo={customerInfo}
                  deliveryInfo={{
                    ...deliveryInfo,
                    address: `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`,
                    instructions: addressInfo.instructions
                  }}
                  appliedDiscount={appliedDiscount}
                  onPaymentSuccess={handlePaymentSuccess}
                  isAddingToOrder={isAddingToOrder}
                  affiliateCode={affiliateCode}
                />
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <CheckoutSummary
              cartItems={cartItems}
              subtotal={calculatedSubtotal}
              deliveryFee={calculatedDeliveryFee}
              salesTax={calculatedSalesTax}
              tipAmount={tipAmount}
              appliedDiscount={appliedDiscount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};