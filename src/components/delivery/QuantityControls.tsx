import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityControlsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart?: () => void;
  productId: string;
  variant?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const QuantityControls: React.FC<QuantityControlsProps> = ({
  quantity,
  onQuantityChange,
  onAddToCart,
  productId,
  variant,
  size = 'md',
  className,
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const textSizeClasses = {
    sm: 'text-sm px-2 min-w-[2rem]',
    md: 'text-base px-3 min-w-[3rem]',
    lg: 'text-lg px-4 min-w-[4rem]'
  };

  const handleIncrease = () => {
    console.log('🔢 QuantityControls: Increase clicked', { productId, variant, quantity, disabled });
    if (disabled) return;
    
    if (quantity === 0 && onAddToCart) {
      console.log('🔢 QuantityControls: Calling onAddToCart');
      onAddToCart();
    } else {
      console.log('🔢 QuantityControls: Calling onQuantityChange with', quantity + 1);
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    console.log('🔢 QuantityControls: Decrease clicked', { productId, variant, quantity, disabled });
    if (disabled || quantity === 0) return;
    console.log('🔢 QuantityControls: Calling onQuantityChange with', Math.max(0, quantity - 1));
    onQuantityChange(Math.max(0, quantity - 1));
  };

  // If quantity is 0, show "Add to Cart" button
  if (quantity === 0) {
    return (
      <Button
        onClick={handleIncrease}
        disabled={disabled}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        className={cn('w-full', className)}
      >
        Add to Cart
      </Button>
    );
  }

  // Show quantity controls
  return (
    <div className={cn('flex items-center justify-center gap-2 bg-muted rounded-lg p-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          sizeClasses[size],
          'p-0 hover:bg-destructive hover:text-destructive-foreground'
        )}
        onClick={handleDecrease}
        disabled={disabled}
      >
        <Minus size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      </Button>
      
      <span className={cn(
        'font-medium text-center',
        textSizeClasses[size]
      )}>
        {quantity}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          sizeClasses[size],
          'p-0 hover:bg-primary hover:text-primary-foreground'
        )}
        onClick={handleIncrease}
        disabled={disabled}
      >
        <Plus size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      </Button>
    </div>
  );
};