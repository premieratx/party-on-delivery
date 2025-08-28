import { useEffect } from 'react';

/**
 * SIMPLE CHECKOUT INPUT ENABLER
 * Makes all inputs work without any restrictions
 */
export const CheckoutInputOptimizer = () => {
  useEffect(() => {
    console.log('✅ Making all checkout inputs work for everyone');

    // Simply make all inputs work
    const enableAllInputs = () => {
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const element = input as HTMLInputElement;
        element.disabled = false;
        element.readOnly = false;
        element.removeAttribute('data-user-restriction');
        element.style.pointerEvents = 'auto';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
      });
    };

    // Simple CSS to make inputs work
    const addSimpleInputCSS = () => {
      const style = document.createElement('style');
      style.id = 'simple-input-css';
      style.textContent = `
        /* Make all inputs work without restrictions */
        input, textarea, select {
          font-size: 16px !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
          background-color: white !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Promo code inputs */
        input[placeholder*="promo" i],
        input[placeholder*="code" i] {
          text-transform: uppercase !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
        }
        
        /* All containers allow interaction */
        .checkout-form, 
        [data-checkout-form],
        .space-y-3, .space-y-4,
        .grid, .flex, .relative {
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Apply fixes
    enableAllInputs();
    addSimpleInputCSS();

    // Reapply when DOM changes
    const observer = new MutationObserver(enableAllInputs);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};