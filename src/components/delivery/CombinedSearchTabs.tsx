import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, CreditCard, Check } from 'lucide-react';
import { useSearchInterface } from '@/hooks/useSearchInterface';
import { safePrice, formatPrice } from '@/utils/safeCalculations';
import { useUnifiedScrollBehavior } from '@/hooks/useUnifiedScrollBehavior';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';

// Preload critical images
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

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
  // Advanced search
  allProducts?: any[];
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
  onCheckout,
  allProducts = []
}: CombinedSearchTabsProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [tabLayout, setTabLayout] = useState<'full' | 'compact' | 'minimal' | 'icon-only'>('full');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Use unified scroll behavior for better mobile performance
  const { 
    getStickyBehavior, 
    shouldCondense, 
    isMobile: isMobileDevice,
    hideKeyboard: unifiedHideKeyboard,
    getScrollClasses
  } = useUnifiedScrollBehavior({
    hideKeyboardOnScroll: true,
    mobileSticky: 'auto',
    threshold: 100
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const activateSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const deactivateSearch = () => {
    unifiedHideKeyboard();
  };

  const stickyBehavior = getStickyBehavior();
  const condensed = shouldCondense();
  const isSticky = stickyBehavior.searchSticky || stickyBehavior.tabsSticky;
  
  // Get dynamic classes for responsive behavior  
  const searchClasses = getScrollClasses('search');
  const tabsClasses = getScrollClasses('tabs');

  // Enhanced dynamic tab sizing based on available space with better precision
  const calculateTabLayout = useCallback(() => {
    if (!tabsContainerRef.current || tabs.length === 0) return;
    
    const containerWidth = tabsContainerRef.current.offsetWidth - 16; // Account for padding
    const tabCount = tabs.length;
    
    // More precise spacing calculations
    const spacingBetweenTabs = 4; // gap-1 = 4px
    const totalSpacing = (tabCount - 1) * spacingBetweenTabs;
    const availableWidth = containerWidth - totalSpacing;
    const averageWidthPerTab = availableWidth / tabCount;
    
    // Calculate content width requirements for each mode
    const tabMeasurements = tabs.map(tab => {
      const charCount = tab.title.length;
      return {
        full: Math.max(charCount * 8 + 64, 100), // 8px per char + icon + generous padding
        compact: Math.max(charCount * 7 + 48, 80), // 7px per char + icon + padding
        minimal: Math.max(charCount * 6 + 36, 60), // 6px per char + icon + minimal padding
        iconOnly: 36 // Just icon + minimal padding
      };
    });

    // Check if tabs fit in each mode
    const totalWidthNeeded = {
      full: tabMeasurements.reduce((sum, tab) => sum + tab.full, 0),
      compact: tabMeasurements.reduce((sum, tab) => sum + tab.compact, 0),
      minimal: tabMeasurements.reduce((sum, tab) => sum + tab.minimal, 0),
      iconOnly: tabMeasurements.reduce((sum, tab) => sum + tab.iconOnly, 0)
    };

    // Progressive fallback to smaller layouts
    if (availableWidth >= totalWidthNeeded.full) {
      setTabLayout('full');
    } else if (availableWidth >= totalWidthNeeded.compact) {
      setTabLayout('compact');
    } else if (availableWidth >= totalWidthNeeded.minimal) {
      setTabLayout('minimal');
    } else {
      setTabLayout('icon-only');
    }
  }, [tabs]);

  // Enhanced responsive recalculation with throttling for performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledCalculateLayout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateTabLayout, 50); // Throttle for better performance
    };
    
    // Initial calculation
    calculateTabLayout();
    
    const resizeObserver = new ResizeObserver(throttledCalculateLayout);
    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [calculateTabLayout]);

  // Enhanced tab styling with smoother responsive design
  const getTabClasses = (isSelected: boolean) => {
    const baseClasses = "whitespace-nowrap flex-shrink-0 transition-all duration-300 flex items-center justify-center font-medium border border-transparent";
    const selectedClasses = isSelected 
      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
      : "bg-background hover:bg-accent text-foreground hover:text-accent-foreground border-muted hover:border-muted-foreground/50";
    
    let sizeClasses = "";
    switch (tabLayout) {
      case 'full':
        sizeClasses = "text-sm px-4 py-2.5 h-10 gap-2 min-w-[6rem]";
        break;
      case 'compact':
        sizeClasses = "text-sm px-3 py-2 h-9 gap-1.5 min-w-[4.5rem]";
        break;
      case 'minimal':
        sizeClasses = "text-xs px-2 py-1.5 h-8 gap-1 min-w-[3rem]";
        break;
      case 'icon-only':
        sizeClasses = "text-xs px-1 py-2 h-8 gap-0.5 min-w-[2.5rem]";
        break;
      default:
        sizeClasses = "text-sm px-3 py-2 h-9 gap-1.5";
    }
    
    return `${baseClasses} ${selectedClasses} ${sizeClasses}`;
  };

  // Enhanced icon sizing with better proportions
  const getIconSize = () => {
    switch (tabLayout) {
      case 'full':
        return 'w-5 h-5 text-lg'; // 20px
      case 'compact':
        return 'w-4 h-4 text-base'; // 16px
      case 'minimal':
        return 'w-4 h-4 text-sm'; // 16px (keep readable)
      case 'icon-only':
        return 'w-4 h-4 text-base'; // 16px (keep readable)
      default:
        return 'w-4 h-4 text-sm';
    }
  };

  const shouldShowText = () => {
    // Always show text on mobile, even in compact modes
    return true;
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

  // Listen for mobile search activation from SearchIcon component
  useEffect(() => {
    const handleMobileSearchActivate = () => {
      setIsSearchExpanded(true);
      onSearchActiveChange?.(true);
      // Focus the search input when expanded
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    };

    document.addEventListener('mobileSearchActivate', handleMobileSearchActivate);
    
    return () => {
      document.removeEventListener('mobileSearchActivate', handleMobileSearchActivate);
    };
  }, [onSearchActiveChange]);

  return (
    <div className={`bg-background border-b transition-all duration-200 ${
      isSticky || isSearchActive ? 'sticky top-0 z-50 shadow-md' : 'sticky top-0 z-40'
    } ${condensed ? 'py-2' : 'py-3'}`}>
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
            
            {/* Search Bar with Cart and Checkout - Prioritize tabs visibility */}
            {showSearch && (
              <div className="flex items-center gap-2 ml-2">
                {/* Compact Search Bar - shrinks first */}
                <div className="relative min-w-[120px] max-w-[200px] flex-shrink-2">
                  <AdvancedSearchBar
                    value={searchQuery}
                    onChange={(newValue) => {
                      onSearchChange(newValue);
                      if (newValue.trim()) {
                        setTimeout(() => onSearchSubmit(), 300);
                      }
                    }}
                    onSubmit={onSearchSubmit}
                    placeholder="Search products..."
                    className="w-full"
                    allProducts={allProducts}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Compact Cart and Checkout - shrink to icons on smaller screens */}
                <div className="flex items-center gap-1">
                  {/* Cart Button - Compact */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCart}
                    className="h-8 px-2 text-xs bg-background/50 hover:bg-background border-muted-foreground/20 hover:border-primary/50 flex-shrink-0"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    <span className="hidden lg:inline text-xs">Cart</span>
                    {cartItemCount > 0 && (
                      <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1 py-0.5 min-w-[1rem] h-4 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* Checkout Button - Compact with checkmark */}
                  {cartItemCount > 0 && (
                    <Button
                      size="sm"
                      onClick={onCheckout}
                      className="h-8 px-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      <span className="hidden xl:inline text-xs">Checkout</span>
                      <span className="text-xs font-semibold ml-1">
                        ${formatPrice(safePrice(totalAmount))}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE Layout - Always show tabs, conditionally show search */}
      <div className="block md:hidden">
        
        {/* Search Bar Section - Only when search is active/expanded */}
        {showSearch && (isSearchExpanded || isSearchActive) && (
          <div className="container mx-auto px-2 py-2 bg-background/95 backdrop-blur-sm border-b">
            <div className="flex items-center justify-center">
              <AdvancedSearchBar
                value={searchQuery}
                onChange={(newValue) => {
                  onSearchChange(newValue);
                  if (newValue.trim()) {
                    setTimeout(() => onSearchSubmit(), 300);
                  }
                }}
                onSubmit={onSearchSubmit}
                placeholder="Search products..."
                className="flex-1 max-w-md"
                allProducts={allProducts}
                autoFocus={true}
              />
            </div>
          </div>
        )}

        {/* Tabs Section - Always visible on mobile */}
        <div className="container mx-auto px-2 py-1.5 bg-background border-b">
          <div className="flex items-center">
              {/* Enhanced Responsive Tabs - Show 4.5 tabs with scrolling */}
              <div 
                ref={tabsContainerRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide w-full"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch'
                }}
                 onScroll={() => {
                   if (isMobileDevice) {
                     unifiedHideKeyboard();
                     // Force immediate blur of any active input
                     const activeEl = document.activeElement;
                     if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                       (activeEl as HTMLElement).blur();
                     }
                   }
                 }}
                 onTouchStart={() => {
                   if (isMobileDevice) {
                     unifiedHideKeyboard();
                   }
                 }}
              >
                {tabs.map((tab, index) => (
                  <Button
                    key={tab.id}
                    className={getTabClasses(selectedCategory === index)}
                    onClick={() => onTabSelect(index)}
                    title={tab.title}
                    style={{ 
                      flex: '0 0 calc(22.5% - 3px)', // Show 4.5 tabs (100% / 4.5 = ~22.2%)
                      minWidth: 'calc(22.5% - 3px)',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    {/* Icon and full text - no truncation */}
                    <span className="text-xs mr-1 flex-shrink-0" style={{ fontSize: '10px' }}>
                      {tab.icon || '📦'}
                    </span>
                    <span className="font-medium text-xs leading-tight whitespace-nowrap">
                      {tab.title}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Bottom Row - Search/Cart/Checkout Actions (Always visible) */}
        <div className="container mx-auto px-4 py-2 bg-background border-b" data-mobile-search-handler>
          <div className="flex items-center justify-center gap-4">
            {/* Search Icon - Toggle search bar */}
            {showSearch && (
              <Button
                variant={isSearchExpanded || isSearchActive ? "default" : "ghost"}
                size="sm"
                onClick={handleSearchIconClick}
                className="h-9 w-9 p-0 border border-muted hover:border-primary transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            
            {/* Cart Button - Mobile (Simple: Icon + Count Only) */}
            <Button
              variant="outline"
              onClick={onOpenCart}
              className="flex items-center justify-center gap-1.5 h-9 px-3 border hover:bg-muted transition-colors"
              disabled={cartItemCount === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center font-semibold">
                  {cartItemCount}
                </span>
              )}
            </Button>
            
            {/* Checkout Button - Mobile (Checkmark + Total Only) */}
            <Button
              onClick={onCheckout}
              className="flex items-center justify-center gap-1.5 h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200"
              variant="default"
              disabled={cartItemCount === 0}
            >
              <Check className="w-5 h-5" />
              {totalAmount > 0 && (
                <span className="font-bold text-sm">${formatPrice(safePrice(totalAmount))}</span>
              )}
            </Button>
          </div>
        </div>

        {/* Combined Row - Search Bar + Cart/Checkout (Mobile only) */}
        {showSearch && isSearchExpanded && (
          <div className="container mx-auto px-4 pb-3">
            <div className="flex items-center gap-2">
              {/* Expanded Search Bar */}
              <div className="flex flex-1">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search all products..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    handleSearchFocus();
                    activateSearch();
                  }}
                  onBlur={() => {
                    handleSearchBlur();
                    deactivateSearch();
                  }}
                  className="rounded-r-none text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                  autoFocus
                />
                <Button 
                  onClick={onSearchSubmit}
                  className="rounded-l-none px-2"
                  disabled={isSearching}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Compact Cart Button */}
              <Button
                variant="outline"
                onClick={onOpenCart}
                className="flex items-center gap-1 h-9 px-2"
                disabled={cartItemCount === 0}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center font-semibold">
                    {cartItemCount}
                  </span>
                )}
              </Button>
              
              {/* Compact Checkout Button */}
              <Button
                onClick={onCheckout}
                className="flex items-center gap-1 h-9 px-2 bg-primary hover:bg-primary/90"
                disabled={cartItemCount === 0}
              >
                <Check className="w-4 h-4" />
                {totalAmount > 0 && (
                  <span className="text-xs font-bold">${formatPrice(safePrice(totalAmount))}</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};