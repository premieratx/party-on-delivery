import React from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  
  const { addToCart, cartItems, updateQuantity, getTotalPrice } = useUnifiedCart();

  const handleAddToCart = (item: any) => {
    addToCart(item);
  };

  const handleOpenCart = () => {
    // Will be handled by BottomCartBar
  };

  const handleProceedToCheckout = () => {
    window.location.href = '/checkout';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <ProductCategories
      appName="Austin's Premier Party Supply Delivery"
      heroHeading="Austin's Premier Party Supply Delivery"
      heroSubheading="Satisfaction Guaranteed, On-Time Delivery"
      heroScrollingText="Let's Get It"
      onAddToCart={handleAddToCart}
      cartItemCount={cartItems.length}
      onOpenCart={handleOpenCart}
      cartItems={cartItems}
      onUpdateQuantity={updateQuantity}
      onProceedToCheckout={handleProceedToCheckout}
      onGoHome={handleGoHome}
      showSearch={true}
      maxProducts={50}
    />
  );
};

export default Index;