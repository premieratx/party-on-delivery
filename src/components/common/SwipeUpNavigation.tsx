import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Home, Search, ShoppingCart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useSwipeUpNavigation } from '@/hooks/useSwipeUpNavigation';

interface SwipeUpNavigationProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
}

export const SwipeUpNavigation: React.FC<SwipeUpNavigationProps> = ({
  cartItemCount = 0,
  onOpenCart
}) => {
  const navigate = useNavigate();
  const { isVisible, hideNavigation } = useSwipeUpNavigation();

  if (!isVisible) {
    return (
      <div className="md:hidden fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-2"></div>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      {/* Handle bar */}
      <div className="flex justify-center py-2">
        <div className="w-12 h-1 bg-muted-foreground/50 rounded-full"></div>
      </div>
      
      {/* Navigation content */}
      <div className="px-4 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Navigation</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={hideNavigation}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Navigation buttons */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate('/');
              hideNavigation();
            }}
            className="flex flex-col items-center justify-center h-16 gap-1"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate('/search');
              hideNavigation();
            }}
            className="flex flex-col items-center justify-center h-16 gap-1"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">Search</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenCart?.();
              hideNavigation();
            }}
            className="flex flex-col items-center justify-center h-16 gap-1 relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[8px] font-bold">
                {cartItemCount}
              </Badge>
            )}
            <span className="text-xs">Cart</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate('/customer/auth?redirect=dashboard');
              hideNavigation();
            }}
            className="flex flex-col items-center justify-center h-16 gap-1"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Account</span>
          </Button>
        </div>
      </div>
    </div>
  );
};