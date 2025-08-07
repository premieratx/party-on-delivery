import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { DeliveryScheduler } from './delivery/DeliveryScheduler';
import { ProductCategories } from './delivery/ProductCategories';
import { DeliveryCart } from './delivery/DeliveryCart';
import { CheckoutFlow } from './delivery/CheckoutFlow';
import { OrderContinuation } from './OrderContinuation';
import { AddressConfirmation } from './AddressConfirmation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';
import { useUnifiedCart, UnifiedCartItem } from '@/hooks/useUnifiedCart';
import { useGroupOrderHandler } from '@/hooks/useGroupOrderHandler';
import GroupOrderJoinFlow from './GroupOrderJoinFlow';
import { getActiveDeliveryInfo, formatDeliveryDate, isDeliveryExpired } from '@/utils/deliveryInfoManager';

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
  
  const navigate = useNavigate();
  const [affiliateReferral, setAffiliateReferral] = useReliableStorage('affiliateReferral', '');
  const [startingPage, setStartingPage] = useReliableStorage('startingPage', '/');
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  // Use clean group order handler
  const { groupOrderData, isJoiningGroup, showJoinFlow, clearGroupOrder, handleJoinConfirmed, handleJoinDeclined } = useGroupOrderHandler();
  
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('partyondelivery_last_order', null);
  const [isAddingToOrder, setIsAddingToOrder] = useState<boolean>(!!addToOrderFlag || isJoiningGroup);
  const [useSameAddress, setUseSameAddress] = useState<boolean>(false);

  // State for tracking cart calculations (for cart/checkout sync) - persist discount in localStorage
  const [appliedDiscount, setAppliedDiscount] = useLocalStorage<{code: string, type: 'percentage' | 'free_shipping', value: number} | null>('partyondelivery_applied_discount', null);
  const [tipAmount, setTipAmount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Clean up old logic - the group order handler takes care of URL params now
  
  // Calculate subtotal for consistent delivery fee calculation
  const subtotal = getTotalPrice();

  // Use single source of truth for delivery info with proper expiry checking
  const validLastOrderInfo = lastOrderInfo && lastOrderInfo.deliveryDate && lastOrderInfo.deliveryTime && 
    !isDeliveryExpired(lastOrderInfo.deliveryDate, lastOrderInfo.deliveryTime) ? lastOrderInfo : null;

  // Handle add to order flow when flag is set
  useEffect(() => {
    const addToOrderFlag = localStorage.getItem('partyondelivery_add_to_order');
    
    if (addToOrderFlag === 'true' && validLastOrderInfo) {
      console.log('Processing add to order flag with lastOrderInfo:', validLastOrderInfo);
      setIsAddingToOrder(true);
      localStorage.setItem('partyondelivery_bundle_ready', 'true');
      handleAddToRecentOrder();
    }
  }, [validLastOrderInfo?.deliveryDate, validLastOrderInfo?.deliveryTime]);

  const handleStartNewOrder = () => {
    console.log('=== handleStartNewOrder ===');
    
    // Keep existing cart and delivery info - just start a standard new order flow
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Clear all persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    clearGroupOrder(); // Use group order handler to clear
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeOrder = () => {
    console.log('=== handleResumeOrder ===');
    
    // Resume order works exactly like start new order now - keep everything
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Clear persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    clearGroupOrder(); // Use group order handler to clear
    
    setCurrentStep('products');
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
    
    // Go directly to products - CheckoutFlow will handle pre-filling delivery info
    setCurrentStep('products');
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

  const handleAddToCart = (item: Omit<UnifiedCartItem, 'quantity'>) => {
    console.log('🛒 DeliveryWidget: Adding product to cart:', item);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(cartItem => 
      cartItem.id === item.id && cartItem.variant === item.variant
    )?.quantity || 0;
    
    updateQuantity(item.id, item.variant, currentQty + 1, {
      ...item,
      name: item.title,
      productId: item.id
    });
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    updateQuantity(id, variant, quantity);
  };

  const handleRemoveFromCart = (id: string, variant?: string) => {
    removeItem(id, variant);
  };

  const handleEmptyCart = () => {
    console.log('=== emptyCart ===');
    emptyCart();
    // Show confirmation message
    import('@/hooks/use-toast').then(({ useToast }) => {
      const { toast } = useToast();
      toast({
        title: "Cart emptied",
        description: "All items have been removed from your cart.",
      });
    });
  };

  const handleBackToStart = () => {
    navigate(startingPage || '/');
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

  // Show group order join flow if needed
  if (showJoinFlow) {
    const urlParams = new URLSearchParams(window.location.search);
    const shareToken = urlParams.get('share') || localStorage.getItem('groupOrderToken') || '';
    
    return (
      <GroupOrderJoinFlow
        shareToken={shareToken}
        onJoinConfirmed={handleJoinConfirmed}
        onJoinDeclined={handleJoinDeclined}
      />
    );
  }

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
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={handleBackToOrderContinuation}
          onBackToStart={() => navigate('/cover')}
        />
      )}

      {currentStep === 'checkout' && (
        <CheckoutFlow 
          cartItems={cartItems}
          deliveryInfo={deliveryInfo}
          totalPrice={getTotalPrice()}
          onBack={handleBackToProducts}
          onDeliveryInfoChange={setDeliveryInfo}
          onUpdateQuantity={handleUpdateQuantity}
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
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={deliveryInfo}
        isAddingToOrder={isAddingToOrder}
        useSameAddress={useSameAddress}
        hasChanges={hasChanges}
        appliedDiscount={appliedDiscount}
        tipAmount={tipAmount}
        onEmptyCart={handleEmptyCart}
      />
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={currentStep === 'products' || currentStep === 'cart' || currentStep === 'checkout' || currentStep === 'address-confirmation'}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};
