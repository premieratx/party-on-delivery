import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, DeliveryInfo } from '../DeliveryWidget';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';
import { useToast } from '@/hooks/use-toast';

// Import our new modular components
import { ImprovedDateTimeStep } from './ImprovedDateTimeStep';
import { AddressStep } from './AddressStep';
import { CustomerInfoStep } from './CustomerInfoStep';
import { ImprovedCheckoutSummary } from './ImprovedCheckoutSummary';
import { StripePaymentWrapper } from './StripePaymentWrapper';
import { PromoCodeInput } from './PromoCodeInput';

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
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  
  // AUTO-CLOSE FIELD STATE MANAGEMENT
  const [tipAmount, setTipAmount] = useState(() => {
    // Default to 10% tip
    const defaultTip = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.10;
    return defaultTip;
  });
  const [confirmedSteps, setConfirmedSteps] = useState({
    dateTime: false,
    address: false,
    customerInfo: false
  });

  // LOAD SAVED DATA ON MOUNT - EVERYONE CAN SAVE AND LOAD
  useEffect(() => {
    try {
      // Load saved customer info
      const savedCustomer = localStorage.getItem('partyondelivery_customer');
      if (savedCustomer) {
        const parsedCustomer = JSON.parse(savedCustomer);
        setCustomerInfo(parsedCustomer);
        console.log('✅ Loaded saved customer info:', parsedCustomer);
      }

      // Load saved address info
      const savedAddress = localStorage.getItem('partyondelivery_address');
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setAddressInfo(parsedAddress);
        console.log('✅ Loaded saved address info:', parsedAddress);
      }

      // Load saved delivery info
      const savedDelivery = localStorage.getItem('partyondelivery_delivery_info');
      if (savedDelivery) {
        const parsedDelivery = JSON.parse(savedDelivery);
        if (parsedDelivery.date && parsedDelivery.timeSlot) {
          onDeliveryInfoChange({
            ...deliveryInfo,
            date: new Date(parsedDelivery.date),
            timeSlot: parsedDelivery.timeSlot,
            address: parsedDelivery.address || deliveryInfo.address,
            instructions: parsedDelivery.instructions || deliveryInfo.instructions
          });
          console.log('✅ Loaded saved delivery info:', parsedDelivery);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved checkout data:', error);
    }
  }, []);

  // Update delivery info when address changes - ALWAYS ALLOWED
  useEffect(() => {
    if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
      const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      const updatedDeliveryInfo = {
        ...deliveryInfo,
        address: fullAddress,
        instructions: addressInfo.instructions || ''
      };
      onDeliveryInfoChange(updatedDeliveryInfo);

      // SAVE IMMEDIATELY - NO RESTRICTIONS
      try {
        localStorage.setItem('partyondelivery_delivery_info', JSON.stringify({
          ...updatedDeliveryInfo,
          date: updatedDeliveryInfo.date ? updatedDeliveryInfo.date.toISOString() : null
        }));
        console.log('✅ Auto-saved delivery info with address');
      } catch (error) {
        console.warn('Failed to auto-save delivery info:', error);
      }
    }
  }, [addressInfo, deliveryInfo, onDeliveryInfoChange]);

  // Pricing calculations - SIMPLE AND DIRECT
  const markupPercent = Number(sessionStorage.getItem('pricing.markupPercent') || '0');
  const applyMarkup = (price: number) => price * (1 + (isNaN(markupPercent) ? 0 : markupPercent) / 100);
  const cartSubtotal = cartItems.reduce((total, item) => total + (applyMarkup(item.price) * item.quantity), 0);
  
  // Corrected delivery fee calculation per requirements
  const deliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : 
    (cartSubtotal >= 200 ? Math.round(cartSubtotal * 0.1 * 100) / 100 : 20);
  
  const discountedSubtotal = appliedDiscount?.type === 'percentage' 
    ? cartSubtotal * (1 - appliedDiscount.value / 100)
    : cartSubtotal;
  
  const calculatedSalesTax = cartSubtotal * 0.0825; // 8.25% sales tax
  const finalTotal = discountedSubtotal + deliveryFee + calculatedSalesTax + tipAmount;

  // Step confirmation handlers - auto-close fields after saving
  const handleDateTimeConfirm = () => {
    setConfirmedSteps(prev => ({ ...prev, dateTime: true }));
    toast({ title: "✅ Date & Time Saved!", description: "Your delivery preferences have been saved." });
  };

  const handleAddressConfirm = () => {
    setConfirmedSteps(prev => ({ ...prev, address: true }));
    toast({ title: "✅ Address Saved!", description: "Your delivery address has been saved." });
  };

  const handleCustomerInfoConfirm = () => {
    setConfirmedSteps(prev => ({ ...prev, customerInfo: true }));
    toast({ title: "✅ Contact Info Saved!", description: "Your contact information has been saved." });
  };

  // Step edit handlers - re-open fields for editing
  const handleEditStep = (step: keyof typeof confirmedSteps) => {
    setConfirmedSteps(prev => ({ ...prev, [step]: false }));
  };

  // Discount management - ALWAYS ALLOWED
  const handlePromoApplied = (discount: {code: string, type: 'percentage' | 'free_shipping', value: number} | null) => {
    if (onDiscountChange) {
      onDiscountChange(discount);
    }
  };

  // COMPLETELY UNLOCKED HANDLERS - NO RESTRICTIONS
  const handlePaymentSuccess = (paymentIntentId?: string) => {
    // Clear checkout session
    try {
      sessionStorage.removeItem('checkout_session_id');
      localStorage.removeItem('unified-cart');
    } catch (error) {
      console.warn('Failed to clear checkout session:', error);
    }

    // Store checkout completion data
    const checkoutCompletionData = {
      cartItems,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerEmail: customerInfo.email,
      deliveryAddress: deliveryInfo,
      deliveryDate: deliveryInfo.date,
      deliveryTime: deliveryInfo.timeSlot,
      totalAmount: finalTotal,
      subtotal: discountedSubtotal,
      deliveryFee: deliveryFee,
      salesTax: calculatedSalesTax,
      tipAmount: tipAmount,
      paymentIntentId,
      appliedDiscount
    };
    
    sessionStorage.setItem('checkout-completion-data', JSON.stringify(checkoutCompletionData));
    navigate(`/order-complete?payment_intent=${paymentIntentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 overflow-x-hidden">
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full">
        
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
          <h1 className="text-xl sm:text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6 mt-4 sm:mt-6">
          
          {/* Left Column - ALL STEPS ALWAYS VISIBLE AND EDITABLE */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* COLLAPSIBLE: Date & Time Step */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">📅 Delivery Date & Time</h3>
              <ImprovedDateTimeStep
                deliveryInfo={deliveryInfo}
                onDeliveryInfoChange={onDeliveryInfoChange}
                onConfirm={handleDateTimeConfirm}
                onEdit={() => handleEditStep('dateTime')}
                isConfirmed={confirmedSteps.dateTime}
              />
            </div>

            {/* COLLAPSIBLE: Address Step */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">🏠 Delivery Address</h3>
              <AddressStep
                addressInfo={addressInfo}
                setAddressInfo={setAddressInfo}
                onConfirm={handleAddressConfirm}
                onEdit={() => handleEditStep('address')}
                isConfirmed={confirmedSteps.address}
              />
            </div>

            {/* COLLAPSIBLE: Customer Info Step */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">👤 Your Information</h3>
              <CustomerInfoStep
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                onConfirm={handleCustomerInfoConfirm}
                onEdit={() => handleEditStep('customerInfo')}
                isConfirmed={confirmedSteps.customerInfo}
              />
            </div>

            {/* ALWAYS ACCESSIBLE: Promo Code */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">🎫 Promo Code</h3>
              <PromoCodeInput 
                onDiscountApplied={handlePromoApplied}
                appliedDiscount={appliedDiscount}
                cartSubtotal={cartSubtotal}
              />
            </div>

            {/* ALWAYS ACCESSIBLE: Payment Section */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary">💳 Payment</h3>
              <StripePaymentWrapper
                cartItems={cartItems}
                subtotal={discountedSubtotal}
                deliveryFee={deliveryFee}
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
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="xl:col-span-2 space-y-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              <ImprovedCheckoutSummary
                cartItems={cartItems}
                subtotal={cartSubtotal}
                deliveryFee={deliveryFee}
                salesTax={calculatedSalesTax}
                tipAmount={tipAmount}
                appliedDiscount={appliedDiscount}
                onUpdateQuantity={onUpdateQuantity}
              />
              
              {/* Confirmation Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Smart Auto-Save</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Click "Confirm" to close each section</li>
                  <li>• All info saves automatically as you type</li>
                  <li>• Click "Edit" to reopen any section</li>
                  <li>• Works on all devices & browsers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Checkout Button - ALWAYS ACTIVE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-background border-t p-4">
          <Button 
            onClick={() => {
              const form = document.querySelector('form');
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
              }
            }}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            size="lg"
          >
            Complete Order - ${finalTotal.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};