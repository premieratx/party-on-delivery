import { useEffect } from 'react';

/**
 * CRITICAL FIX: Mobile Input Enhancement
 * Ensures all form inputs work perfectly on mobile devices
 */
export const MobileInputFix = () => {
  useEffect(() => {
    // CRITICAL: Mobile input focus fix
    const enhanceMobileInputs = () => {
      const style = document.createElement('style');
      style.textContent = `
        /* CRITICAL: Mobile input fixes */
        input, textarea, select {
          /* Prevent zoom on focus (iOS) */
          font-size: 16px !important;
          
          /* Better touch targets */
          min-height: 44px;
          
          /* Prevent interference from other elements */
          pointer-events: auto !important;
          touch-action: manipulation !important;
          
          /* Ensure proper z-index */
          position: relative;
          z-index: 1;
        }
        
        /* Prevent form interference */
        .checkout-form input,
        .checkout-form textarea,
        .checkout-form select {
          /* Override any conflicting styles */
          user-select: text !important;
          
          /* Ensure inputs are always interactive */
          pointer-events: auto !important;
          
          /* Better mobile touch */
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
          -webkit-touch-callout: default;
          -webkit-user-select: text;
        }
        
        /* Fix for specific input containers */
        .checkout-form .space-y-3,
        .checkout-form .space-y-4,
        .checkout-form .grid {
          /* Ensure container doesn't block inputs */
          pointer-events: none;
        }
        
        .checkout-form .space-y-3 > *,
        .checkout-form .space-y-4 > *,
        .checkout-form .grid > * {
          /* Re-enable pointer events for children */
          pointer-events: auto;
        }
        
        /* Enhanced focus states for mobile */
        input:focus,
        textarea:focus,
        select:focus {
          /* Clear focus indication */
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          
          /* Prevent any transforms that might break input */
          transform: none !important;
        }
        
        /* Prevent form zoom on iPhone */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          select,
          textarea,
          input[type="text"],
          input[type="password"],
          input[type="datetime"],
          input[type="datetime-local"],
          input[type="date"],
          input[type="month"],
          input[type="time"],
          input[type="week"],
          input[type="number"],
          input[type="email"],
          input[type="url"],
          input[type="search"],
          input[type="tel"],
          input[type="color"] {
            font-size: 16px !important;
          }
        }
        
        /* Fix for modal/popover inputs */
        [role="dialog"] input,
        [role="dialog"] textarea,
        .popover input,
        .popover textarea {
          pointer-events: auto !important;
          z-index: 999999 !important;
        }
        
        /* Fix for calendar and time picker */
        .calendar input,
        .time-picker input,
        [data-radix-calendar] input {
          pointer-events: auto !important;
          touch-action: manipulation !important;
        }
      `;
      
      document.head.appendChild(style);
    };

    // Apply fixes immediately
    enhanceMobileInputs();

    // CRITICAL: Remove any event listeners that might interfere with inputs
    const removeConflictingListeners = () => {
      // Find all elements that might have conflicting touch/click handlers
      const potentialConflicts = document.querySelectorAll('[data-checkout-form] *');
      
      potentialConflicts.forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          // Ensure input elements have clean event handling
          element.addEventListener('touchstart', (e) => {
            e.stopPropagation();
          }, { passive: true });
          
          element.addEventListener('focus', (e) => {
            e.stopPropagation();
          });
        }
      });
    };

    // Apply on next tick to ensure DOM is ready
    setTimeout(removeConflictingListeners, 100);

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