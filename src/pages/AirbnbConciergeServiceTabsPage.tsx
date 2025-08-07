import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';

export default function AirbnbConciergeServiceTabsPage() {
  const navigate = useNavigate();
  
  // Enable wake lock to keep screen on
  useWakeLock();
  
  // Use optimized product loading
  const { refreshProducts } = useOptimizedProductLoader();
  
  // Use unified cart system - same as main delivery app
  const { cartItems, addToCart, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(String(product.price)) || 0,
      image: product.image,
      variant: product.variant
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
    // Store delivery app referrer and app context for checkout
    localStorage.setItem('deliveryAppReferrer', '/app/airbnb-concierge-service/tabs');
    // Store app context for checkout
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'airbnb-concierge-service',
      appName: "Lynn's Lodgings Concierge Service"
    }));
    
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleBackToStart = () => {
    navigate('/airbnb-concierge-service');
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
      {/* Use same ProductCategories component as main delivery app for consistency */}
      <ProductCategories
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={handleCheckout}
      />

      {/* Cart sidebar - same as main delivery app */}
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

      {/* Bottom cart bar - same as main delivery app */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
