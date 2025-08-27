import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SearchIconProps {
  size?: "sm" | "md" | "lg";
  variant?: "mobile" | "desktop" | "tabs";
  className?: string;
}

export const SearchIcon = ({ size = "md", variant = "mobile", className = "" }: SearchIconProps) => {
  const navigate = useNavigate();

  const getIconSize = () => {
    if (size === "sm") return "w-4 h-4";
    if (size === "lg") return "w-6 h-6";
    return "w-5 h-5";
  };

  const getButtonSize = () => {
    if (variant === "tabs") return "h-8 w-8";
    if (size === "sm") return "h-8 w-8";
    if (size === "lg") return "h-12 w-12";
    return "h-10 w-10";
  };

  const getButtonStyle = () => {
    if (variant === "tabs") {
      return "bg-background border-2 border-black shadow-lg hover:bg-muted/50 hover:shadow-xl transition-all duration-200";
    }
    return "bg-background hover:bg-muted/50 shadow-md hover:shadow-lg transition-all duration-200";
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔍 SearchIcon clicked, variant:', variant);
    console.log('🔍 Click event details:', { target: event.target, currentTarget: event.currentTarget });
    
    // Check if we're in a delivery app context by looking for mobile search handler
    const searchHandler = document.querySelector('[data-mobile-search-handler]');
    console.log('📱 Search handler found:', !!searchHandler);
    
    if (searchHandler) {
      console.log('🚀 Mobile search activation in delivery app context');
      
      // FIXED: Dispatch custom event immediately - don't try to click the button that might disappear
      const customEvent = new CustomEvent('mobileSearchActivate', { 
        bubbles: true, 
        cancelable: true, 
        detail: { source: 'SearchIcon', variant, timestamp: Date.now() } 
      });
      
      // Dispatch on multiple targets for maximum compatibility
      document.dispatchEvent(customEvent);
      searchHandler.dispatchEvent(customEvent);
      window.dispatchEvent(customEvent);
      console.log('📤 mobileSearchActivate event dispatched');
      
      // Also try direct input focus as immediate fallback
      setTimeout(() => {
        const searchInput = searchHandler.querySelector('input[placeholder*="Search"]') as HTMLInputElement ||
                           searchHandler.querySelector('.mobile-search-input') as HTMLInputElement ||
                           document.querySelector('input[type="text"]') as HTMLInputElement;
                           
        if (searchInput) {
          console.log('🎯 Direct input focus fallback');
          searchInput.focus();
          searchInput.click();
          
          // Trigger focus event
          const focusEvent = new FocusEvent('focus', { bubbles: true });
          searchInput.dispatchEvent(focusEvent);
        }
      }, 100);
      
    } else {
      // Default navigation to search page
      console.log('🔄 Navigating to search page');
      navigate("/search");
    }
  };

  return (
    <Button
      onClick={handleClick}
      onTouchStart={(e) => {
        // Ensure touch events also work on mobile
        e.stopPropagation();
        console.log('🔍 SearchIcon touch start');
      }}
      variant="outline"
      size="icon"
      className={`${getButtonSize()} ${getButtonStyle()} ${className} cursor-pointer select-none`}
      aria-label="Search products"
      style={{ pointerEvents: 'auto', zIndex: 999 }}
      data-testid="search-icon-button"
    >
      <Search className={getIconSize()} />
    </Button>
  );
};