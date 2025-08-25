import { useState, useEffect, useRef, useCallback } from 'react';

interface StickySearchOptions {
  threshold?: number;
  hideKeyboardOnScroll?: boolean;
}

export function useStickySearchHeader(options: StickySearchOptions = {}) {
  const { threshold = 50, hideKeyboardOnScroll = true } = options;
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);

  const hideKeyboard = useCallback(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Determine scroll direction
      isScrollingDown.current = currentScrollY > lastScrollY.current;
      lastScrollY.current = currentScrollY;

      // Make header sticky when scrolled past threshold
      const shouldBeSticky = currentScrollY > threshold;
      setIsSticky(shouldBeSticky);

      // Hide keyboard when scrolling during active search on mobile
      if (hideKeyboardOnScroll && isSearchActive && Math.abs(currentScrollY - lastScrollY.current) > 10) {
        hideKeyboard();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, isSearchActive, hideKeyboardOnScroll, hideKeyboard]);

  const activateSearch = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const deactivateSearch = useCallback(() => {
    setIsSearchActive(false);
    hideKeyboard();
  }, [hideKeyboard]);

  return {
    isSticky,
    isSearchActive,
    scrollY,
    searchInputRef,
    activateSearch,
    deactivateSearch,
    hideKeyboard
  };
}