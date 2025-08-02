import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomProductCategories } from './CustomProductCategories';
import { CustomDeliveryCart } from './CustomDeliveryCart';
import { CustomOrderContinuation } from './CustomOrderContinuation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';
import { useUnifiedCart, UnifiedCartItem } from '@/hooks/useUnifiedCart';
import { getActiveDeliveryInfo, formatDeliveryDate, isDeliveryExpired } from '@/utils/deliveryInfoManager';
import { BottomCartBar } from '@/components/common/BottomCartBar';

export type CustomDeliveryStep = 'order-continuation' | 'products' | 'cart';

export interface CustomCartItem {
  id: string;
  title: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

export interface CustomDeliveryInfo {
  date: Date | null;
  timeSlot: string;
  address: string;
  instructions?: string;
}

export const CustomDeliveryAppWidget: React.FC = () => {
  // Enable wake lock to keep screen on during app usage
  useWakeLock();
  
  const navigate = useNavigate();
  const [affiliateReferral, setAffiliateReferral] = useReliableStorage('customDeliveryApp_affiliateReferral', '');
  const [startingPage, setStartingPage] = useReliableStorage('customDeliveryApp_startingPage', '/custom-delivery');
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  // ALWAYS start on order-continuation
  const [currentStep, setCurrentStep] = useState<CustomDeliveryStep>('order-continuation');
  const [deliveryInfo, setDeliveryInfo] = useLocalStorage<CustomDeliveryInfo>('customDeliveryApp_delivery_info', {
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('customDeliveryApp_last_order', null);

  // Calculate subtotal for consistent delivery fee calculation
  const subtotal = getTotalPrice();

  // Use single source of truth for delivery info with proper expiry checking
  const validLastOrderInfo = lastOrderInfo && lastOrderInfo.deliveryDate && lastOrderInfo.deliveryTime && 
    !isDeliveryExpired(lastOrderInfo.deliveryDate, lastOrderInfo.deliveryTime) ? lastOrderInfo : null;

  const handleStartNewOrder = () => {
    console.log('=== Custom Delivery App: handleStartNewOrder ===');
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeOrder = () => {
    console.log('=== Custom Delivery App: handleResumeOrder ===');
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToRecentOrder = () => {
    console.log('=== Custom Delivery App: handleAddToRecentOrder ===');
    
    // If no valid last order (new customer), behave like new order
    if (!validLastOrderInfo) {
      handleStartNewOrder();
      return;
    }
    
    // Go directly to products
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToProducts = () => {
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOrderContinuation = () => {
    setCurrentStep('order-continuation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: Omit<UnifiedCartItem, 'quantity'>) => {
    addToCart(item);
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    updateQuantity(id, variant, quantity);
  };

  const handleRemoveFromCart = (id: string, variant?: string) => {
    removeItem(id, variant);
  };

  const handleEmptyCart = () => {
    console.log('=== Custom Delivery App: emptyCart ===');
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
    navigate(startingPage || '/custom-delivery');
  };

  const handleCheckout = () => {
    try {
      console.log('=== CUSTOM DELIVERY APP: CHECKOUT BUTTON CLICKED ===');
      console.log('cartItems length:', cartItems.length);
      console.log('currentStep:', currentStep);
      
      // For now, just show a message since we're not linking to checkout yet
      import('@/hooks/use-toast').then(({ useToast }) => {
        const { toast } = useToast();
        toast({
          title: "Custom Delivery App",
          description: "Checkout functionality coming soon! This is a demo version.",
        });
      });
      
    } catch (error) {
      console.error('Error in custom delivery app checkout:', error);
    }
  };

  if (currentStep === 'order-continuation') {
    return (
      <CustomOrderContinuation
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
        <CustomProductCategories 
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={handleBackToOrderContinuation}
          onBackToStart={handleBackToStart}
        />
      )}

      {/* Slide-out Cart */}
      <CustomDeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={deliveryInfo}
        onEmptyCart={handleEmptyCart}
      />
      
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={currentStep === 'products' || currentStep === 'cart'}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};
