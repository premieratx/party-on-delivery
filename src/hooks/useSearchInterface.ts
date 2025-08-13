import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSearchInterfaceOptions {
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  hideOnScroll?: boolean;
}

export const useSearchInterface = (options: UseSearchInterfaceOptions = {}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [shouldHideChrome, setShouldHideChrome] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [shouldHideBottomMenu, setShouldHideBottomMenu] = useState(false);
  
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search focus with immediate UI changes and instant scrolling
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setHasUserInteracted(true);
    setShouldHideChrome(true);
    options.onSearchFocus?.();

    // Instant scroll to top - no smooth animation for speed
    window.scrollTo(0, 0);

    // Add mobile keyboard optimizations
    if (typeof window !== 'undefined') {
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      
      // Force viewport adjustment for mobile keyboards
      requestAnimationFrame(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1.0');
        }
      });
    }
  }, [options]);

  // Handle search blur with cleanup
  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    options.onSearchBlur?.();
    
    // Restore body styles
    if (typeof window !== 'undefined') {
      document.body.style.height = '';
      document.body.style.overflow = '';
      
      // Restore normal viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
      }
    }
  }, [options]);

  // Handle scroll behavior with bottom menu hiding
  useEffect(() => {
    if (!options.hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Trigger on any scroll movement for immediate response
      if (scrollDelta > 1) {
        setIsScrolling(true);
        setHasUserInteracted(true);
        setShouldHideChrome(true);
        setShouldHideBottomMenu(true);

        // Hide keyboard if focused
        if (isSearchFocused && searchInputRef.current) {
          searchInputRef.current.blur();
        }

        // Clear previous timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Stop scrolling state after a brief delay
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          // Keep bottom menu hidden for longer
          setTimeout(() => setShouldHideBottomMenu(false), 1000);
        }, 100);

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

  // Reset interaction state on page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      setHasUserInteracted(false);
      setShouldHideChrome(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    isSearchFocused,
    hasUserInteracted,
    shouldHideChrome,
    isScrolling,
    shouldHideBottomMenu,
    searchInputRef,
    handleSearchFocus,
    handleSearchBlur,
    resetInteraction: () => {
      setHasUserInteracted(false);
      setShouldHideChrome(false);
      setShouldHideBottomMenu(false);
    }
  };
};