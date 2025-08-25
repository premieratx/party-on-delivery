import { useEffect } from 'react';

/**
 * Enhanced keyboard management for mobile devices
 * Provides immediate keyboard hiding on scroll or touch events
 */
export function useImmediateKeyboardHiding() {
  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;
    
    const hideKeyboardImmediately = () => {
      if (!isMobile()) return;
      
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        (activeEl as HTMLElement).blur();
        
        // Force viewport reset to prevent layout shifts
        setTimeout(() => {
          window.scrollTo({ top: window.scrollY, behavior: 'instant' });
        }, 10);
      }
    };

    let startY = 0;
    
    // Hide keyboard on ANY touch movement that's a scroll gesture
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = Math.abs(e.touches[0].clientY - startY);
      if (deltaY > 10) { // 10px threshold for scroll detection
        hideKeyboardImmediately();
      }
    };

    // Hide keyboard on scroll (immediate)
    const handleScroll = () => {
      hideKeyboardImmediately();
    };

    // Hide keyboard when touching outside input areas
    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('input, textarea, [role="searchbox"]')) {
        hideKeyboardImmediately();
      }
    };

    if (isMobile()) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  return {
    hideKeyboard: () => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        (activeEl as HTMLElement).blur();
      }
    }
  };
}