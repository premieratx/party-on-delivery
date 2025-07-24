import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track and link session IDs with user accounts after login
 */
export const useSessionTracking = () => {
  
  const linkSessionToUser = async (userEmail: string) => {
    try {
      // Get all session IDs from localStorage that might need linking
      const sessionKeys = new Set<string>(); // Use Set to avoid duplicates
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('session_') || key?.includes('checkout_') || key?.includes('order_')) {
          sessionKeys.add(localStorage.getItem(key) || key);
        }
      }

      // Also check for current session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const currentSessionId = urlParams.get('session_id');
      if (currentSessionId) {
        sessionKeys.add(currentSessionId);
      }

      // Check for stored order session IDs
      const storedSessionId = localStorage.getItem('lastOrderSessionId');
      if (storedSessionId) {
        sessionKeys.add(storedSessionId);
      }

      // Check for stored payment intent IDs
      const storedPaymentIntent = localStorage.getItem('lastPaymentIntent');
      if (storedPaymentIntent) {
        sessionKeys.add(storedPaymentIntent);
      }

      // Get any existing stripe session IDs and payment intent IDs from recent localStorage entries
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        const value = localStorage.getItem(key);
        if (value && (value.startsWith('cs_') || value.startsWith('pi_'))) { // Stripe session IDs and payment intent IDs
          sessionKeys.add(value);
        }
      }

      // Link each session to the user
      for (const sessionKey of Array.from(sessionKeys)) {
        if (sessionKey && sessionKey.trim()) {
          await supabase.rpc('link_customer_session', {
            customer_email: userEmail,
            session_token: sessionKey.trim()
          });
        }
      }

      console.log('Linked session tokens to user:', userEmail, Array.from(sessionKeys));
    } catch (error) {
      console.error('Error linking sessions to user:', error);
    }
  };

  const storeSessionId = (sessionId: string) => {
    localStorage.setItem('lastOrderSessionId', sessionId);
  };

  return {
    linkSessionToUser,
    storeSessionId
  };
};