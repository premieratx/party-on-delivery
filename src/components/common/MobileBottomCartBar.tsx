import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileBottomCartBarProps {
  cartItemCount: number;
  totalAmount?: number;
  className?: string;
}

export const MobileBottomCartBar: React.FC<MobileBottomCartBarProps> = ({
  cartItemCount,
  totalAmount,
  className = ''
}) => {
  const navigate = useNavigate();

  if (cartItemCount === 0) return null;

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 
      bg-background border-t shadow-lg 
      p-3 md:p-4 
      lg:hidden
      ${className}
    `}>
      <Button 
        onClick={() => navigate('/checkout')}
        className="w-full h-12 text-lg font-semibold flex items-center justify-between px-6"
        size="lg"
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5" />
          <span>View Cart ({cartItemCount})</span>
        </div>
        {totalAmount && (
          <span className="font-bold">
            ${totalAmount.toFixed(2)}
          </span>
        )}
      </Button>
    </div>
  );
};