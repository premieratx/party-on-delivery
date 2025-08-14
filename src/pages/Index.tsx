import React, { useState } from 'react';
import ProductCategories from '@/components/delivery/ProductCategories';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useNavigate } from 'react-router-dom';
import { GlobalNavigation } from '@/components/common/GlobalNavigation';
import heroPartyAustin from '@/assets/hero-party-austin.jpg';

const Index = () => {
  // Use unified cart system
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

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation */}
      <GlobalNavigation />
      
      {/* Hero Image */}
      <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <img 
          src={heroPartyAustin} 
          alt="Party On Delivery - Austin's Premier Party Supply Service" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-2">Party On Delivery</h1>
            <p className="text-sm md:text-lg lg:text-xl">Austin's Premier Party Supply Service</p>
          </div>
        </div>
      </div>
      
      {/* Main delivery app content */}
      <ProductCategories />

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
        shouldHide={false}
        showAdmin={true}
        currentAppSlug={undefined} // Main app doesn't have a specific slug
      />
    </div>
  );
};

export default Index;
