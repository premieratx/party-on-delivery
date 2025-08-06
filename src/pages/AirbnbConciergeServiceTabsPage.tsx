import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

export default function AirbnbConciergeServiceTabsPage() {
  const navigate = useNavigate();
  
  // Enable wake lock to keep screen on
  useWakeLock();
  
  // Use unified cart system
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(product.price),
      image: product.image,
      variant: product.variants?.[0]?.title !== 'Default Title' ? product.variants?.[0]?.title : undefined
    };
    
    addToCart(cartItem);
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
    // Store app context and navigate to checkout
    localStorage.setItem('currentAppContext', JSON.stringify({
      appName: 'airbnb-concierge-service'
    }));
    navigate('/checkout');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleBackToStart = () => {
    navigate('/airbnb-concierge-service');
  };

  // Convert unified cart items to the format expected by CustomDeliveryTabsPage
  const cartItemsForTabs = cartItems.map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    variant: item.variant
  }));

  const collectionsConfig = {
    tab_count: 3,
    tabs: [
      { name: 'Cocktails', collection_handle: 'cocktail-kits', icon: 'cocktails' },
      { name: 'Liquor', collection_handle: 'spirits', icon: 'spirits' },
      { name: 'Beer', collection_handle: 'tailgate-beer', icon: 'beer' }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Use the standard CustomDeliveryTabsPage component for consistency */}
      <CustomDeliveryTabsPage
        appName="Lynn's Lodgings Concierge Service"
        heroHeading="All the Things, All the Fun"
        collectionsConfig={collectionsConfig}
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForTabs}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={handleCheckout}
        onBack={handleBackToStart}
        onGoHome={handleGoHome}
      />

      {/* Unified Cart sidebar */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Bottom cart bar */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={getTotalItems() > 0}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}