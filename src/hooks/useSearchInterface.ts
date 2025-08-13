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
  
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search focus with immediate UI changes and scrolling
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setHasUserInteracted(true);
    setShouldHideChrome(true);
    options.onSearchFocus?.();

    // Immediate scroll to top to bring search bar into view
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Add mobile keyboard optimizations
    if (typeof window !== 'undefined') {
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      
      // Force viewport adjustment for mobile keyboards
      setTimeout(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1.0');
        }
      }, 100);
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

  // Handle scroll behavior
  useEffect(() => {
    if (!options.hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Only trigger on significant scroll movements
      if (scrollDelta > 5) {
        setIsScrolling(true);
        setHasUserInteracted(true);
        setShouldHideChrome(true);

        // Hide keyboard if focused
        if (isSearchFocused && searchInputRef.current) {
          searchInputRef.current.blur();
        }

        // Clear previous timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Stop scrolling state after a delay
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);

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
    searchInputRef,
    handleSearchFocus,
    handleSearchBlur,
    resetInteraction: () => {
      setHasUserInteracted(false);
      setShouldHideChrome(false);
    }
  };
};