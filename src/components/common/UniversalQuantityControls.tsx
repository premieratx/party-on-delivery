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

  // Variant-specific styling - ULTRA COMPACT FOR MOBILE
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return {
          container: 'gap-0 bg-muted/50 rounded-full p-0',
          button: 'h-2.5 w-2.5 p-0 rounded-full min-w-0',
          text: 'text-[8px] min-w-[10px] px-0',
          icon: 1.2
        };
      case 'compact':
        return {
          container: 'gap-0 bg-muted rounded-full p-0',
          button: 'h-3 w-3 p-0 rounded-full min-w-0',
          text: 'text-[8px] min-w-[12px] px-0',
          icon: 1.5
        };
      case 'desktop':
        return {
          container: 'gap-0.5 bg-muted rounded-full p-0.5',
          button: 'h-6 w-6 p-0 rounded-full min-w-0',
          text: 'text-xs min-w-[18px] px-1',
          icon: 2.5
        };
      case 'mobile':
      default:
        return {
          container: 'gap-0 bg-muted rounded-full p-0',
          button: 'h-3 w-3 p-0 rounded-full min-w-0',
          text: 'text-[8px] min-w-[12px] px-0',
          icon: 1.5
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
      <button
        type="button"
        className={cn(
          variantStyles.button,
          'hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center shrink-0 border-0 bg-transparent'
        )}
        onClick={handleDecrease}
        disabled={disabled}
      >
        <Minus size={variantStyles.icon} strokeWidth={3} />
      </button>
      
      <span className={cn(
        'font-semibold text-center flex items-center justify-center',
        variantStyles.text
      )}>
        {quantity}
      </span>
      
      <button
        type="button"
        className={cn(
          variantStyles.button,
          'hover:bg-primary hover:text-primary-foreground flex items-center justify-center shrink-0 border-0 bg-transparent'
        )}
        onClick={handleIncrease}
        disabled={disabled}
      >
        <Plus size={variantStyles.icon} strokeWidth={3} />
      </button>
    </div>
  );
};