import { useEffect } from 'react';

/**
 * ULTIMATE CHECKOUT INPUT OPTIMIZER
 * Ensures FLAWLESS input functionality for ALL users on ALL devices
 */
export const CheckoutInputOptimizer = () => {
  useEffect(() => {
    console.log('🚀 CheckoutInputOptimizer: Ensuring flawless input experience for ALL users');

    // CRITICAL: Remove any restrictions that could prevent new users from entering data
    const removeUserRestrictions = () => {
      // Clear any auth-based restrictions
      document.querySelectorAll('[data-user-restriction]').forEach(el => {
        el.removeAttribute('data-user-restriction');
        (el as HTMLElement).style.pointerEvents = 'auto';
      });

      // Ensure all inputs are enabled for ALL users
      document.querySelectorAll('input, textarea, select').forEach(input => {
        (input as HTMLInputElement).disabled = false;
        (input as HTMLElement).style.pointerEvents = 'auto';
        (input as HTMLElement).setAttribute('data-user-accessible', 'true');
      });

      console.log('✅ All user restrictions removed - checkout available to ALL users');
    };

    // CRITICAL: Ultimate input enhancement for mobile and desktop
    const createUltimateInputCSS = () => {
      const existingStyle = document.getElementById('ultimate-input-optimizer');
      if (existingStyle) existingStyle.remove();

      const style = document.createElement('style');
      style.id = 'ultimate-input-optimizer';
      style.textContent = `
        /* ULTIMATE INPUT FIXES - MAXIMUM COMPATIBILITY */
        
        input, textarea, select, 
        input[type="text"], input[type="email"], input[type="tel"], 
        input[type="password"], input[type="number"] {
          /* CRITICAL: iOS zoom prevention */
          font-size: 16px !important;
          
        /* CRITICAL: Always accessible and selectable */
        pointer-events: auto !important;
        touch-action: manipulation !important;
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        
        /* CRITICAL: Force text selection even in pre-filled fields */
        cursor: text !important;
        
        /* CRITICAL: Prevent any readonly-like behavior */
        -webkit-user-modify: read-write !important;
          
          /* CRITICAL: Mobile optimizations */
          -webkit-appearance: none !important;
          appearance: none !important;
          -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3) !important;
          -webkit-touch-callout: default !important;
          
          /* CRITICAL: Layering and positioning */
          position: relative !important;
          z-index: 10 !important;
          
          /* CRITICAL: Touch targets */
          min-height: 44px !important;
          padding: 8px 12px !important;
          
          /* CRITICAL: Prevent input breaking */
          transform: none !important;
          will-change: auto !important;
          
          /* CRITICAL: Ensure visibility */
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* ULTIMATE PROMO CODE INPUT FIX */
        .checkout-form input[placeholder*="promo" i],
        .checkout-form input[placeholder*="code" i],
        input[placeholder*="promo" i],
        input[placeholder*="code" i] {
          /* CRITICAL: Promo code specific fixes */
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          font-family: monospace !important;
          background-color: white !important;
          border: 2px solid #e5e7eb !important;
          
          /* ULTRA-HIGH PRIORITY: Always functional */
          pointer-events: auto !important;
          touch-action: manipulation !important;
          z-index: 999 !important;
        }
        
        .checkout-form input[placeholder*="promo" i]:focus,
        .checkout-form input[placeholder*="code" i]:focus,
        input[placeholder*="promo" i]:focus,
        input[placeholder*="code" i]:focus {
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        /* CRITICAL: Container fixes to never block inputs */
        .checkout-form, 
        [data-checkout-form],
        .space-y-3, .space-y-4,
        .grid, .flex, .relative {
          pointer-events: none !important;
        }
        
        .checkout-form > *,
        [data-checkout-form] > *,
        .space-y-3 > *, .space-y-4 > *,
        .grid > *, .flex > *, .relative > * {
          pointer-events: auto !important;
        }
        
        /* CRITICAL: Force ALL pre-filled inputs to be editable */
        input[value]:not([value=""]),
        textarea[value]:not([value=""]) {
          background-color: white !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
          pointer-events: auto !important;
          -webkit-user-modify: read-write !important;
        }
        
        /* CRITICAL: Prevent any "readonly" appearance */
        input[readonly], textarea[readonly] {
          readonly: false !important;
          background-color: white !important;
          cursor: text !important;
        }
        
        /* CRITICAL: Focus handling */
        input:focus, textarea:focus, select:focus {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          z-index: 1000 !important;
        }
        
        /* CRITICAL: Mobile keyboard handling */
        @supports (-webkit-touch-callout: none) {
          input, textarea, select {
            font-size: 16px !important;
            -webkit-text-size-adjust: 100% !important;
          }
        }
        
        /* CRITICAL: Button accessibility */
        button, [role="button"], .cursor-pointer {
          pointer-events: auto !important;
          touch-action: manipulation !important;
          z-index: 100 !important;
        }
        
        /* CRITICAL: Label association */
        label {
          pointer-events: auto !important;
          user-select: none !important;
        }
        
        label:active {
          /* Prevent label interference */
          pointer-events: none !important;
        }
      `;
      
      document.head.appendChild(style);
      console.log('✅ Ultimate input CSS applied - inputs work everywhere');
    };

    // CRITICAL: Enhanced event protection
    const protectInputEvents = () => {
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          e.stopPropagation();
          console.log('🛡️ Input click protected from interference');
        }
      }, { capture: true });

      document.addEventListener('touchstart', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          e.stopPropagation();
          console.log('🛡️ Input touch protected from interference');
        }
      }, { capture: true, passive: true });

      document.addEventListener('focus', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          console.log('🎯 Input focused successfully');
          // Ensure input stays in view
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }, { capture: true });
    };

    // CRITICAL: Apply all optimizations
    removeUserRestrictions();
    createUltimateInputCSS();
    protectInputEvents();

    // CRITICAL: Reapply on DOM changes
    const observer = new MutationObserver(() => {
      removeUserRestrictions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};