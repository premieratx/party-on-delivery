import React, { useState, useEffect } from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CustomDeliveryCoverModal } from '@/components/custom-delivery/CustomDeliveryCoverModal';
import { CustomDeliveryAppsGrid } from '@/components/custom-delivery/CustomDeliveryAppsGrid';

const Index = () => {
  // Enable wake lock to keep screen on during app usage
  useWakeLock();
  
  // Use optimized product loading
  const { refreshProducts } = useOptimizedProductLoader();
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  // Import search interface for bottom menu hiding
  const { shouldHideBottomMenu } = require('@/hooks/useSearchInterface').useSearchInterface({ hideOnScroll: true });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [homepageApp, setHomepageApp] = useState<any>(null);
  const [showCoverModal, setShowCoverModal] = useState(true);
  const [showAppsGrid, setShowAppsGrid] = useState(false);
  const navigate = useNavigate();

  // Load the homepage delivery app configuration
  useEffect(() => {
    const loadHomepageApp = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_homepage', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!error && data) {
          setHomepageApp(data);
        }
      } catch (error) {
        console.error('Error loading homepage app:', error);
      }
    };

    loadHomepageApp();
  }, []);

  const handleStartShopping = () => {
    setShowCoverModal(false);
    // Instead of redirecting, show the main delivery app
  };

  const handleViewApps = () => {
    setShowCoverModal(false);
    setShowAppsGrid(true);
  };
  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(String(product.price)) || 0,
      image: product.image,
      variant: product.variant
    };
    
    console.log('🛒 Index: Adding product to cart:', cartItem);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = cartItem.variant || 'default';
      return itemId === cartItem.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
    updateQuantity(cartItem.id, cartItem.variant, currentQty + 1, cartItem);
  };

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    updateQuantity(productId, variantId, quantity);
  };

  const handleRemoveFromCart = (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
  };

  const handleEmptyCart = () => {
    emptyCart();
  };

  const handleCheckout = () => {
    // Store delivery app referrer and app context for checkout
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'main-delivery-app',
      appName: 'Party On Delivery'
    }));
    
    // Navigate to checkout
    navigate('/checkout');
  };

  // Convert unified cart items to the format expected by ProductCategories
  const cartItemsForCategories = cartItems.map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    variant: item.variant
  }));

  // Mock delivery info for cart component
  const mockDeliveryInfo = {
    date: new Date(),
    timeSlot: '12:00 PM - 2:00 PM',
    address: 'Sample Address',
    instructions: ''
  };

  console.log('🏠 Index rendering, showCoverModal:', showCoverModal, 'homepageApp:', homepageApp);
  
  // TEMP: Force render something visible no matter what
  return (
    <div className="min-h-screen bg-red-500 p-4">
      <h1 className="text-white text-4xl">INDEX PAGE IS WORKING!</h1>
      <p className="text-white">showCoverModal: {String(showCoverModal)}</p>
      <p className="text-white">homepageApp: {JSON.stringify(homepageApp)}</p>
      
      {/* SIMPLE FALLBACK TEST */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h1 className="text-2xl font-bold mb-4">Party On Delivery</h1>
            <p className="mb-6">Welcome to our delivery service!</p>
            <button 
              onClick={handleStartShopping}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Start Shopping
            </button>
            <button 
              onClick={handleViewApps}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Browse Apps
            </button>
          </div>
        </div>
      )}

      {/* Show delivery apps grid if selected */}
      {showAppsGrid && (
        <CustomDeliveryAppsGrid
          onAppSelect={(appSlug) => navigate(`/app/${appSlug}`)}
          onBack={() => {
            setShowAppsGrid(false);
            setShowCoverModal(true);
          }}
        />
      )}

      {/* Show main delivery app when cover is dismissed */}
      {!showCoverModal && !showAppsGrid && (
        <ProductCategories
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItemsForCategories}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          customAppName={homepageApp?.app_name}
          customHeroHeading={homepageApp?.main_app_config?.hero_heading}
          customHeroSubheading={homepageApp?.main_app_config?.hero_subheading}
          customLogoUrl={homepageApp?.logo_url}
          customCollections={homepageApp?.collections_config}
        />
      )}

      {/* Cart sidebar */}
      <DeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={mockDeliveryInfo}
        onEmptyCart={handleEmptyCart}
      />

      {/* Bottom cart bar with admin button */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
        shouldHide={shouldHideBottomMenu}
        showAdmin={true}
      />
    </div>
  );
};

export default Index;