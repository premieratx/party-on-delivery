import { useEffect } from 'react';

/**
 * SIMPLE MOBILE INPUT FIX
 * Just makes inputs work on mobile without any complex logic
 */
export const MobileInputFix = () => {
  useEffect(() => {
    console.log('✅ Enabling mobile inputs - no restrictions');
    
    // Simple function to make all inputs work
    const makeInputsWork = () => {
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const element = input as HTMLInputElement;
        element.disabled = false;
        element.readOnly = false;
        element.style.pointerEvents = 'auto';
        element.style.touchAction = 'manipulation';
        element.style.fontSize = '16px';
      });
    };

    makeInputsWork();
    
    // Reapply when DOM changes
    const observer = new MutationObserver(makeInputsWork);
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // CRITICAL: Keyboard handling fix for mobile
    const handleKeyboardShow = () => {
      // When virtual keyboard shows, adjust layout
      const handleResize = () => {
        const viewport = window.visualViewport;
        if (viewport) {
          document.documentElement.style.setProperty('--keyboard-height', `${viewport.height}px`);
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        return () => window.visualViewport?.removeEventListener('resize', handleResize);
      }
    };

    const keyboardCleanup = handleKeyboardShow();

    return () => {
      if (keyboardCleanup) keyboardCleanup();
    };
  }, []);

  return null;
};