import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track and link session IDs with user accounts after login
 */
export const useSessionTracking = () => {
  
  const linkSessionToUser = async (userEmail: string) => {
    try {
      // Get all session IDs from localStorage that might need linking
      const sessionKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('session_') || key?.includes('checkout_') || key?.includes('order_')) {
          sessionKeys.push(key);
        }
      }

      // Also check for current session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const currentSessionId = urlParams.get('session_id');
      if (currentSessionId) {
        sessionKeys.push(currentSessionId);
      }

      // Check for stored order session IDs
      const storedSessionId = localStorage.getItem('lastOrderSessionId');
      if (storedSessionId) {
        sessionKeys.push(storedSessionId);
      }

      // Link each session to the user
      for (const sessionKey of sessionKeys) {
        if (sessionKey) {
          await supabase.rpc('link_customer_session', {
            customer_email: userEmail,
            session_token: sessionKey
          });
        }
      }

      console.log('Linked session tokens to user:', userEmail, sessionKeys);
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