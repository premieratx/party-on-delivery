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
      style.id = 'mobile-input-fixes';
      style.textContent = `
        input, textarea, select {
          font-size: 16px !important;
          -webkit-user-select: text !important;
          user-select: text !important;
          -webkit-touch-callout: default !important;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
          touch-action: manipulation !important;
          pointer-events: auto !important;
          z-index: 1 !important;
          position: relative !important;
          background-color: transparent;
          -webkit-appearance: none;
          appearance: none;
        }
        
        /* CRITICAL: Override ALL potential conflicts */
        .checkout-form input,
        .checkout-form textarea,
        .checkout-form select,
        [data-checkout-form] input,
        [data-checkout-form] textarea,
        [data-checkout-form] select {
          /* Force interactivity */
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          touch-action: manipulation !important;
          
          /* Prevent any transforms that break input */
          transform: none !important;
          will-change: auto !important;
          
          /* Ensure proper layering */
          z-index: 1000 !important;
        }
        
        /* CRITICAL: Container fixes to prevent input blocking */
        .checkout-form .space-y-3,
        .checkout-form .space-y-4,
        .checkout-form .grid,
        .checkout-form .flex,
        .checkout-form .relative {
          /* Ensure containers NEVER block inputs */
          pointer-events: none !important;
        }
        
        .checkout-form .space-y-3 > *,
        .checkout-form .space-y-4 > *,
        .checkout-form .grid > *,
        .checkout-form .flex > *,
        .checkout-form .relative > * {
          /* Force re-enable for ALL children */
          pointer-events: auto !important;
          z-index: 10 !important;
        }
        
        /* CRITICAL: Button and label overrides */
        .checkout-form button,
        .checkout-form label,
        .checkout-form [role="button"] {
          pointer-events: auto !important;
          z-index: 100 !important;
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

    // CRITICAL: Enhanced input accessibility (NO cloning to preserve React handlers)
    const enhanceInputAccessibility = () => {
      const allInputs = document.querySelectorAll('input, textarea, select');
      
      allInputs.forEach((input) => {
        const element = input as HTMLElement;
        
        // Ensure input is always interactive
        element.style.pointerEvents = 'auto';
        element.style.touchAction = 'manipulation';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        
        // Remove any readonly attributes that might block interaction
        element.removeAttribute('readonly');
        (element as HTMLInputElement).readOnly = false;
        
        console.log('✅ Input enhanced for accessibility:', element.getAttribute('placeholder') || element.tagName);
      });
    };

    // Apply enhanced accessibility
    setTimeout(enhanceInputAccessibility, 100);
    
    // Re-apply enhancements when new elements are added
    const observer = new MutationObserver(() => {
      setTimeout(enhanceInputAccessibility, 50);
    });
    
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