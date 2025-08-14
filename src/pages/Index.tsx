import React, { useState, useEffect } from 'react';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedWhiteLabelApp } from '@/components/delivery/OptimizedWhiteLabelApp';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const Index = () => {
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homepageApp, setHomepageApp] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHomepageApp();
  }, []);

  const loadHomepageApp = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_homepage', true)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading homepage app:', error);
        return;
      }

      if (data) {
        setHomepageApp(data);
      }
    } catch (error) {
      console.error('Failed to load homepage app:', error);
    } finally {
      setLoading(false);
    }
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
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: homepageApp?.app_slug || 'main-delivery-app',
      appName: homepageApp?.app_name || 'Party On Delivery'
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!homepageApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No homepage app configured</h1>
          <p className="text-muted-foreground">Please configure a homepage delivery app in admin settings.</p>
        </div>
      </div>
    );
  }

  // Convert unified cart items to the format expected by the delivery app
  const cartItemsForDelivery = cartItems.map(item => ({
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

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigation />
      
      {/* Load the optimized delivery app */}
      <OptimizedWhiteLabelApp
        appConfig={{
          id: homepageApp.id,
          app_name: homepageApp.app_name,
          app_slug: homepageApp.app_slug,
          logo_url: homepageApp.logo_url,
          collections_config: homepageApp.collections_config,
          start_screen_config: homepageApp.start_screen_config,
          main_app_config: homepageApp.main_app_config,
          post_checkout_config: homepageApp.post_checkout_config,
          branding: {},
          is_active: homepageApp.is_active
        }}
        onCheckout={handleCheckout}
      />

      {/* Cart sidebar */}
      <DeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItemsForDelivery}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={mockDeliveryInfo}
        onEmptyCart={handleEmptyCart}
      />

      {/* Bottom cart bar */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
        shouldHide={false}
        showAdmin={true}
        currentAppSlug={homepageApp.app_slug}
      />
    </div>
  );
};

export default Index;
