import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home, ShoppingCart, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface NavigationState {
  path: string;
  timestamp: number;
}

export const GlobalNavigation = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems, getTotalPrice, cartItems } = useUnifiedCart();
  
  // Hide cart button on search page
  const isSearchPage = location.pathname === '/search';

  // Get navigation history from sessionStorage
  const getNavigationHistory = (): NavigationState[] => {
    try {
      const history = sessionStorage.getItem('navigation-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  // Update navigation history
  const updateNavigationHistory = (path: string) => {
    const history = getNavigationHistory();
    const newEntry: NavigationState = {
      path,
      timestamp: Date.now()
    };
    
    // Remove duplicate paths and add new entry
    const filteredHistory = history.filter(entry => entry.path !== path);
    const updatedHistory = [...filteredHistory, newEntry];
    
    // Keep only last 20 entries
    const trimmedHistory = updatedHistory.slice(-20);
    
    sessionStorage.setItem('navigation-history', JSON.stringify(trimmedHistory));
  };

  // Update history when location changes
  React.useEffect(() => {
    updateNavigationHistory(location.pathname);
  }, [location.pathname]);

  const history = getNavigationHistory();
  const currentIndex = history.findIndex(entry => entry.path === location.pathname);
  
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1 && currentIndex !== -1;

  const handleBack = () => {
    if (canGoBack) {
      const previousPath = history[currentIndex - 1].path;
      navigate(previousPath);
    } else {
      // If no history, go to main delivery app
      navigate('/');
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      const nextPath = history[currentIndex + 1].path;
      navigate(nextPath);
    }
  };

  const handleHome = () => {
    // Always go to the main starting screen (order continuation)
    navigate('/order/continuation');
  };

  const handleCart = () => {
    // Always trigger cart modal from delivery app
    const cartButton = document.querySelector('[data-cart-trigger]') as HTMLButtonElement;
    if (cartButton) {
      cartButton.click();
    } else {
      // If not on delivery app, navigate there first then show cart
      navigate('/');
      setTimeout(() => {
        const cartButtonRetry = document.querySelector('[data-cart-trigger]') as HTMLButtonElement;
        if (cartButtonRetry) {
          cartButtonRetry.click();
        }
      }, 100);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      // Navigate to home if cart is empty
      navigate('/');
      return;
    }
    
    // If we're on the main delivery app, trigger checkout
    if (location.pathname === '/' || location.pathname === '') {
      // Try to find and click the checkout button in the current page
      const checkoutButton = document.querySelector('[data-checkout-trigger]') as HTMLButtonElement;
      if (checkoutButton) {
        checkoutButton.click();
        return;
      }
    }
    
    // Navigate to checkout page with cart data
    navigate('/?step=checkout');
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background/95 backdrop-blur border-t shadow-lg",
      "flex items-center justify-between px-1 sm:px-4 py-2",
      "h-14", // Fixed height for consistency
      className
    )}>
      {/* Left: Back/Forward Navigation */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="h-8 sm:h-9 px-1 sm:px-3 text-xs sm:text-sm min-w-[60px] sm:min-w-auto"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="h-8 sm:h-9 px-1 sm:px-3 text-xs sm:text-sm min-w-[60px] sm:min-w-auto"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
        </Button>
      </div>

      {/* Center: Page indicator (hidden on small screens to save space) */}
      <div className="text-xs text-muted-foreground hidden md:block">
        {currentIndex + 1} / {history.length}
      </div>

      {/* Right: Home and Checkout */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          className="h-8 sm:h-9 px-1 sm:px-3 text-xs sm:text-sm min-w-[60px] sm:min-w-auto"
        >
          <Home className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Home</span>
        </Button>

        {/* Checkout Button - Always visible when there are items in cart */}
        {cartItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckout}
            className="h-8 sm:h-9 px-1 sm:px-3 text-xs sm:text-sm min-w-[70px] sm:min-w-auto bg-primary/10 hover:bg-primary/20"
            data-checkout-global="true"
          >
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Checkout</span>
            <span className="sm:hidden">Pay</span>
          </Button>
        )}
      </div>
    </div>
  );
};
