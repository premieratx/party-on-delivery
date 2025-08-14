import React, { useState, useEffect } from 'react';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-party-austin.jpg';

const Index = () => {
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryApp, setDeliveryApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveryApp();
  }, []);

  const loadDeliveryApp = async () => {
    try {
      // Load the actual party-on-delivery app from database
      const { data, error } = await supabase
        .from('delivery_apps')
        .select('*')
        .eq('slug', 'party-on-delivery---concierge-')
        .eq('active', true)
        .single();

      if (error || !data) {
        console.log('Using fallback app config');
        // Fallback to hardcoded config
        setDeliveryApp({
          id: 'party-on-delivery',
          app_name: 'Party On Delivery - Concierge Service',
          app_slug: 'party-on-delivery---concierge-',
          logo_url: null,
          active: true,
          collections: ['spirits', 'tailgate-beer', 'seltzer-collection', 'mixers-non-alcoholic', 'cocktail-kits'],
          main_app_config: {
            hero_heading: 'Premium Party Alcohol Delivery',
            description: 'High-quality spirits, wines, and beers delivered directly to your Austin party location'
          }
        });
      } else {
        setDeliveryApp(data);
      }
    } catch (error) {
      console.error('Error loading delivery app:', error);
      // Fallback config
      setDeliveryApp({
        id: 'party-on-delivery',
        app_name: 'Party On Delivery - Concierge Service',
        app_slug: 'party-on-delivery---concierge-',
        collections: ['spirits', 'tailgate-beer', 'seltzer-collection']
      });
    } finally {
      setIsLoading(false);
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
      appSlug: deliveryApp?.app_slug || 'party-on-delivery---concierge-',
      appName: deliveryApp?.app_name || 'Party On Delivery'
    }));
    navigate('/checkout');
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground">Loading Party On Delivery...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigation />
      
      {/* Hero Section with Background Image */}
      <div className="relative h-[70vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {deliveryApp?.app_name || 'Party On Delivery'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-6">
              {deliveryApp?.main_app_config?.description || 'Premium alcohol delivery for your Austin party'}
            </p>
            <div className="mt-8">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                <p className="text-lg font-medium">Free delivery on orders over $100</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Shop Our Collection</h2>
          <p className="text-lg text-muted-foreground">Browse by category to find exactly what you need</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => window.location.href = '/search?category=spirits'}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🥃</div>
            <h3 className="font-semibold text-lg">Spirits</h3>
            <p className="text-sm text-muted-foreground">Premium Liquor</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => window.location.href = '/search?category=beer'}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🍺</div>
            <h3 className="font-semibold text-lg">Beer</h3>
            <p className="text-sm text-muted-foreground">Craft & Tailgate</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => window.location.href = '/search?category=seltzer'}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🥤</div>
            <h3 className="font-semibold text-lg">Seltzers</h3>
            <p className="text-sm text-muted-foreground">Hard Seltzers</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => window.location.href = '/search?category=mixers'}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🧊</div>
            <h3 className="font-semibold text-lg">Mixers</h3>
            <p className="text-sm text-muted-foreground">Non-Alcoholic</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => window.location.href = '/search?category=cocktails'}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🍸</div>
            <h3 className="font-semibold text-lg">Cocktail Kits</h3>
            <p className="text-sm text-muted-foreground">Ready to Mix</p>
          </div>
        </div>

        {/* Browse All Products CTA */}
        <div className="text-center mt-12">
          <div 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors cursor-pointer"
            onClick={() => window.location.href = '/search'}
          >
            🎉 Browse All Products
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
        currentAppSlug={deliveryApp?.app_slug || 'party-on-delivery---concierge-'}
      />
    </div>
  );
};

export default Index;