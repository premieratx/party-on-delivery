import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalQuantityControlsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart?: () => void;
  productId: string;
  variant?: 'mobile' | 'desktop' | 'compact' | 'minimal';
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
}

export const UniversalQuantityControls: React.FC<UniversalQuantityControlsProps> = ({
  quantity,
  onQuantityChange,
  onAddToCart,
  productId,
  variant = 'mobile',
  className,
  disabled = false,
  showAddButton = true
}) => {
  const handleIncrease = () => {
    if (disabled) return;
    
    if (quantity === 0 && onAddToCart) {
      onAddToCart();
    } else {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (disabled || quantity === 0) return;
    onQuantityChange(Math.max(0, quantity - 1));
  };

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return {
          container: 'gap-0.5 bg-muted/50 rounded-full p-0.5',
          button: 'h-4 w-4 p-0 rounded-full',
          text: 'text-xs min-w-[16px] px-0.5',
          icon: 2
        };
      case 'compact':
        return {
          container: 'gap-0.5 bg-muted rounded-full p-0.5',
          button: 'h-5 w-5 p-0 rounded-full',
          text: 'text-xs min-w-[18px] px-1',
          icon: 2.5
        };
      case 'desktop':
        return {
          container: 'gap-1 bg-muted rounded-full px-1 py-1',
          button: 'h-8 w-8 p-0 rounded-full',
          text: 'text-sm min-w-[24px] px-2',
          icon: 3
        };
      case 'mobile':
      default:
        return {
          container: 'gap-0.5 bg-muted rounded-full p-0.5',
          button: 'h-6 w-6 p-0 rounded-full',
          text: 'text-xs min-w-[20px] px-1',
          icon: 2.5
        };
    }
  };

  const variantStyles = getVariantClasses();

  // If quantity is 0 and we should show add button
  if (quantity === 0 && showAddButton) {
    return (
      <Button
        onClick={handleIncrease}
        disabled={disabled}
        size={variant === 'minimal' ? 'sm' : 'default'}
        className={cn('w-full text-xs', className)}
      >
        <Plus size={variantStyles.icon} className="mr-1" />
        Add
      </Button>
    );
  }

  // Show quantity controls
  return (
    <div className={cn('flex items-center justify-center', variantStyles.container, className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          variantStyles.button,
          'hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center shrink-0'
        )}
        onClick={handleDecrease}
        disabled={disabled}
      >
        <Minus size={variantStyles.icon} strokeWidth={2.5} />
      </Button>
      
      <span className={cn(
        'font-semibold text-center flex items-center justify-center',
        variantStyles.text
      )}>
        {quantity}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          variantStyles.button,
          'hover:bg-primary hover:text-primary-foreground flex items-center justify-center shrink-0'
        )}
        onClick={handleIncrease}
        disabled={disabled}
      >
        <Plus size={variantStyles.icon} strokeWidth={2.5} />
      </Button>
    </div>
  );
};