import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { DeliveryScheduler } from './delivery/DeliveryScheduler';
import ProductCategories from './delivery/ProductCategories';
// DeliveryCart removed - using UnifiedCart from GlobalCartProvider instead
import { OrderContinuation } from './OrderContinuation';
import { AddressConfirmation } from './AddressConfirmation';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';
import { useUnifiedCart, UnifiedCartItem } from '@/hooks/useUnifiedCart';
// Group order imports removed for cleanup
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
  
  // Group order handler removed for cleanup
  
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
  // Cart state removed - using GlobalCartProvider instead
  const [lastOrderInfo, setLastOrderInfo] = useLocalStorage<any>('partyondelivery_last_order', null);
  const [isAddingToOrder, setIsAddingToOrder] = useState<boolean>(!!addToOrderFlag);
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
      
      setIsAddingToOrder(true);
      localStorage.setItem('partyondelivery_bundle_ready', 'true');
      handleAddToRecentOrder();
    }
  }, [validLastOrderInfo?.deliveryDate, validLastOrderInfo?.deliveryTime]);

  const handleStartNewOrder = () => {
    
    
    // Keep existing cart and delivery info - just start a standard new order flow
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Clear all persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeOrder = () => {
    
    
    // Resume order works exactly like start new order now - keep everything
    setIsAddingToOrder(false);
    setUseSameAddress(false);
    
    // Clear persistent flags to start fresh flow
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('partyondelivery_bundle_ready');
    
    setCurrentStep('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToRecentOrder = () => {
    
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
    
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(cartItem => {
      const itemId = cartItem.productId || cartItem.id;
      const itemVariant = cartItem.variant || 'default';
      const checkVariant = item.variant || 'default';
      return itemId === item.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
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
      // Ensure we have items in cart before proceeding
      if (cartItems.length === 0) {
        console.warn('Cannot proceed to checkout with empty cart');
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
      
      // Cart is managed by GlobalCartProvider - no need to close manually
      
      // Enhanced referrer tracking for proper "Back to Cart" functionality
      const currentUrl = window.location.pathname + window.location.search;
      try {
        localStorage.setItem('last-delivery-app-url', currentUrl);
        localStorage.setItem('deliveryAppReferrer', currentUrl);
      } catch (error) {
        console.warn('Failed to store delivery app referrer:', error);
      }
      
      // Navigate to main checkout page (consistent with other delivery apps)
      navigate('/checkout');
      
    } catch (error) {
      console.error('Error in handleCheckout:', error);
      import('@/hooks/use-toast').then(({ useToast }) => {
        const { toast } = useToast();
        toast({
          title: "Checkout Error",
          description: "There was an error starting checkout. Please try again.",
          variant: "destructive",
        });
      });
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
          onCheckout={handleCheckout}
        />
      )}

      {/* Checkout step removed - now navigates to main checkout page */}

      {/* Cart is now handled by GlobalCartProvider - UnifiedCart renders globally */}
      {/* Bottom navigation removed - all functions available in top menu */}
    </div>
  );
};

export default DeliveryWidget;
