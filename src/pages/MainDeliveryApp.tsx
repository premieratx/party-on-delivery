import React, { useState } from 'react';
import { OptimizedProductCategories } from '@/components/delivery/OptimizedProductCategories';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

export default function MainDeliveryApp() {
  // Enable wake lock to keep screen on during app usage
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
    // Navigate to checkout page
    window.location.href = '/checkout';
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
      {/* Optimized Product Categories */}
      <OptimizedProductCategories
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForCategories}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={handleCheckout}
        onBack={() => {}} // No back action for template
      />

      {/* Unified Cart sidebar with cart trigger */}
      <div data-cart-trigger onClick={() => setIsCartOpen(true)} className="hidden" />
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