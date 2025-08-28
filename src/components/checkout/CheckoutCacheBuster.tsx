import React, { useEffect } from 'react';

/**
 * Checkout Cache Buster - Clears all problematic cached states
 * Ensures returning users get the fixed checkout experience immediately
 */
export const CheckoutCacheBuster = () => {
  useEffect(() => {
    console.log('🧹 CHECKOUT CACHE BUSTER ACTIVE');
    
    const clearProblematicCache = () => {
      try {
        // CRITICAL: Remove confirmation states from all storage
        const keysToRemove = [
          // Old confirmation state keys
          'partyondelivery_checkout_state',
          'partyondelivery_confirmed_datetime',
          'partyondelivery_confirmed_address', 
          'partyondelivery_confirmed_customer',
          'checkout_confirmed_states',
          'checkout_confirmation_data',
          
          // Any cached checkout flow states that might lock users
          'checkout_flow_state',
          'checkout_step_confirmations',
          'delivery_checkout_confirmations',
          
          // Clear any cached checkout data that might have confirmation flags
          'cached_checkout_data',
          'checkout_session_data'
        ];

        // Remove from localStorage
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            console.log(`🗑️ Removing problematic cache key: ${key}`);
            localStorage.removeItem(key);
          }
        });

        // Remove from sessionStorage
        keysToRemove.forEach(key => {
          if (sessionStorage.getItem(key)) {
            console.log(`🗑️ Removing problematic session key: ${key}`);
            sessionStorage.removeItem(key);
          }
        });

        // Clean up any checkout state that has confirmation flags
        const checkoutStateKey = 'partyondelivery_checkout_state';
        const existingState = localStorage.getItem(checkoutStateKey);
        if (existingState) {
          try {
            const parsed = JSON.parse(existingState);
            if (parsed && (parsed.confirmedDateTime || parsed.confirmedAddress || parsed.confirmedCustomer)) {
              console.log('🗑️ Cleaning confirmation flags from checkout state');
              delete parsed.confirmedDateTime;
              delete parsed.confirmedAddress;
              delete parsed.confirmedCustomer;
              localStorage.setItem(checkoutStateKey, JSON.stringify(parsed));
            }
          } catch (error) {
            console.warn('Failed to clean checkout state:', error);
            localStorage.removeItem(checkoutStateKey);
          }
        }

        console.log('✅ Problematic cache cleared - returning users will get fixed experience');
      } catch (error) {
        console.error('Cache clearing error:', error);
      }
    };

    // Clear immediately on load
    clearProblematicCache();
    
    // Clear periodically to catch any re-caching
    const interval = setInterval(clearProblematicCache, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '50px',
        background: '#EF4444',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 9999,
        fontWeight: 'bold'
      }}
    >
      🧹 CACHE CLEARED
    </div>
  );
};