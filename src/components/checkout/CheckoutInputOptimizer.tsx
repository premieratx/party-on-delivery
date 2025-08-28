import React from 'react';

export const CheckoutInputOptimizer = () => {
  React.useEffect(() => {
    console.log('🚀 UNIVERSAL INPUT OPTIMIZER - ACTIVE ON ALL PAGES');
    
    const universalInputEnabler = () => {
      // Get ALL form elements on the page
      const allInputs = document.querySelectorAll('input, textarea, select, button[type="submit"]');
      
      allInputs.forEach(input => {
        const element = input as HTMLInputElement;
        
        // Force enable everything
        element.disabled = false;
        element.readOnly = false;
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.removeAttribute('data-disabled');
        
        // Force interaction styles
        element.style.pointerEvents = 'auto';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        element.style.cursor = 'text';
        element.style.touchAction = 'manipulation';
        element.style.opacity = '1';
        
        // Remove any aria-disabled attributes
        element.removeAttribute('aria-disabled');
        
        // Force focus capability
        if (element.tabIndex === -1) {
          element.tabIndex = 0;
        }
      });
      
      // Also check for any disabled parent containers
      document.querySelectorAll('[data-disabled="true"], .disabled, [disabled]').forEach(container => {
        const element = container as HTMLElement;
        element.removeAttribute('data-disabled');
        element.removeAttribute('disabled');
        element.classList.remove('disabled');
      });
    };

    // Run immediately
    universalInputEnabler();
    
    // Run on all DOM changes
    const observer = new MutationObserver(universalInputEnabler);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'data-disabled', 'aria-disabled']
    });

    // Also run on focus events to catch any dynamic disabling
    document.addEventListener('focusin', universalInputEnabler);
    document.addEventListener('click', universalInputEnabler);

    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', universalInputEnabler);
      document.removeEventListener('click', universalInputEnabler);
    };
  }, []);

  return null;
};