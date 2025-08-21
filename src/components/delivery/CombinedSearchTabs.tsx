import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [tabLayout, setTabLayout] = useState<'full' | 'compact' | 'minimal' | 'icon-only'>('full');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const { headerCompressed } = useSearchInterface();

  // Dynamic tab sizing based on available space
  const calculateTabLayout = useCallback(() => {
    if (!tabsContainerRef.current || tabs.length === 0) return;
    
    const containerWidth = tabsContainerRef.current.offsetWidth;
    const tabCount = tabs.length;
    
    // Estimate space needed for each layout mode (in pixels)
    const spacingBetweenTabs = 4; // gap-1 = 4px
    const totalSpacing = (tabCount - 1) * spacingBetweenTabs;
    
    // Average character width estimates + padding + icon space
    const avgTabNameLength = tabs.reduce((sum, tab) => sum + tab.title.length, 0) / tabCount;
    const fullModeWidth = tabCount * (avgTabNameLength * 8 + 40 + 24) + totalSpacing; // 8px per char + icon + padding
    const compactModeWidth = tabCount * (avgTabNameLength * 7 + 32 + 20) + totalSpacing; // smaller text/padding
    const minimalModeWidth = tabCount * (avgTabNameLength * 6 + 24 + 16) + totalSpacing; // minimal text/padding
    const iconOnlyModeWidth = tabCount * (32) + totalSpacing; // just icons + minimal padding
    
    if (containerWidth >= fullModeWidth) {
      setTabLayout('full');
    } else if (containerWidth >= compactModeWidth) {
      setTabLayout('compact');
    } else if (containerWidth >= minimalModeWidth) {
      setTabLayout('minimal');
    } else {
      setTabLayout('icon-only');
    }
  }, [tabs]);

  // Recalculate on resize and tab changes
  useEffect(() => {
    calculateTabLayout();
    
    const resizeObserver = new ResizeObserver(calculateTabLayout);
    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [calculateTabLayout]);

  // Get dynamic tab styling based on layout mode
  const getTabClasses = (isSelected: boolean) => {
    const baseClasses = "whitespace-nowrap flex-shrink-0 transition-all duration-200 flex items-center justify-center";
    const variantClass = isSelected ? "default" : "ghost";
    
    switch (tabLayout) {
      case 'full':
        return `${baseClasses} text-sm px-3 py-2 h-9 gap-2`;
      case 'compact':
        return `${baseClasses} text-xs px-2 py-1.5 h-8 gap-1.5`;
      case 'minimal':
        return `${baseClasses} text-xs px-1.5 py-1 h-7 gap-1`;
      case 'icon-only':
        return `${baseClasses} text-xs p-1.5 h-8 w-8`;
      default:
        return `${baseClasses} text-xs px-2 py-1 h-8 gap-1`;
    }
  };

  const getIconSize = () => {
    switch (tabLayout) {
      case 'full':
        return 'text-lg'; // 18px
      case 'compact':
        return 'text-base'; // 16px
      case 'minimal':
        return 'text-sm'; // 14px
      case 'icon-only':
        return 'text-sm'; // 14px
      default:
        return 'text-sm';
    }
  };

  const shouldShowText = () => {
    return tabLayout !== 'icon-only';
  };

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
    <div className="bg-background border-b sticky top-0 z-40">
      {/* Desktop Layout */}
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
                  <span className="mr-2 text-lg">{tab.icon || '📦'}</span>
                  <span>{tab.title}</span>
                </Button>
              ))}
            </div>
            
            {/* Search Bar with Cart and Checkout */}
            {showSearch && (
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="pl-10 h-10 bg-muted/50 border-muted-foreground/20 focus:border-primary transition-colors"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Cart and Checkout Buttons */}
                <div className="flex items-center gap-2">
                  {/* Cart Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCart}
                    className="h-10 px-3 bg-background/50 hover:bg-background border-muted-foreground/20 hover:border-primary/50"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Cart</span>
                    {cartItemCount > 0 && (
                      <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* Checkout Button */}
                  {cartItemCount > 0 && (
                    <Button
                      size="sm"
                      onClick={onCheckout}
                      className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Checkout</span>
                      <span className="sm:hidden">Pay</span>
                      <span className="ml-2 font-semibold">
                        ${totalAmount?.toFixed(2)}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout with Dynamic Responsive Tabs */}
      <div className="block md:hidden sticky top-0 z-40 bg-background">
        {/* First Row - Dynamic Tabs */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Dynamic Responsive Tabs */}
            <div 
              ref={tabsContainerRef}
              className="flex space-x-1 overflow-x-auto scrollbar-hide flex-1"
            >
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  className={getTabClasses(selectedCategory === index)}
                  onClick={() => onTabSelect(index)}
                  title={tab.title}
                >
                  <span className={`flex-shrink-0 ${getIconSize()}`}>
                    {tab.icon || '📦'}
                  </span>
                  {shouldShowText() && (
                    <span className="truncate">
                      {tab.title}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row - Cart, Checkout, and Search Icons (Mobile) */}
        <div className="container mx-auto px-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Search Icon - Now in same row as cart/checkout */}
            {showSearch && !isSearchExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchIconClick}
                className="flex-shrink-0 h-10 w-10 p-0 border-2 border-muted"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            
            {/* Cart Button - Mobile (Icon only) */}
            <Button
              variant="outline"
              onClick={onOpenCart}
              className="flex-1 flex items-center justify-center gap-1 h-10 text-sm border-2 hover:bg-muted transition-colors"
              disabled={cartItemCount === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
              {totalAmount > 0 && (
                <span className="font-bold text-xs">${totalAmount.toFixed(2)}</span>
              )}
            </Button>
            
            {/* Checkout Button - Mobile (Icon only) */}
            <Button
              onClick={onCheckout}
              className="flex-1 flex items-center justify-center gap-1 h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              variant="default"
              disabled={cartItemCount === 0}
            >
              <CreditCard className="w-4 h-4" />
              {totalAmount > 0 && (
                <span className="font-bold text-xs">${totalAmount.toFixed(2)}</span>
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