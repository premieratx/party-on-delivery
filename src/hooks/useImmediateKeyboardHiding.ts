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

    // Hide keyboard on ANY touch movement
    const handleTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - (e.target as any).initialY) > 5) {
        hideKeyboardImmediately();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      (e.target as any).initialY = e.touches[0].clientY;
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