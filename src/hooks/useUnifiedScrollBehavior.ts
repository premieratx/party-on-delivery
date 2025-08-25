import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollBehaviorOptions {
  hideKeyboardOnScroll?: boolean;
  mobileSticky?: 'search' | 'tabs' | 'auto'; // Only one sticky on mobile
  desktopSticky?: boolean; // Both sticky on desktop
  threshold?: number;
}

/**
 * UNIFIED SCROLL BEHAVIOR RULES:
 * 
 * MOBILE:
 * - Hide keyboard when scrolling down
 * - Only ONE sticky element: either search OR tabs (not both)
 * - Auto-switch: if search is active, make search sticky; otherwise tabs sticky
 * - Condensed layout when scrolling
 * 
 * DESKTOP:
 * - Both search and tabs can be sticky simultaneously
 * - No keyboard hiding needed
 * - Full layout maintained
 * 
 * PRIORITIES:
 * 1. Mobile UX: Prevent double-sticky overlap
 * 2. Search priority: When searching, search bar gets priority
 * 3. Keyboard management: Hide on scroll for better mobile experience
 */

export function useUnifiedScrollBehavior(options: ScrollBehaviorOptions = {}) {
  const {
    hideKeyboardOnScroll = true,
    mobileSticky = 'auto',
    desktopSticky = true,
    threshold = 50
  } = options;

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeElement, setActiveElement] = useState<'search' | 'tabs' | null>(null);
  
  const lastScrollYRef = useRef(0);
  const ticking = useRef(false);

  // Detect mobile vs desktop
  const isMobile = useCallback(() => {
    return window.innerWidth < 768; // md breakpoint
  }, []);

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollYRef.current ? 'down' : 'up';
        
        setScrollY(currentScrollY);
        setIsScrollingDown(scrollDirection === 'down' && currentScrollY > threshold);
        
        // Hide keyboard on mobile when scrolling down
        if (hideKeyboardOnScroll && isMobile() && scrollDirection === 'down') {
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            (activeEl as HTMLElement).blur();
            setKeyboardVisible(false);
          }
        }
        
        lastScrollYRef.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [hideKeyboardOnScroll, threshold, isMobile]);

  // Track keyboard visibility
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setKeyboardVisible(true);
        
        // Determine active element for mobile sticky priority
        if (e.target.placeholder?.toLowerCase().includes('search')) {
          setActiveElement('search');
        }
      }
    };

    const handleBlur = () => {
      setKeyboardVisible(false);
      // Reset active element when no inputs are focused
      setTimeout(() => {
        const focusedInput = document.querySelector('input:focus, textarea:focus');
        if (!focusedInput) {
          setActiveElement(null);
        }
      }, 100);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Setup scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Determine sticky behavior based on device and options
  const getStickyBehavior = useCallback(() => {
    const mobile = isMobile();
    
    if (mobile) {
      // MOBILE: Only one sticky element
      switch (mobileSticky) {
        case 'search':
          return { searchSticky: true, tabsSticky: false };
        case 'tabs':
          return { searchSticky: false, tabsSticky: true };
        case 'auto':
        default:
          // Auto-switch based on active element
          if (activeElement === 'search' || keyboardVisible) {
            return { searchSticky: true, tabsSticky: false };
          } else {
            return { searchSticky: false, tabsSticky: true };
          }
      }
    } else {
      // DESKTOP: Both can be sticky
      return { 
        searchSticky: desktopSticky, 
        tabsSticky: desktopSticky 
      };
    }
  }, [mobileSticky, desktopSticky, activeElement, keyboardVisible, isMobile]);

  // Get condensed layout for mobile
  const shouldCondense = useCallback(() => {
    return isMobile() && (isScrollingDown || scrollY > threshold);
  }, [isMobile, isScrollingDown, scrollY, threshold]);

  return {
    isScrollingDown,
    scrollY,
    keyboardVisible,
    activeElement,
    getStickyBehavior,
    shouldCondense,
    isMobile: isMobile(),
    
    // Helper methods
    hideKeyboard: () => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        (activeEl as HTMLElement).blur();
      }
    },
    
    setActiveElement,
    
    // CSS classes helper
    getScrollClasses: (element: 'search' | 'tabs') => {
      const { searchSticky, tabsSticky } = getStickyBehavior();
      const condensed = shouldCondense();
      const sticky = element === 'search' ? searchSticky : tabsSticky;
      
      return {
        sticky: sticky && scrollY > threshold,
        condensed,
        hidden: isScrollingDown && !sticky && isMobile(),
        priority: element === activeElement
      };
    }
  };
}