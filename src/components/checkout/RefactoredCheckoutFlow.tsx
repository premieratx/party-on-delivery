import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';
import { useToast } from '@/hooks/use-toast';
import { useCoverPageTracking } from '@/hooks/useCoverPageTracking';
import { usePersistentCheckout } from '@/hooks/usePersistentCheckout';
import { checkoutStorage } from '@/utils/universalStorage';

// Import our new modular components
import { CheckoutSteps } from './CheckoutSteps';
import { FastCheckoutHeader } from './FastCheckoutHeader';
import { ImprovedDateTimeStep } from './ImprovedDateTimeStep';
import { AddressStep } from './AddressStep';
import { CustomerInfoStep } from './CustomerInfoStep';
import { ImprovedCheckoutSummary } from './ImprovedCheckoutSummary';
import { StripePaymentWrapper } from './StripePaymentWrapper';
import { CleanCheckoutTotal } from './CleanCheckoutTotal';
import { PromoCodeInput } from './PromoCodeInput';
import { CheckoutSafeguards } from './CheckoutSafeguards';
import { CheckoutFlowValidator } from './CheckoutFlowValidator';
import { CheckoutInputOptimizer } from './CheckoutInputOptimizer';
import { MobileInputFix } from './MobileInputFix';

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
  const { tracking } = useCoverPageTracking();
  const { 
    customerInfo: persistedCustomer, 
    addressInfo: persistedAddress, 
    hasSavedData, 
    isLoaded: persistentDataLoaded 
  } = usePersistentCheckout();
  
  // Custom hooks for state management
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  const checkoutFlow = useCheckoutFlow({ 
    isAddingToOrder, 
    lastOrderInfo, 
    deliveryInfo, 
    onDeliveryInfoChange, 
    affiliateCode 
  });

  // Extract checkout flow state FIRST
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

  // Auto-populate from persisted data on mount
  useEffect(() => {
    if (persistentDataLoaded && hasSavedData()) {
      // Instantly populate from saved data
      if (persistedCustomer.email) {
        setCustomerInfo(persistedCustomer);
      }
      if (persistedAddress.address) {
        // Convert address string to AddressInfo format
        const parts = persistedAddress.address.split(',').map(s => s.trim());
        const stateZip = parts[2]?.split(' ') || [];
        const addressToUse = {
          street: parts[0] || '',
          city: parts[1] || '',
          state: stateZip[0] || '',
          zipCode: stateZip[1] || '',
          instructions: persistedAddress.instructions || ''
        };
        setAddressInfo(addressToUse);
      }
    }
  }, [persistentDataLoaded, persistedCustomer, persistedAddress, setCustomerInfo, setAddressInfo]);

  // CRITICAL: NEVER auto-confirm pre-filled data - ALWAYS keep editable
  useEffect(() => {
    // Force all confirmations to FALSE to ensure pre-filled data stays editable
    if (persistentDataLoaded && (persistedAddress.address || persistedCustomer.email)) {
      console.log('🔒 PREVENTING auto-confirmation of pre-filled data to keep it editable');
      setConfirmedDateTime(false);
      setConfirmedAddress(false);
      setConfirmedCustomer(false);
      setCurrentStep('datetime'); // Always start at step 1 for editing
    }
  }, [persistentDataLoaded, persistedAddress, persistedCustomer, setConfirmedDateTime, setConfirmedAddress, setConfirmedCustomer, setCurrentStep]);

  // Pricing calculations - use proper delivery fee hook with tip support
  const markupPercent = (() => {
    try {
      return Number(sessionStorage.getItem('pricing.markupPercent') || '0');
    } catch (sessionStorageError) {
      console.warn('⚠️ sessionStorage read failed for markupPercent, using default:', sessionStorageError);
      return 0;
    }
  })();
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const cartSubtotal = cartItems.reduce((total, item) => total + (applyMarkup(item.price) * item.quantity), 0);
  
  // Use the proper delivery fee hook that handles PREMIERE2025 and other free shipping codes
  const finalDeliveryFee = useDeliveryFee(cartSubtotal, appliedDiscount, tracking.freeShippingEligible);
  
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? cartSubtotal * (1 - appliedDiscount.value / 100)
    : cartSubtotal;
  
  const calculatedSalesTax = cartSubtotal * 0.0825; // 8.25% sales tax on original subtotal

  // FIXED: Add tip amount back to total calculation
  const [tipAmount, setTipAmount] = useState(0);
  const finalTotal = discountedSubtotal + finalDeliveryFee + calculatedSalesTax + tipAmount;

  // Discount management
  const handlePromoApplied = (discount: {code: string, type: 'percentage' | 'free_shipping', value: number} | null) => {
    if (onDiscountChange) {
      onDiscountChange(discount);
    }
  };

  // Step confirmation handlers
  const handleDateTimeConfirm = () => {
    console.log('📅 DateTime confirm attempted:', { isDateTimeComplete, deliveryInfo });
    if (isDateTimeComplete) {
      setConfirmedDateTime(true);
      setCurrentStep('address');
      console.log('✅ DateTime confirmed, moving to address step');
    } else {
      console.warn('⚠️ DateTime incomplete, cannot confirm');
    }
  };

  const handleAddressConfirm = () => {
    console.log('🏠 Address confirm attempted:', { isAddressComplete, addressInfo });
    if (isAddressComplete) {
      setConfirmedAddress(true);
      console.log('✅ Address confirmed');
    } else {
      console.warn('⚠️ Address incomplete, cannot confirm');
    }
  };

  const handleCustomerConfirm = () => {
    console.log('👤 Customer confirm attempted:', { isCustomerComplete, customerInfo });
    if (isCustomerComplete) {
      setConfirmedCustomer(true);
      setCurrentStep('payment');
      console.log('✅ Customer confirmed, moving to payment step');
    } else {
      console.warn('⚠️ Customer info incomplete, cannot confirm');
    }
  };

  const handleEditAll = () => {
    console.log('🔄 User editing all fields - resetting all confirmations');
    setConfirmedDateTime(false);
    setConfirmedAddress(false);
    setConfirmedCustomer(false);
    setCurrentStep('datetime');
  };

  const handleClearAllData = () => {
    console.log('🧹 Clearing all checkout data for fresh start');
    
    // Use universal storage for bulletproof clearing
    checkoutStorage.clearAll();
    
    // Reset all state
    setConfirmedDateTime(false);
    setConfirmedAddress(false);
    setConfirmedCustomer(false);
    setCurrentStep('datetime');
    
    // Reset form data
    setCustomerInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    setAddressInfo({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: ''
    });
    
    console.log('✅ All checkout data cleared universally - works in ALL browsers and conditions');
  };

  const handlePaymentSuccess = (paymentIntentId?: string) => {
    // Clear checkout session
    try {
      sessionStorage.removeItem('checkout_session_id');
      localStorage.removeItem('unified-cart');
    } catch (error) {
      console.warn('Failed to clear checkout session:', error);
    }

    // Store checkout completion data for the OrderComplete page
    const checkoutCompletionData = {
      cartItems,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerEmail: customerInfo.email,
      deliveryAddress: deliveryInfo,
      deliveryDate: deliveryInfo.date,
      deliveryTime: deliveryInfo.timeSlot,
      totalAmount: finalTotal,
      subtotal: discountedSubtotal,
      deliveryFee: finalDeliveryFee,
      salesTax: calculatedSalesTax,
      tipAmount: tipAmount, // Include tip amount in completion data
      paymentIntentId,
      appliedDiscount
    };
    
    sessionStorage.setItem('checkout-completion-data', JSON.stringify(checkoutCompletionData));
    
    // Navigate to order complete page with payment intent in URL
    navigate(`/order-complete?payment_intent=${paymentIntentId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 overflow-x-hidden" data-checkout-form>
      <MobileInputFix />
      <CheckoutInputOptimizer />
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full checkout-form">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2 p-2 sm:p-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Cart</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">
            {hasSavedData() ? 'Fast Checkout' : 'Checkout'}
          </h1>
        </div>

        {/* Fast Checkout Header - Shows saved info condensed */}
        <FastCheckoutHeader
          customerInfo={persistedCustomer}
          deliveryInfo={deliveryInfo}
          hasSavedData={hasSavedData()}
          onEditAll={handleEditAll}
        />

        {/* Progress Steps */}
        <CheckoutSteps
          currentStep={currentStep}
          confirmedDateTime={confirmedDateTime}
          confirmedAddress={confirmedAddress}
          confirmedCustomer={confirmedCustomer}
        />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6 mt-4 sm:mt-6">
          
          {/* Left Column - Checkout Steps (Wider on Large Screens) */}
          <div className="xl:col-span-3 space-y-4 checkout-form">
            
            {/* Date & Time Step */}
            <ImprovedDateTimeStep
              deliveryInfo={deliveryInfo}
              onDeliveryInfoChange={onDeliveryInfoChange}
              onConfirm={handleDateTimeConfirm}
              onEdit={() => setConfirmedDateTime(false)}
              isConfirmed={false}
            />

            {/* Address & Customer Info Step */}
            {(confirmedDateTime || currentStep === 'address') && (
              <>
                <AddressStep
                  addressInfo={addressInfo}
                  setAddressInfo={setAddressInfo}
                  onConfirm={handleAddressConfirm}
                  onEdit={() => {
                    setConfirmedAddress(false);
                    setConfirmedCustomer(false);
                  }}
                  isConfirmed={false}
                />
                
                {/* Customer Info - shown inline with address */}
                {!confirmedCustomer && (
                  <CustomerInfoStep
                    customerInfo={customerInfo}
                    setCustomerInfo={setCustomerInfo}
                    onConfirm={handleCustomerConfirm}
                    onEdit={() => {
                      setConfirmedCustomer(false);
                    }}
                    isConfirmed={false}
                  />
                )}
              </>
            )}

            {/* Promo Code Section - Move Above Payment */}
            {(currentStep === 'payment' || (confirmedDateTime && confirmedAddress && confirmedCustomer)) && (
              <div className="space-y-4">
                 <PromoCodeInput 
                   onDiscountApplied={handlePromoApplied}
                   appliedDiscount={appliedDiscount}
                   cartSubtotal={cartSubtotal}
                 />
              </div>
            )}

            {/* Payment Step - Now Last */}
            {(currentStep === 'payment' || (confirmedDateTime && confirmedAddress && confirmedCustomer)) && (
            <StripePaymentWrapper
              cartItems={cartItems}
              subtotal={discountedSubtotal}
              deliveryFee={finalDeliveryFee}
              salesTax={calculatedSalesTax}
              customerInfo={customerInfo}
              deliveryInfo={deliveryInfo}
              appliedDiscount={appliedDiscount}
              onPaymentSuccess={handlePaymentSuccess}
              isAddingToOrder={isAddingToOrder}
              affiliateCode={affiliateCode}
              tipAmount={tipAmount}
              onTipChange={(amount) => {
                setTipAmount(amount);
                if (onTipChange) onTipChange(amount);
              }}
            />
            )}
          </div>

          {/* Right Column - Always Show Product List & Safeguards */}
          <div className="xl:col-span-2 space-y-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              <ImprovedCheckoutSummary
                cartItems={cartItems}
                subtotal={cartSubtotal}
                deliveryFee={finalDeliveryFee}
                salesTax={calculatedSalesTax}
                tipAmount={tipAmount} // Pass tip amount to summary
                appliedDiscount={appliedDiscount}
                onUpdateQuantity={onUpdateQuantity}
              />
              
              {/* Checkout Safeguards - Always visible to ensure editability */}
              <CheckoutSafeguards
                onResetCheckout={handleEditAll}
                onClearAllData={handleClearAllData}
              />
              
              {/* Development: Checkout Flow Validator */}
              {process.env.NODE_ENV === 'development' && (
                <CheckoutFlowValidator />
              )}
            </div>
          </div>
        </div>
        
        {/* Completion Message */}
        {currentStep !== 'payment' && (
          <div className="text-center text-muted-foreground mt-6">
            <p className="text-sm">Complete all steps to proceed with payment</p>
          </div>
        )}
        
      </div>

      {/* Safe Mobile Checkout Button - Positioned above browser bottom menu */}
      {currentStep === 'payment' && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Add safe area for browser bottom navigation */}
            <div 
              className="bg-background border-t p-4" 
              style={{ 
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                bottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              <Button 
                onClick={() => {
                  // Find and click the payment form submit button
                  const form = document.querySelector('form');
                  if (form) {
                    // Create a submit event to trigger the form submission
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Pay ${finalTotal.toFixed(2)}
              </Button>
            </div>
          </div>
          
          {/* Global styles for mobile browser UI handling */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 1023px) {
                body {
                  padding-bottom: env(safe-area-inset-bottom);
                }
                
                /* Hide browser chrome on scroll */
                html {
                  overscroll-behavior-y: none;
                }
                
                /* Force mobile viewport to account for bottom UI */
                .checkout-safe-area {
                  padding-bottom: calc(6rem + env(safe-area-inset-bottom));
                }
              }
            `
          }} />
        </>
      )}
      
      {/* Add bottom padding for mobile when sticky button is shown */}
      <div className={`${currentStep === 'payment' ? 'checkout-safe-area lg:pb-0' : ''}`} />
    </div>
  );
};