import React from 'react';

export const CheckoutInputOptimizer = () => {
  // Remove ALL restrictions and confirmation logic
  // Checkout inputs work for everyone, always
  
  React.useEffect(() => {
    console.log('✅ Universal checkout access enabled');
    
    // Simple function to ensure all inputs work
    const enableAllInputs = () => {
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const element = input as HTMLInputElement;
        element.disabled = false;
        element.readOnly = false;
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.style.pointerEvents = 'auto';
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        element.style.cursor = 'text';
      });
    };

    // Apply immediately and on DOM changes
    enableAllInputs();
    const observer = new MutationObserver(enableAllInputs);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};