import { useUnifiedScrollBehavior } from './useUnifiedScrollBehavior';

interface StickySearchOptions {
  threshold?: number;
  hideKeyboardOnScroll?: boolean;
}

/**
 * LEGACY HOOK - Now uses unified scroll behavior
 * Maintains backward compatibility while enforcing new rules
 */
export function useStickySearchHeader(options: StickySearchOptions = {}) {
  const { threshold = 50 } = options;
  
  const scrollBehavior = useUnifiedScrollBehavior({
    hideKeyboardOnScroll: true,
    mobileSticky: 'auto', // Auto-switch between search and tabs
    desktopSticky: true,
    threshold
  });

  const {
    isScrollingDown,
    scrollY,
    keyboardVisible,
    getStickyBehavior,
    shouldCondense,
    hideKeyboard,
    isMobile
  } = scrollBehavior;

  const { searchSticky } = getStickyBehavior();

  return {
    // Legacy API compatibility
    isSticky: searchSticky && scrollY > threshold,
    isSearchActive: keyboardVisible,
    scrollY,
    searchInputRef: { current: null }, // Placeholder for compatibility
    
    // Enhanced functionality
    getSearchClasses: () => scrollBehavior.getScrollClasses('search'),
    getTabsClasses: () => scrollBehavior.getScrollClasses('tabs'),
    hideKeyboard,
    isMobile,
    
    // Legacy methods for compatibility
    activateSearch: () => {},
    deactivateSearch: () => hideKeyboard()
  };
}