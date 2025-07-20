import React, { useState, useEffect } from 'react';
import { DeliveryScheduler } from './delivery/DeliveryScheduler';
import { ProductCategories } from './delivery/ProductCategories';
import { DeliveryCart } from './delivery/DeliveryCart';
import { CheckoutFlow } from './delivery/CheckoutFlow';
import { OrderContinuation } from './OrderContinuation';
import { AddressConfirmation } from './AddressConfirmation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWakeLock } from '@/hooks/useWakeLock';

export type DeliveryStep = 'order-continuation' | 'address-confirmation' | 'products' | 'cart' | 'checkout';

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
  // Enable wake lock to keep screen on during app usage
  useWakeLock();
  
  // Check for persistent add to order flag and group order context
  const addToOrderFlag = localStorage.getItem('partyondelivery_add_to_order') === 'true';
  const groupOrderData = localStorage.getItem('partyondelivery_group_order');
  const isGroupOrder = groupOrderData ? JSON.parse(groupOrderData)?.isGroupOrder : false;
  
  const [currentStep, setCurrentStep] = useLocalStorage<DeliveryStep>('partyondelivery_current_step', 
    isGroupOrder ? 'products' : 'order-continuation');
  const [deliveryInfo, setDeliveryInfo] = useLocalStorage<DeliveryInfo>('partyondelivery_delivery_info', {
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('partyondelivery_cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('partyondelivery_last_order', null);
  const [isAddingToOrder, setIsAddingToOrder] = useLocalStorage<boolean>('partyondelivery_is_adding_to_order', addToOrderFlag || isGroupOrder);
  const [useSameAddress, setUseSameAddress] = useLocalStorage<boolean>('partyondelivery_use_same_address', false);
  
  // State for tracking cart calculations (for cart/checkout sync)
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Calculate subtotal for consistent delivery fee calculation
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

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

  // Check for add to order flag and group order context on component mount
  useEffect(() => {
    const addToOrderFlag = localStorage.getItem('partyondelivery_add_to_order');
    const groupOrderData = localStorage.getItem('partyondelivery_group_order');
    
    // Handle group order flow
    if (groupOrderData) {
      try {
        const groupOrder = JSON.parse(groupOrderData);
        if (groupOrder.isGroupOrder) {
          // Pre-fill delivery info from group order
          if (groupOrder.deliveryDate) {
            const date = new Date(groupOrder.deliveryDate);
            setDeliveryInfo(prev => ({ ...prev, date }));
          }
          if (groupOrder.deliveryTime) {
            setDeliveryInfo(prev => ({ ...prev, timeSlot: groupOrder.deliveryTime }));
          }
          if (groupOrder.address) {
            setDeliveryInfo(prev => ({ ...prev, address: groupOrder.address }));
          }
          if (groupOrder.instructions) {
            setDeliveryInfo(prev => ({ ...prev, instructions: groupOrder.instructions }));
          }
          // Group orders skip address confirmation
          setUseSameAddress(true);
          setIsAddingToOrder(true);
        }
      } catch (error) {
        console.error('Error parsing group order data:', error);
      }
    }
    
    // Handle regular add to order flow
    if (addToOrderFlag === 'true' && validLastOrderInfo && !groupOrderData) {
      // DON'T clear the flag - it should persist until delivery date/time passes
      // Start the add to order flow
      handleAddToOrder();
    }
    
    // Clean up expired add to order flag if delivery has passed
    if (addToOrderFlag === 'true' && !validLastOrderInfo) {
      localStorage.removeItem('partyondelivery_add_to_order');
    }
  }, [validLastOrderInfo]);

  const handleStartNewOrder = () => {
    // Clear cart and start fresh
    setCartItems([]);
    setIsAddingToOrder(false);
    setDeliveryInfo({
      date: null,
      timeSlot: '',
      address: '',
      instructions: ''
    });
    // Clear the add to order flag and group order context when starting a completely new order
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_group_order');
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToOrder = () => {
    // Keep existing cart and order info
    setIsAddingToOrder(true);
    
    // Pre-fill delivery info when adding to order
    if (validLastOrderInfo) {
      if (validLastOrderInfo.deliveryDate) {
        const date = new Date(validLastOrderInfo.deliveryDate);
        setDeliveryInfo(prev => ({ ...prev, date }));
      }
      if (validLastOrderInfo.deliveryTime) {
        setDeliveryInfo(prev => ({ ...prev, timeSlot: validLastOrderInfo.deliveryTime }));
      }
      if (validLastOrderInfo.address) {
        setDeliveryInfo(prev => ({ ...prev, address: validLastOrderInfo.address }));
      }
      if (validLastOrderInfo.instructions) {
        setDeliveryInfo(prev => ({ ...prev, instructions: validLastOrderInfo.instructions }));
      }
    }
    
    // Always go to address confirmation first for add-to-order flow
    // This ensures users see the address confirmation screen
    if (validLastOrderInfo?.address) {
      setCurrentStep('address-confirmation');
    } else {
      setCurrentStep('products');
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSameAddress = () => {
    setUseSameAddress(true);
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseNewAddress = () => {
    setUseSameAddress(false);
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAddressConfirmation = () => {
    setCurrentStep('address-confirmation');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleBackToProducts = () => {
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOrderContinuation = () => {
    setCurrentStep('order-continuation');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    console.log('handleCheckout called', { 
      cartItems: cartItems.length, 
      isAddingToOrder, 
      useSameAddress, 
      currentStep 
    });
    
    // Ensure we have items in cart before proceeding
    if (cartItems.length === 0) {
      console.warn('Cannot proceed to checkout with empty cart');
      // Add toast notification for better UX
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: "Cart is empty",
          description: "Please add items to your cart before proceeding to checkout.",
          variant: "destructive",
        });
      });
      return;
    }
    
    // Close cart if open
    setIsCartOpen(false);
    
    console.log('About to set checkout step');
    // Set checkout step with a small delay to ensure smooth transition
    setTimeout(() => {
      setCurrentStep('checkout');
      console.log('Checkout step set');
      // Scroll to top after transition
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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
          onBack={isAddingToOrder && validLastOrderInfo?.address ? handleBackToAddressConfirmation : handleBackToOrderContinuation}
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