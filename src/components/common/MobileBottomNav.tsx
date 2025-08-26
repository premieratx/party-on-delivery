import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search, Settings, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
  onOpenDeliverySelector?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartItemCount = 0,
  onOpenCart,
  onOpenDeliverySelector
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border hidden">
      {/* Mobile bottom navigation permanently hidden */}
      <div className="flex items-center justify-between py-2 px-1">
        {/* Mobile Navigation - NO ICONS, TEXT ONLY */}
        <div className="flex-1 flex justify-evenly gap-0.5">
          {/* Admin Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/affiliate/admin-login')}
            className="flex flex-col items-center justify-center h-10 px-1 flex-1 min-w-0"
          >
            <span className="text-[10px] leading-tight font-medium">Admin</span>
          </Button>

          {/* Home Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center h-10 px-1 flex-1 min-w-0"
          >
            <span className="text-[10px] leading-tight font-medium">Home</span>
          </Button>

          {/* Search Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center h-10 px-1 flex-1 min-w-0"
          >
            <span className="text-[10px] leading-tight font-medium">Search</span>
          </Button>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center h-10 px-1 flex-1 min-w-0 relative"
          >
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[8px] font-bold">
                {cartItemCount}
              </Badge>
            )}
            <span className="text-[10px] leading-tight font-medium">Cart</span>
          </Button>

          {/* Delivery Apps */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDeliverySelector}
            className="flex flex-col items-center justify-center h-10 px-1 flex-1 min-w-0"
          >
            <span className="text-[10px] leading-tight font-medium">Apps</span>
          </Button>
        </div>
      </div>
    </div>
  );
};