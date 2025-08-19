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
      <div className="flex items-center justify-around py-2 px-4">
        {/* Admin Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/affiliate/admin-login')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Admin</span>
        </Button>

        {/* Home Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Button>

        {/* Search Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/search')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Search</span>
        </Button>

        {/* Cart Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCart}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 relative"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            )}
          </div>
          <span className="text-xs">Cart</span>
        </Button>

        {/* Delivery App Selector */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenDeliverySelector}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Apps</span>
        </Button>
      </div>
    </div>
  );
};