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
import { FastProductLoader } from '@/components/delivery/FastProductLoader';

export type CustomDeliveryStep = 'order-continuation' | 'products' | 'cart' | 'tabs';

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
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  // Start on tabs page to match new template format
  const [currentStep, setCurrentStep] = useState<CustomDeliveryStep>('tabs');
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
    console.log('🛒 CustomDeliveryAppWidget: Adding product to cart:', item);
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
      
      if (cartItems.length === 0) {
        return;
      }
      
      // Convert cart items to the format expected by the main checkout flow
      const standardCartItems = cartItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: Math.max(1, item.quantity), // Ensure quantity is at least 1
        image: item.image,
        productId: item.id,
        variant: item.variant || 'gid://shopify/ProductVariant/default',
        category: 'delivery-app',
        eventName: 'Custom Delivery',
        name: item.title
      }));
      
      console.log('Standardized cart items:', standardCartItems);
      
      // Store custom app context for proper checkout flow
      // localStorage.setItem('custom-app-source', 'custom-delivery'); // Removed to prevent cart interference
      
      // Navigate to checkout page
      navigate('/checkout');
      
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
      <FastProductLoader 
        onProductsLoaded={setProducts}
        onCollectionsLoaded={setCollections}
      />
      
      {currentStep === 'tabs' && (
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
        isVisible={currentStep === 'products' || currentStep === 'cart' || currentStep === 'tabs'}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};
