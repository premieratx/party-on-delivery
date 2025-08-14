import React, { useState } from 'react';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import { DeliveryAppSelector } from '@/components/delivery/DeliveryAppSelector';
import heroImage from '@/assets/hero-party-austin.jpg';

const DefaultDeliveryApp = () => {
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice } = useUnifiedCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

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
      appSlug: 'party-on-delivery',
      appName: 'Party On Delivery'
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

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigation />
      
      {/* Delivery App Selector */}
      <div className="container mx-auto px-4 py-4">
        <DeliveryAppSelector currentAppSlug="party-on-delivery" />
      </div>
      
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
              Party On Delivery
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-6">
              Premium alcohol delivery for your Austin party
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
            onClick={() => navigate('/search?category=spirits')}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🥃</div>
            <h3 className="font-semibold text-lg">Spirits</h3>
            <p className="text-sm text-muted-foreground">Premium Liquor</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => navigate('/search?category=beer')}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🍺</div>
            <h3 className="font-semibold text-lg">Beer</h3>
            <p className="text-sm text-muted-foreground">Craft & Tailgate</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => navigate('/search?category=seltzer')}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🥤</div>
            <h3 className="font-semibold text-lg">Seltzers</h3>
            <p className="text-sm text-muted-foreground">Hard Seltzers</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => navigate('/search?category=mixers')}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🧊</div>
            <h3 className="font-semibold text-lg">Mixers</h3>
            <p className="text-sm text-muted-foreground">Non-Alcoholic</p>
          </div>
          
          <div 
            className="group p-6 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 cursor-pointer text-center hover:scale-105"
            onClick={() => navigate('/search?category=cocktails')}
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
            onClick={() => navigate('/search')}
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
        currentAppSlug="party-on-delivery"
      />
    </div>
  );
};

export default DefaultDeliveryApp;