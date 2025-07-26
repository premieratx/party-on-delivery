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

  return (
    <Button
      onClick={() => navigate("/search")}
      variant="outline"
      size="icon"
      className={`${getButtonSize()} ${getButtonStyle()} ${className}`}
      aria-label="Search products"
    >
      <Search className={getIconSize()} />
    </Button>
  );
};