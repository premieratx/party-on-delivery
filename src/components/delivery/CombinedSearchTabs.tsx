import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, CreditCard, Check } from 'lucide-react';
import { useSearchInterface } from '@/hooks/useSearchInterface';
import { safePrice, formatPrice } from '@/utils/safeCalculations';
import { useUnifiedScrollBehavior } from '@/hooks/useUnifiedScrollBehavior';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';
import { UltraFastMobileSearch } from '@/components/search/UltraFastMobileSearch';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
    
    // Calculate content width requirements for each mode (NO ICONS)
    const tabMeasurements = tabs.map(tab => {
      const charCount = tab.title.length;
      return {
        full: Math.max(charCount * 9 + 32, 80), // 9px per char + padding (no icon)
        compact: Math.max(charCount * 8 + 24, 70), // 8px per char + padding (no icon)
        minimal: Math.max(charCount * 7 + 16, 60), // 7px per char + minimal padding (no icon)
        iconOnly: Math.max(charCount * 6 + 12, 50) // 6px per char + minimal padding (no icon)
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
        sizeClasses = "text-sm px-6 py-2.5 h-10 min-w-[6rem]";
        break;
      case 'compact':
        sizeClasses = "text-sm px-4 py-2 h-9 min-w-[4.5rem]";
        break;
      case 'minimal':
        sizeClasses = "text-xs px-3 py-1.5 h-8 min-w-[3rem]";
        break;
      case 'icon-only':
        sizeClasses = "text-xs px-2 py-1.5 h-8 min-w-[2.5rem]";
        break;
      default:
        sizeClasses = "text-sm px-4 py-2 h-9";
    }
    
    return `${baseClasses} ${selectedClasses} ${sizeClasses}`;
  };

  // Always show text without icons
  const shouldShowText = () => {
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
    console.log('🔍 Search icon clicked - expanding search bar and moving tabs to top');
    
    // Prevent any potential race conditions by immediately setting state
    setIsSearchExpanded(true);
    onSearchActiveChange?.(true);
    
    // Enhanced mobile behavior: move tabs to very top with search sticky below
    if (window.innerWidth <= 768) {
      // Scroll to top with instant behavior to avoid visual glitches
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Add a small delay to ensure sticky positioning is applied
      setTimeout(() => {
        // Ensure we're still at the top after sticky positioning
        if (window.scrollY > 50) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        
        // Now focus the search input
        requestAnimationFrame(() => {
          const input = searchInputRef.current || 
                       document.querySelector('[data-mobile-search-handler] input[type="search"]') as HTMLInputElement ||
                       document.querySelector('input[placeholder*="Search products"]') as HTMLInputElement ||
                       document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          
          if (input) {
            console.log('🔍 Focusing search input:', input);
            input.focus();
            input.click();
            
            // Force cursor to end of input
            if (input.value) {
              input.setSelectionRange(input.value.length, input.value.length);
            }
          } else {
            console.warn('🔍 Search input not found for focus');
          }
        });
      }, 50);
    }
  };

  // Listen for mobile search activation from SearchIcon component
  useEffect(() => {
    const handleMobileSearchActivate = (e: Event) => {
      console.log('📱 Mobile search activated from SearchIcon');
      e.preventDefault();
      e.stopPropagation();
      
      // Force expansion and activation
      setIsSearchExpanded(true);
      onSearchActiveChange?.(true);
      
      // Focus the search input with multiple attempts
      setTimeout(() => {
        const searchInput = searchInputRef.current ||
                           document.querySelector('[data-mobile-search-handler] input') as HTMLInputElement ||
                           document.querySelector('input[placeholder*="Search"]') as HTMLInputElement ||
                           document.querySelector('input[type="text"]') as HTMLInputElement;
        
        if (searchInput) {
          searchInput.focus();
          searchInput.click();
          console.log('🎯 Search input focused and clicked');
        } else {
          console.log('❌ Search input not found for focus');
        }
      }, 200);
    };

    // Listen on both document and the search handler element
    const searchHandler = document.querySelector('[data-mobile-search-handler]');
    
    // Add listeners
    document.addEventListener('mobileSearchActivate', handleMobileSearchActivate);
    if (searchHandler) {
      searchHandler.addEventListener('mobileSearchActivate', handleMobileSearchActivate);
    }
    
    return () => {
      document.removeEventListener('mobileSearchActivate', handleMobileSearchActivate);
      if (searchHandler) {
        searchHandler.removeEventListener('mobileSearchActivate', handleMobileSearchActivate);
      }
    };
  }, [onSearchActiveChange]);

  return (
    <div className={`bg-background border-b transition-all duration-200 sticky top-0 z-50 shadow-md ${
      (isSearchExpanded || isSearchActive) && isMobile ? 'py-2' : 'py-3'
    }`}>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 w-full">
            {/* Tabs Container - Limited width to prevent overflow */}
            <div className="relative flex-1 max-w-[60%] min-w-0">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide" 
                   style={{ scrollSnapType: 'x mandatory' }}>
                {tabs.map((tab, index) => (
                  <Button
                    key={tab.id}
                    variant={selectedCategory === index ? "default" : "ghost"}
                    className="whitespace-nowrap px-4 py-2 h-9 min-w-fit flex-shrink-0 transition-all duration-200 text-sm"
                    onClick={() => onTabSelect(index)}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <span className="font-medium">{tab.title}</span>
                  </Button>
                ))}
              </div>
              {/* Scroll indicator */}
              <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
            
            {/* Search Bar with Cart and Checkout - Fixed width to prevent overflow */}
            {showSearch && (
              <div className="flex items-center gap-2 flex-shrink-0 min-w-0 max-w-[40%]">
                {/* Compact Search Bar */}
                <div className="relative min-w-[100px] max-w-[180px] flex-shrink-1">
                  <AdvancedSearchBar
                    value={searchQuery}
                    onChange={(newValue) => {
                      onSearchChange(newValue);
                      if (newValue.trim()) {
                        setTimeout(() => onSearchSubmit(), 300);
                      }
                    }}
                    onSubmit={onSearchSubmit}
                    placeholder="Search..."
                    className="w-full text-sm"
                    allProducts={allProducts}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Compact Cart and Checkout */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Cart Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCart}
                    className="h-8 px-2 text-xs bg-background/50 hover:bg-background border-muted-foreground/20 hover:border-primary/50 flex-shrink-0"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span className="hidden xl:inline text-xs ml-1">Cart</span>
                    {cartItemCount > 0 && (
                      <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1 py-0.5 min-w-[1rem] h-4 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* Checkout Button */}
                  {cartItemCount > 0 && (
                    <Button
                      size="sm"
                      onClick={onCheckout}
                      className="h-8 px-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                    >
                      <Check className="w-3 h-3" />
                      <span className="hidden xl:inline text-xs ml-1">Checkout</span>
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
        
        {/* Top search bar hidden - using only bottom search bar in cart/checkout row */}

        {/* Tabs Section with improved responsive design and condensation when search active */}
        <div className={`container mx-auto px-2 bg-background border-b transition-all duration-300 ${
          (isSearchExpanded || isSearchActive) ? 'py-1' : 'py-1.5'
        }`}>
          <div className="flex items-center">
            {/* Enhanced Responsive Tabs - No icons, better text spacing, NO condensation */}
            <div className="relative w-full overflow-hidden">
                <div 
                ref={tabsContainerRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide w-full pb-1 transition-all duration-300"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  maxWidth: '100%'
                }}
                onScroll={() => {
                  if (isMobileDevice) {
                    unifiedHideKeyboard();
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
                      flex: '0 0 auto', // Natural width with no forced sizing
                      minWidth: 'max-content', // Allow natural text width
                      scrollSnapAlign: 'start'
                    }}
                  >
                    {/* Only text - no icons to prevent overlap */}
                    <span className="font-medium text-xs leading-tight whitespace-nowrap px-1">
                      {tab.title}
                    </span>
                  </Button>
                ))}
              </div>
              
              {/* Animated scroll indicator */}
              <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none animate-pulse" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-bounce">
                →
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Search/Cart/Checkout Actions (Always visible and sticky) */}
        <div className={`container mx-auto px-4 bg-background transition-all duration-300 ${
          (isSearchExpanded || isSearchActive) ? 'py-2 border-b-2 border-primary/20' : 'py-2 border-b'
        }`} data-mobile-search-handler>
          <div className={`flex items-center justify-center gap-2 transition-all duration-300 ${isSearchExpanded || isSearchActive ? 'animate-scale-in' : ''}`}>
            {/* Search Section - Expands when active */}
            {showSearch && (
              <div className={`flex items-center transition-all duration-300 ease-in-out ${
                isSearchExpanded || isSearchActive 
                  ? 'flex-1 mr-0' 
                  : 'flex-shrink-0'
              }`}>
                {isSearchExpanded || isSearchActive ? (
                  /* Expanded Search Bar - Full width with smooth animation */
                  <div className="flex items-center w-full animate-fade-in">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => {
                          onSearchChange(e.target.value);
                          // Real-time search as user types
                          if (e.target.value.trim()) {
                            setTimeout(() => onSearchSubmit(), 200);
                          }
                        }}
                        onFocus={() => {
                          setIsSearchExpanded(true);
                          onSearchActiveChange?.(true);
                        }}
                        onBlur={handleSearchBlur}
                        placeholder="Search products..."
                        className="flex h-10 w-full rounded-full border-2 border-primary/30 bg-background/95 backdrop-blur-sm pl-10 pr-4 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 touch-manipulation"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        style={{ 
                          fontSize: '16px', // Prevent iOS zoom
                          WebkitAppearance: 'none',
                          appearance: 'none'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            onSearchSubmit();
                          }
                        }}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Search Icon - Compact */
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSearchIconClick}
                    className="h-10 w-10 p-0 rounded-full border border-muted hover:border-primary transition-all duration-200 hover:scale-105"
                    title="Search products"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Cart Button - Slides right and shrinks when search is expanded */}
            <Button
              variant="outline"
              onClick={onOpenCart}
              className={`flex items-center justify-center border hover:bg-muted transition-all duration-300 ease-in-out relative ${
                (isSearchExpanded || isSearchActive) 
                  ? 'h-10 w-10 p-0 ml-2 rounded-full transform translate-x-2 scale-90' 
                  : 'h-10 px-4 gap-2 rounded-full'
              }`}
              title={`Cart ${cartItemCount > 0 ? `(${cartItemCount} items)` : ''}`}
            >
              <ShoppingCart className="w-5 h-5" />
              {/* Show count as badge when expanded, inline when collapsed */}
              {(isSearchExpanded || isSearchActive) && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center font-bold animate-scale-in">
                  {cartItemCount}
                </span>
              )}
              {!(isSearchExpanded || isSearchActive) && cartItemCount > 0 && (
                <span className="text-sm bg-primary text-primary-foreground rounded-full px-2 py-1 min-w-[1.5rem] h-6 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
              {!(isSearchExpanded || isSearchActive) && (
                <span className="text-sm font-medium">Cart</span>
              )}
            </Button>
            
            {/* Checkout Button - Slides right and shrinks when search is expanded */}
            <Button
              onClick={onCheckout}
              className={`flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 ease-in-out ${
                (isSearchExpanded || isSearchActive) 
                  ? 'h-10 w-10 p-0 ml-1 rounded-full transform translate-x-3 scale-90' 
                  : 'h-10 px-4 gap-2 rounded-full'
              }`}
              variant="default"
              disabled={cartItemCount === 0}
              title={`Checkout ${totalAmount > 0 ? `($${formatPrice(safePrice(totalAmount))})` : ''}`}
            >
              <Check className="w-5 h-5" />
              {/* Show price inline when collapsed */}
              {!(isSearchExpanded || isSearchActive) && totalAmount > 0 && (
                <span className="font-bold text-sm">${formatPrice(safePrice(totalAmount))}</span>
              )}
              {!(isSearchExpanded || isSearchActive) && (
                <span className="text-sm font-medium">
                  {totalAmount > 0 ? '' : 'Checkout'}
                </span>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};