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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-between py-2 px-2">
        {/* Delivery App Tabs - Maximize Width Usage */}
        <div className="flex-1 flex justify-evenly gap-1">
          {/* Admin Button - Compact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/affiliate/admin-login')}
            className="flex flex-col items-center justify-center h-12 px-2 flex-1 min-w-0"
          >
            <Settings className="h-4 w-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Admin</span>
          </Button>

          {/* Home Button - Compact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center h-12 px-2 flex-1 min-w-0"
          >
            <Home className="h-4 w-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Home</span>
          </Button>

          {/* Search Button - Compact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center h-12 px-2 flex-1 min-w-0"
          >
            <Search className="h-4 w-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Search</span>
          </Button>

          {/* Cart Button - Show icon + count only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center h-12 px-2 flex-1 min-w-0 relative"
          >
            <div className="relative">
              <ShoppingCart className="h-4 w-4 mb-0.5" />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">
                  {cartItemCount}
                </Badge>
              )}
            </div>
            <span className="text-[10px] leading-tight">Cart</span>
          </Button>

          {/* Delivery App Selector - Compact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDeliverySelector}
            className="flex flex-col items-center justify-center h-12 px-2 flex-1 min-w-0"
          >
            <Settings className="h-4 w-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Apps</span>
          </Button>
        </div>
      </div>
    </div>
  );
};