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

    // More conservative approach - only hide keyboard on document tap, not input touches
    const handleDocumentTap = (event: TouchEvent) => {
      if (!isMobile()) return;
      
      // Don't hide keyboard if user is touching an input, textarea, or editable element
      const target = event.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.closest('input, textarea, [contenteditable="true"]')
      )) {
        return; // Allow normal keyboard behavior for form inputs
      }
      
      // Hide keyboard when tapping outside form elements
      setTimeout(() => {
        hideKeyboard();
      }, 100);
    };

    // Only listen to touchstart on document, but be smart about inputs
    document.addEventListener('touchstart', handleDocumentTap, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleDocumentTap);
    };
  }, []);
}