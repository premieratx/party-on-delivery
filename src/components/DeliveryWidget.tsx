import React, { useState, useEffect } from 'react';
import { AgeVerification } from './delivery/AgeVerification';
import { DeliveryScheduler } from './delivery/DeliveryScheduler';
import { ProductCategories } from './delivery/ProductCategories';
import { DeliveryCart } from './delivery/DeliveryCart';
import { CheckoutFlow } from './delivery/CheckoutFlow';
import { OrderContinuation } from './OrderContinuation';
import { AddressConfirmation } from './AddressConfirmation';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type DeliveryStep = 'order-continuation' | 'address-confirmation' | 'age-verify' | 'schedule' | 'products' | 'cart' | 'checkout';

export interface CartItem {
  id: string;
  title: string;
  name: string; // Add name field to match what's needed for Shopify
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

export interface DeliveryInfo {
  date: Date | null;
  timeSlot: string;
  address: string;
  instructions?: string;
}

export const DeliveryWidget: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('order-continuation');
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('partyondelivery_cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('partyondelivery_last_order', null);
  const [isAddingToOrder, setIsAddingToOrder] = useState(false);
  const [useSameAddress, setUseSameAddress] = useState(false);
  
  // State for tracking cart calculations (for cart/checkout sync)
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if last order has expired (delivery date/time has passed)
  const isLastOrderExpired = () => {
    if (!lastOrderInfo?.deliveryDate || !lastOrderInfo?.deliveryTime) return true;
    
    try {
      const deliveryDate = new Date(lastOrderInfo.deliveryDate);
      const [timeSlot] = lastOrderInfo.deliveryTime.split(' - '); // Get start time from "10:00 AM - 11:00 AM"
      const [time, period] = timeSlot.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let deliveryHours = hours;
      if (period === 'PM' && hours !== 12) deliveryHours += 12;
      if (period === 'AM' && hours === 12) deliveryHours = 0;
      
      deliveryDate.setHours(deliveryHours, minutes, 0, 0);
      
      return new Date() > deliveryDate;
    } catch (error) {
      console.error('Error parsing delivery date/time:', error);
      return true; // If we can't parse, assume expired
    }
  };

  // Filter out expired orders
  const validLastOrderInfo = lastOrderInfo && !isLastOrderExpired() ? lastOrderInfo : null;

  const handleStartNewOrder = () => {
    // Clear cart and start fresh
    setCartItems([]);
    setIsAddingToOrder(false);
    setCurrentStep('age-verify');
  };

  const handleAddToOrder = () => {
    // Keep existing cart and order info
    setIsAddingToOrder(true);
    if (validLastOrderInfo?.address) {
      setCurrentStep('address-confirmation');
    } else {
      setCurrentStep('age-verify');
    }
  };

  const handleConfirmSameAddress = () => {
    setUseSameAddress(true);
    setCurrentStep('age-verify');
  };

  const handleUseNewAddress = () => {
    setUseSameAddress(false);
    setCurrentStep('age-verify');
  };

  const handleBackToAddressConfirmation = () => {
    setCurrentStep('address-confirmation');
  };

  const handleBackToOrderContinuation = () => {
    setCurrentStep('order-continuation');
  };

  const handleAgeVerified = (verified: boolean) => {
    setIsAgeVerified(verified);
    if (verified) {
      setCurrentStep('products');
    }
  };

  const handleBackToProducts = () => {
    setCurrentStep('products');
  };

  const handleBackToAgeVerify = () => {
    setCurrentStep('age-verify');
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.variant === item.variant);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.variant === item.variant 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Don't auto-open cart anymore - user requested this change
  };

  const updateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => !(i.id === id && i.variant === variant)));
    } else {
      setCartItems(prev => prev.map(i => 
        i.id === id && i.variant === variant 
          ? { ...i, quantity }
          : i
      ));
    }
  };

  const removeFromCart = (id: string, variant?: string) => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.variant === variant)));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setCurrentStep('checkout');
  };

  if (currentStep === 'order-continuation') {
    return (
      <OrderContinuation
        onStartNewOrder={handleStartNewOrder}
        onAddToOrder={handleAddToOrder}
        lastOrderInfo={validLastOrderInfo}
      />
    );
  }

  if (currentStep === 'address-confirmation') {
    return (
      <AddressConfirmation
        onConfirmSameAddress={handleConfirmSameAddress}
        onUseNewAddress={handleUseNewAddress}
        onBack={handleBackToOrderContinuation}
        lastOrderInfo={validLastOrderInfo}
      />
    );
  }

  if (!isAgeVerified && currentStep === 'age-verify') {
    return <AgeVerification 
      onVerified={handleAgeVerified} 
      onBack={isAddingToOrder && validLastOrderInfo?.address ? handleBackToAddressConfirmation : handleBackToOrderContinuation}
    />;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'products' && (
        <ProductCategories 
          onAddToCart={addToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={handleBackToAgeVerify}
        />
      )}

      {currentStep === 'checkout' && (
        <CheckoutFlow 
          cartItems={cartItems}
          deliveryInfo={deliveryInfo}
          totalPrice={getTotalPrice()}
          onBack={handleBackToProducts}
          onDeliveryInfoChange={setDeliveryInfo}
          onUpdateQuantity={updateQuantity}
          isAddingToOrder={isAddingToOrder}
          useSameAddress={useSameAddress}
          lastOrderInfo={validLastOrderInfo}
          onDiscountChange={setAppliedDiscount}
          onTipChange={setTipAmount}
          onChangesDetected={setHasChanges}
        />
      )}

      {/* Slide-out Cart */}
      <DeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={deliveryInfo}
        isAddingToOrder={isAddingToOrder}
        useSameAddress={useSameAddress}
        hasChanges={hasChanges}
        appliedDiscount={appliedDiscount}
        tipAmount={tipAmount}
      />
    </div>
  );
};