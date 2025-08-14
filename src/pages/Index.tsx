import React, { useState, useEffect } from 'react';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  // Hardcoded Premier Party Cruises delivery app config
  const homepageApp = {
    id: 'premier-party-cruises',
    app_name: 'Premier Party Cruises - Official Alcohol Delivery Service',
    app_slug: 'premier-party-cruises---official-alcohol-delivery-service',
    logo_url: null,
    is_active: true,
    collections_config: {
      tab_count: 5,
      tabs: [
        { name: 'All Products', collection_handle: 'all', icon: '🎉' },
        { name: 'Beer', collection_handle: 'beer', icon: '🍺' },
        { name: 'Wine', collection_handle: 'wine', icon: '🍷' },
        { name: 'Spirits', collection_handle: 'spirits', icon: '🥃' },
        { name: 'Mixers', collection_handle: 'mixers-sodas', icon: '🥤' }
      ]
    },
    start_screen_config: {
      title: 'Premier Party Cruises',
      subtitle: 'Official Alcohol Delivery Service'
    },
    main_app_config: {
      hero_heading: 'Premium Alcohol Delivery for Your Party',
      description: 'High-quality spirits, wines, and beers delivered directly to your Austin party location'
    },
    post_checkout_config: {
      heading: 'Order Confirmed!',
      subheading: 'Your party alcohol will be delivered as scheduled',
      redirect_url: '/order-complete'
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

  // No loading screen - render directly

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
      
      {/* Simple direct delivery app without preloading */}
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[60vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Premier Party Cruises
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                Official Alcohol Delivery Service
              </p>
              <div className="mt-8">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                  <p className="text-lg font-medium">Premium Alcohol Delivery for Your Austin Party</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Shop Our Collection</h2>
            <p className="text-lg text-muted-foreground">High-quality spirits, wines, and beers delivered directly to your party</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
              onClick={() => window.location.href = '/search?category=beer'}
            >
              <div className="text-4xl mb-3">🍺</div>
              <h3 className="font-semibold">Beer</h3>
              <p className="text-sm text-muted-foreground">Craft & Premium</p>
            </div>
            
            <div 
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
              onClick={() => window.location.href = '/search?category=wine'}
            >
              <div className="text-4xl mb-3">🍷</div>
              <h3 className="font-semibold">Wine</h3>
              <p className="text-sm text-muted-foreground">Red & White</p>
            </div>
            
            <div 
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
              onClick={() => window.location.href = '/search?category=spirits'}
            >
              <div className="text-4xl mb-3">🥃</div>
              <h3 className="font-semibold">Spirits</h3>
              <p className="text-sm text-muted-foreground">Premium Liquor</p>
            </div>
            
            <div 
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
              onClick={() => window.location.href = '/search?category=mixers'}
            >
              <div className="text-4xl mb-3">🥤</div>
              <h3 className="font-semibold">Mixers</h3>
              <p className="text-sm text-muted-foreground">Sodas & Juices</p>
            </div>
            
            <div 
              className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer text-center"
              onClick={() => window.location.href = '/search'}
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-semibold">All Products</h3>
              <p className="text-sm text-muted-foreground">Browse Everything</p>
            </div>
          </div>
        </div>
      </div>

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
