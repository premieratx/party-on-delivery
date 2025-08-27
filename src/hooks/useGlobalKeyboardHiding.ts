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

    // Simplified - only hide keyboard on user interaction, not scroll
    const handleTouchStart = () => {
      if (!isMobile()) return;
      
      // Small delay to allow natural scroll behavior
      setTimeout(() => {
        hideKeyboard();
      }, 150);
    };

    // Only listen to touch start to avoid scroll conflicts
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
}