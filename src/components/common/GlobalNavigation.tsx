import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface NavigationState {
  path: string;
  timestamp: number;
}

export const GlobalNavigation = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems, getTotalPrice } = useUnifiedCart();

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

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-background/95 backdrop-blur border-t shadow-lg",
      "flex items-center justify-between px-2 sm:px-4 py-2",
      "h-14", // Fixed height for consistency
      className
    )}>
      {/* Left: Back/Forward Navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>

      {/* Center: Page indicator */}
      <div className="text-xs text-muted-foreground hidden sm:block">
        {currentIndex + 1} / {history.length}
      </div>

      {/* Right: Home and Cart */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
        >
          <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Home</span>
        </Button>

        {getTotalItems() > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleCart}
            className="h-8 sm:h-9 px-2 sm:px-3 relative text-xs sm:text-sm bg-green-600 hover:bg-green-700"
            key={`cart-${getTotalItems()}-${getTotalPrice()}`} // Force re-render on changes
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">
              Cart ({getTotalItems()}) ${getTotalPrice().toFixed(2)}
            </span>
            <span className="sm:hidden">
              {getTotalItems()}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};
