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

  const handleClick = () => {
    console.log('🔍 SearchIcon clicked, variant:', variant);
    // Check if we're in a delivery app context by looking for mobile search handler
    const searchHandler = document.querySelector('[data-mobile-search-handler]');
    console.log('📱 Search handler found:', !!searchHandler);
    
    if (searchHandler) {
      // Always trigger mobile search expansion in delivery app, regardless of variant
      console.log('🚀 Dispatching mobileSearchActivate event');
      const event = new CustomEvent('mobileSearchActivate', { bubbles: true });
      searchHandler.dispatchEvent(event);
    } else {
      // Default navigation to search page
      console.log('🔄 Navigating to search page');
      navigate("/search");
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="icon"
      className={`${getButtonSize()} ${getButtonStyle()} ${className} relative z-40 touch-manipulation`}
      aria-label="Search products"
      style={{
        pointerEvents: 'auto',
        touchAction: 'manipulation'
      }}
    >
      <Search className={getIconSize()} />
    </Button>
  );
};