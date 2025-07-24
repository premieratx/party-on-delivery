import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DeliveryScheduler } from './delivery/DeliveryScheduler';
import { ProductCategories } from './delivery/ProductCategories';
import { DeliveryCart } from './delivery/DeliveryCart';
import { CheckoutFlow } from './delivery/CheckoutFlow';
import { OrderContinuation } from './OrderContinuation';
import { AddressConfirmation } from './AddressConfirmation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';

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
  
  const location = useLocation();
  const [affiliateReferral, setAffiliateReferral] = useReliableStorage('affiliateReferral', '');
  
  // Check for persistent add to order flag
  const addToOrderFlag = localStorage.getItem('partyondelivery_add_to_order') === 'true';
  
  // ALWAYS start on order-continuation
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('order-continuation');
  const [deliveryInfo, setDeliveryInfo] = useLocalStorage<DeliveryInfo>('partyondelivery_delivery_info', {
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('partyondelivery_cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('partyondelivery_last_order', null);
  const [isAddingToOrder, setIsAddingToOrder] = useState<boolean>(!!addToOrderFlag);
  const [useSameAddress, setUseSameAddress] = useState<boolean>(false);

  // Handle affiliate tracking from navigation state
  useEffect(() => {
    if (location.state?.fromAffiliate) {
      setAffiliateReferral(location.state.fromAffiliate);
      console.log('Affiliate referral set:', location.state.fromAffiliate);
    }
  }, [location.state, setAffiliateReferral]);
  
  // State for tracking cart calculations (for cart/checkout sync) - persist discount in localStorage
  const [appliedDiscount, setAppliedDiscount] = useLocalStorage<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>('partyondelivery_applied_discount', null);
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

  // Optimized useEffect with better dependency management
  useEffect(() => {
    const addToOrderFlag = localStorage.getItem('partyondelivery_add_to_order');
    
    console.log('=== DeliveryWidget useEffect ===');
    console.log('addToOrderFlag:', addToOrderFlag);
    console.log('validLastOrderInfo:', validLastOrderInfo);
    
    // Use requestAnimationFrame to defer non-critical operations
    requestAnimationFrame(() => {
      // Handle regular add to order flow - but only pre-fill if not already set
      if (addToOrderFlag === 'true' && validLastOrderInfo) {
        console.log('Processing add to order flag with lastOrderInfo:', validLastOrderInfo);
        // Set the bundle-ready flag and enable free shipping when same address is used
        setIsAddingToOrder(true);
        
        // Apply bundle-ready tag until delivery date/time passes
        localStorage.setItem('partyondelivery_bundle_ready', 'true');
        
        // Don't pre-fill here - let CheckoutFlow handle it to avoid conflicts
        // Start the add to order flow
        handleAddToRecentOrder();
      }
    });
    
    console.log('=== End DeliveryWidget useEffect ===');
  }, [validLastOrderInfo?.deliveryDate, validLastOrderInfo?.deliveryTime]); // Only depend on critical fields

  const handleStartNewOrder = () => {
    console.log('=== handleStartNewOrder ===');
    
    // Keep existing cart and delivery info - just start a standard new order flow
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Keep all delivery info and customer info for pre-filling
    // Don't clear anything - let CheckoutFlow handle pre-filling from saved data
    
    // Clear all persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeOrder = () => {
    console.log('=== handleResumeOrder ===');
    
    // Resume order works exactly like start new order now - keep everything
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Keep all delivery info and customer info for pre-filling
    // Don't clear anything - let CheckoutFlow handle pre-filling from saved data
    
    // Clear persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    
    setCurrentStep('products');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToRecentOrder = () => {
    console.log('=== handleAddToRecentOrder ===');
    console.log('validLastOrderInfo:', validLastOrderInfo);
    
    // If no valid last order (new customer), behave like new order
    if (!validLastOrderInfo) {
      handleStartNewOrder();
      return;
    }
    
    // Keep existing cart and order info
    setIsAddingToOrder(true);
    
    // DON'T clear delivery info completely - let CheckoutFlow handle all pre-filling from lastOrderInfo
    // Keep the current deliveryInfo structure intact so CheckoutFlow can properly pre-fill from lastOrderInfo
    // setDeliveryInfo(prev => ({
    //   date: null, // Will be pre-filled by CheckoutFlow
    //   timeSlot: '', // Will be pre-filled by CheckoutFlow  
    //   address: prev.address, // Keep existing if any
    //   instructions: prev.instructions // Keep existing if any
    // }));
    
    // Go directly to products - CheckoutFlow will handle pre-filling delivery info
    setCurrentStep('products');
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

  const emptyCart = () => {
    console.log('=== emptyCart ===');
    setCartItems([]);
    // Show confirmation message
    import('@/hooks/use-toast').then(({ useToast }) => {
      const { toast } = useToast();
      toast({
        title: "Cart emptied",
        description: "All items have been removed from your cart.",
      });
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    try {
      console.log('=== CHECKOUT BUTTON CLICKED ===');
      console.log('cartItems length:', cartItems.length);
      console.log('isAddingToOrder:', isAddingToOrder);
      console.log('useSameAddress:', useSameAddress);
      console.log('currentStep:', currentStep);
      console.log('deliveryInfo:', deliveryInfo);
      console.log('validLastOrderInfo:', validLastOrderInfo);
      console.log('===================================');
      
      // Ensure we have items in cart before proceeding
      if (cartItems.length === 0) {
        console.warn('Cannot proceed to checkout with empty cart');
        // Add toast notification for better UX
        import('@/hooks/use-toast').then(({ useToast }) => {
          const { toast } = useToast();
          toast({
            title: "Cart is empty",
            description: "Please add items to your cart before proceeding to checkout.",
            variant: "destructive",
          });
        });
        return;
      }
      
      console.log('Cart has items, proceeding...');
      
      // Close cart if open
      setIsCartOpen(false);
      console.log('Cart closed');
      
      console.log('About to set checkout step...');
      // Set checkout step immediately
      setCurrentStep('checkout');
      console.log('Checkout step set successfully');
      
      // Scroll to top
      console.log('Scrolling to top...');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('Scrolled to top');
      
    } catch (error) {
      console.error('Error in handleCheckout:', error);
      alert('Error in checkout: ' + error.message);
    }
  };

  if (currentStep === 'order-continuation') {
    return (
      <OrderContinuation
        onStartNewOrder={handleStartNewOrder}
        onResumeOrder={handleResumeOrder}
        onAddToRecentOrder={handleAddToRecentOrder}
        lastOrderInfo={validLastOrderInfo}
        hasCartItems={cartItems.length > 0}
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
          onBack={handleBackToOrderContinuation}
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
          appliedDiscount={appliedDiscount}
          affiliateCode={affiliateReferral}
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
        onEmptyCart={emptyCart}
      />
    </div>
  );
};
