import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, CreditCard } from 'lucide-react';
import { useSearchInterface } from '@/hooks/useSearchInterface';

interface Tab {
  id: string;
  title: string;
  handle: string;
  icon?: string;
}

interface CombinedSearchTabsProps {
  tabs: Tab[];
  selectedCategory: number;
  onTabSelect: (index: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  showSearch?: boolean;
  isSearchActive?: boolean;
  onSearchActiveChange?: (active: boolean) => void;
  isSearching?: boolean;
  // Cart and checkout functionality
  cartItemCount?: number;
  totalAmount?: number;
  onOpenCart?: () => void;
  onCheckout?: () => void;
}

export const CombinedSearchTabs = ({
  tabs,
  selectedCategory,
  onTabSelect,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  showSearch = true,
  isSearchActive = false,
  onSearchActiveChange,
  isSearching = false,
  cartItemCount = 0,
  totalAmount = 0,
  onOpenCart,
  onCheckout
}: CombinedSearchTabsProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { headerCompressed } = useSearchInterface();

  // Auto-expand search when user starts typing
  useEffect(() => {
    if (searchQuery?.trim()) {
      setIsSearchExpanded(true);
      onSearchActiveChange?.(true);
    } else {
      onSearchActiveChange?.(false);
    }
  }, [searchQuery, onSearchActiveChange]);

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    onSearchActiveChange?.(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery?.trim()) {
      setIsSearchExpanded(false);
      onSearchActiveChange?.(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    onSearchActiveChange?.(true);
  };

  return (
    <div className="sticky top-0 z-40 bg-background border-b shadow-sm transition-all duration-300">
      {/* Desktop Layout - Side by side with cart and checkout */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap px-4 py-2 h-10 min-w-fit flex-shrink-0 transition-all duration-200"
                  onClick={() => onTabSelect(index)}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  <span>{tab.title}</span>
                </Button>
              ))}
            </div>
            
            {/* Search Bar with Running Total */}
            {showSearch && (
              <div className="flex items-center gap-2">
                {/* Running Total */}
                {totalAmount > 0 && (
                  <div className="text-lg font-bold text-primary whitespace-nowrap">
                    ${totalAmount.toFixed(2)}
                  </div>
                )}
                
                {/* Search Input */}
                <div className="flex w-80">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="rounded-r-none"
                    onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                  />
                  <Button 
                    onClick={onSearchSubmit}
                    className="rounded-l-none px-3"
                    disabled={isSearching}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Cart and Checkout Buttons */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="outline"
                onClick={onOpenCart}
                className="flex items-center gap-2 h-10 min-w-fit hover:bg-muted transition-colors"
                disabled={cartItemCount === 0}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span>({cartItemCount})</span>
              </Button>
              
              <Button
                onClick={onCheckout}
                className="flex items-center gap-2 h-10 min-w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                variant="default"
                disabled={cartItemCount === 0}
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Checkout</span>
                <span className="sm:hidden">Buy</span>
                {totalAmount > 0 && (
                  <span className="font-bold ml-1">${totalAmount.toFixed(2)}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout with stacked cart and checkout */}
      <div className="block md:hidden">
        {/* First Row - Tabs and Search Icon */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className="whitespace-nowrap text-xs px-2 py-1 h-8 min-w-fit flex-shrink-0 transition-all duration-200"
                  onClick={() => onTabSelect(index)}
                >
                  {tab.icon && <span className="mr-1 text-xs">{tab.icon}</span>}
                  <span className="text-xs">{tab.title}</span>
                </Button>
              ))}
            </div>
            
            {/* Search Icon */}
            {showSearch && !isSearchExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchIconClick}
                className="ml-2 flex-shrink-0 h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Second Row - Cart and Checkout (Mobile Split Layout) */}
        <div className="container mx-auto px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Cart Button - Mobile */}
            <Button
              variant="outline"
              onClick={onOpenCart}
              className="flex items-center justify-center gap-2 h-10 text-sm border-2 hover:bg-muted transition-colors"
              disabled={cartItemCount === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cartItemCount})</span>
              {totalAmount > 0 && (
                <span className="font-bold">${totalAmount.toFixed(2)}</span>
              )}
            </Button>
            
            {/* Checkout Button - Mobile */}
            <Button
              onClick={onCheckout}
              className="flex items-center justify-center gap-2 h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              variant="default"
              disabled={cartItemCount === 0}
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout</span>
              {totalAmount > 0 && (
                <span className="font-bold ml-1">${totalAmount.toFixed(2)}</span>
              )}
            </Button>
          </div>
        </div>

        {/* Third Row - Expanded Search Bar (Mobile only) */}
        {showSearch && isSearchExpanded && (
          <div className="container mx-auto px-4 pb-3">
            <div className="flex">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="rounded-r-none"
                onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                autoFocus
              />
              <Button 
                onClick={onSearchSubmit}
                className="rounded-l-none px-3"
                disabled={isSearching}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};