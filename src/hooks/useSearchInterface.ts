import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSearchInterfaceOptions {
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  hideOnScroll?: boolean;
}

export const useSearchInterface = (options: UseSearchInterfaceOptions = {}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shouldHideBottomMenu, setShouldHideBottomMenu] = useState(false);
  
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search focus - simplified
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setShouldHideBottomMenu(true);
    options.onSearchFocus?.();

    // Scroll to top instantly
    window.scrollTo(0, 0);

    // Mobile keyboard optimizations
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1.0');
        }
        document.body.classList.add('search-focused');
      });
    }
  }, [options]);

  // Handle search blur - simplified cleanup
  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    options.onSearchBlur?.();
    
    if (typeof window !== 'undefined') {
      document.body.classList.remove('search-focused');
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
      }
    }
  }, [options]);

  // Simplified scroll behavior
  useEffect(() => {
    if (!options.hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      if (scrollDelta > 5) {
        setShouldHideBottomMenu(true);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Show menu again after scrolling stops (only if search not focused)
        scrollTimeoutRef.current = setTimeout(() => {
          if (!isSearchFocused) {
            setShouldHideBottomMenu(false);
          }
        }, 1000);

        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isSearchFocused, options.hideOnScroll]);

  return {
    isSearchFocused,
    shouldHideBottomMenu,
    searchInputRef,
    handleSearchFocus,
    handleSearchBlur,
    resetInteraction: () => setShouldHideBottomMenu(false)
  };
};