import { useEffect } from 'react';

/**
 * Global keyboard hiding on mobile scroll
 */
export function useGlobalKeyboardHiding() {
  useEffect(() => {
    const isMobile = () => window.innerWidth <= 768;
    
    const hideKeyboard = () => {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.contentEditable === 'true')) {
        activeEl.blur();
        
        // Additional iOS Safari fix
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          const tempInput = document.createElement('input');
          tempInput.style.position = 'absolute';
          tempInput.style.left = '-9999px';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.focus();
          tempInput.blur();
          document.body.removeChild(tempInput);
        }
      }
    };

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!isMobile()) return;
      
      const currentScrollY = window.scrollY;
      
      // Hide keyboard on any significant scroll movement
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        hideKeyboard();
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestScrollTick = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    // Touch-based scroll detection for mobile
    const handleTouchMove = () => {
      if (isMobile()) {
        requestScrollTick();
      }
    };

    // Regular scroll listener
    window.addEventListener('scroll', requestScrollTick, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestScrollTick);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}