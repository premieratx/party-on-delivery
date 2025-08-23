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
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [headerCompressed, setHeaderCompressed] = useState(false);
  
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced scroll behavior for dynamic header compression
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      const isScrollingNow = Math.abs(currentScrollY - lastScrollY.current) > 2;
      
      if (isScrollingNow) {
        setIsScrolling(true);
        setIsScrollingUp(scrollDirection === 'up');
        
        // Compress headers during active scrolling on mobile
        if (window.innerWidth < 768) {
          setHeaderCompressed(true);
        }
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to reset scrolling state
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          setHeaderCompressed(false);
        }, 150);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle search focus - Enhanced for mobile with auto-scroll
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setHasUserInteracted(true);
    
    // Auto-scroll to top on mobile when search is focused
    if (window.innerWidth < 768) {
      // Smooth scroll to top to bring search bar into view
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Also hide unnecessary UI elements for better search experience
      setShouldHideBottomMenu(true);
      setShouldHideChrome(true);
    }
    
    options.onSearchFocus?.();
  }, [options]);

  // Handle search blur with cleanup - Restore UI on mobile
  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    
    // Restore UI elements on mobile when search loses focus
    if (window.innerWidth < 768) {
      setTimeout(() => {
        // Only restore if search is not focused anymore
        if (!searchInputRef.current?.matches(':focus')) {
          setShouldHideBottomMenu(false);
          setShouldHideChrome(false);
        }
      }, 150);
    }
    
    options.onSearchBlur?.();
  }, [options]);

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
    isScrollingUp,
    headerCompressed,
    searchInputRef,
    handleSearchFocus,
    handleSearchBlur,
    resetInteraction: () => {
      setHasUserInteracted(false);
      setShouldHideChrome(false);
      setShouldHideBottomMenu(false);
      setHeaderCompressed(false);
    }
  };
};