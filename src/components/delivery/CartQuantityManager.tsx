import React from 'react';
import { QuantityControls } from './QuantityControls';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface CartQuantityManagerProps {
  productId: string;
  product: {
    id: string;
    title: string;
    name?: string;
    price: number;
    image: string;
    variant?: string;
  };
  variant?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CartQuantityManager: React.FC<CartQuantityManagerProps> = ({
  productId,
  product,
  variant,
  size = 'md',
  className
}) => {
  const { getCartItemQuantity, updateQuantity } = useUnifiedCart();
  
  const quantity = getCartItemQuantity(productId, variant);
  
  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(productId, variant, newQuantity, {
      id: productId,
      title: product.title,
      name: product.name || product.title,
      price: product.price,
      image: product.image,
      variant: variant
    });
  };
  
  const handleAddToCart = () => {
    handleQuantityChange(1);
  };
  
  return (
    <QuantityControls
      quantity={quantity}
      onQuantityChange={handleQuantityChange}
      onAddToCart={handleAddToCart}
      productId={productId}
      variant={variant}
      size={size}
      className={className}
    />
  );
};