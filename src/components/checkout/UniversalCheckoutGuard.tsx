import React, { useEffect } from 'react';

/**
 * Universal Checkout Guard - Prevents checkout lockout issues
 * 
 * This component ensures that:
 * 1. NO confirmation states ever lock users out of editing
 * 2. ALL checkout inputs remain editable always
 * 3. ALL delivery apps use the same unrestricted checkout flow
 * 4. New delivery apps automatically get unrestricted checkout
 */
export const UniversalCheckoutGuard = () => {
  useEffect(() => {
    console.log('🛡️ UNIVERSAL CHECKOUT GUARD ACTIVE');
    
    // Monitor for any confirmation logic trying to lock inputs
    const preventCheckoutLockout = () => {
      // Force all form elements to remain editable
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const element = input as HTMLInputElement;
        
        // Remove any lockout mechanisms
        if (element.disabled && !element.type?.includes('submit')) {
          console.warn('🚨 PREVENTED INPUT LOCKOUT:', element);
          element.disabled = false;
        }
        
        if (element.readOnly && !element.classList.contains('readonly-by-design')) {
          console.warn('🚨 PREVENTED READONLY LOCKOUT:', element);
          element.readOnly = false;
        }
      });
      
      // Remove any disabled form containers
      document.querySelectorAll('[data-disabled="true"], .checkout-locked').forEach(container => {
        console.warn('🚨 PREVENTED CONTAINER LOCKOUT:', container);
        container.removeAttribute('data-disabled');
        container.classList.remove('checkout-locked');
      });
    };

    // Run checks continuously
    const interval = setInterval(preventCheckoutLockout, 1000);
    
    // Monitor DOM changes for new lockout attempts
    const observer = new MutationObserver(preventCheckoutLockout);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'data-disabled', 'class']
    });

    // Initial check
    preventCheckoutLockout();

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Visual indicator that the guard is active
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: '#10B981',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 9999,
        fontWeight: 'bold'
      }}
    >
      🛡️ CHECKOUT GUARD
    </div>
  );
};