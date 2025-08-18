import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';

interface ForceAddToCartButtonProps {
  product: {
    id: string;
    title: string;
    price: number | string;
    image: string;
    variants?: any[];
    category?: string;
  };
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
  showQuantity?: boolean;
}

export const ForceAddToCartButton: React.FC<ForceAddToCartButtonProps> = ({
  product,
  variant = 'default',
  className = '',
  showQuantity = true
}) => {
  const { addToCart, updateQuantity, getCartItemQuantity } = useUnifiedCart();
  const { forceShowCart } = useGlobalCart();

  console.log('🛒 ForceAddToCartButton: Rendering for product', product.id, product.title);

  const variantId = product.variants?.[0]?.id || 'default';
  const currentQuantity = getCartItemQuantity(product.id, variantId);
  const price = typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price;

  const handleAddToCart = () => {
    console.log('🛒 ForceAddToCartButton: Adding to cart', product.id);
    
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: price,
      image: product.image || '',
      variant: variantId,
      category: product.category
    };

    updateQuantity(product.id, variantId, currentQuantity + 1, cartItem);
    
    // Force show cart briefly  
    setTimeout(() => {
      forceShowCart();
    }, 100);
  };

  const handleIncrement = () => {
    console.log('🛒 ForceAddToCartButton: Incrementing quantity');
    updateQuantity(product.id, variantId, currentQuantity + 1, {
      title: product.title,
      name: product.title,
      price: price,
      image: product.image || '',
      category: product.category
    });
  };

  const handleDecrement = () => {
    console.log('🛒 ForceAddToCartButton: Decrementing quantity');
    updateQuantity(product.id, variantId, Math.max(0, currentQuantity - 1));
  };

  if (variant === 'icon-only') {
    return (
      <Button
        onClick={handleAddToCart}
        size="icon"
        className={`bg-primary hover:bg-primary/90 text-white ${className}`}
      >
        <ShoppingCart className="w-4 h-4" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {currentQuantity > 0 && showQuantity ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="min-w-[2rem] text-center font-semibold">
              {currentQuantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrement}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`w-full ${className}`}>
      {currentQuantity > 0 && showQuantity ? (
        <div className="flex items-center justify-between bg-muted rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDecrement}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[2rem] text-center">
            {currentQuantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleIncrement}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleAddToCart}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart - ${price.toFixed(2)}
        </Button>
      )}
    </div>
  );
};