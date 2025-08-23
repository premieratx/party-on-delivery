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
  // Mobile-optimized sizing with better proportions
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs rounded-full',
    md: 'h-7 w-7 text-sm rounded-full', 
    lg: 'h-8 w-8 text-base rounded-full'
  };

  const textSizeClasses = {
    sm: 'text-xs min-w-[24px] font-semibold',
    md: 'text-sm min-w-[28px] font-semibold',
    lg: 'text-base min-w-[32px] font-semibold'
  };

  const iconSizes = {
    sm: 8,
    md: 10,
    lg: 12
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

  // Show quantity controls - compact mobile layout
  return (
    <div className={cn('flex items-center justify-center gap-0.5 bg-muted rounded-full px-0.5 py-0.5', className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          sizeClasses[size],
          'p-0 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center shrink-0'
        )}
        onClick={handleDecrease}
        disabled={disabled}
      >
        <Minus size={iconSizes[size]} strokeWidth={2.5} />
      </Button>
      
      <span className={cn(
        'font-medium text-center flex items-center justify-center px-1',
        textSizeClasses[size]
      )}>
        {quantity}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          sizeClasses[size],
          'p-0 hover:bg-primary hover:text-primary-foreground flex items-center justify-center shrink-0'
        )}
        onClick={handleIncrease}
        disabled={disabled}
      >
        <Plus size={iconSizes[size]} strokeWidth={2.5} />
      </Button>
    </div>
  );
};