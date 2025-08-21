import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track and link session IDs with user accounts after login
 */
export const useSessionTracking = () => {
  
  const linkSessionToUser = async (userEmail: string) => {
    try {
      // Skip session linking in admin contexts to avoid unnecessary processing
      const isAdminContext = window.location.pathname.includes('/admin') || 
                            userEmail === 'brian@partyondelivery.com' ||
                            localStorage.getItem('adminSession');
      
      if (isAdminContext) {
        return; // Skip session linking for admin users
      }

      // Get valid session IDs from localStorage - be more selective
      const sessionKeys = new Set<string>(); // Use Set to avoid duplicates
      
      // Only get specific session-related items
      const storedSessionId = localStorage.getItem('lastOrderSessionId');
      const storedPaymentIntent = localStorage.getItem('lastPaymentIntent');
      
      // Also check for current session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const currentSessionId = urlParams.get('session_id');
      
      // Add valid session identifiers only
      if (storedSessionId && (storedSessionId.startsWith('cs_') || storedSessionId.startsWith('pi_'))) {
        sessionKeys.add(storedSessionId);
      }
      
      if (storedPaymentIntent && (storedPaymentIntent.startsWith('cs_') || storedPaymentIntent.startsWith('pi_'))) {
        sessionKeys.add(storedPaymentIntent);
      }
      
      if (currentSessionId && (currentSessionId.startsWith('cs_') || currentSessionId.startsWith('pi_'))) {
        sessionKeys.add(currentSessionId);
      }

      // Get any Stripe session IDs and payment intent IDs from localStorage values (not keys)
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        const value = localStorage.getItem(key);
        if (value && typeof value === 'string' && value.length < 200) { // Avoid JSON objects and long strings
          if (value.startsWith('cs_') || value.startsWith('pi_')) { // Stripe session IDs and payment intent IDs
            sessionKeys.add(value);
          }
        }
      }

      // Only process if we have valid session tokens and we're in a customer context
      if (sessionKeys.size === 0) {
        // Don't log in admin contexts to avoid console spam
        const isAdminContext = window.location.pathname.includes('/admin') || 
                              userEmail === 'brian@partyondelivery.com' ||
                              localStorage.getItem('adminSession');
        
        if (!isAdminContext) {
          console.log('No valid session tokens found to link');
        }
        return;
      }

      // Link each session to the user with better error handling
      const successfulLinks = [];
      const failedLinks = [];
      
      for (const sessionKey of Array.from(sessionKeys)) {
        if (sessionKey && sessionKey.trim() && sessionKey.length > 10) { // Basic validation
          try {
            const { error } = await supabase.rpc('link_customer_session', {
              customer_email: userEmail,
              session_token: sessionKey.trim()
            });
            
            if (error) {
              console.error('RPC error linking session:', sessionKey, error);
              failedLinks.push(sessionKey);
            } else {
              successfulLinks.push(sessionKey);
            }
          } catch (rpcError) {
            console.error('Failed to link session token:', sessionKey, rpcError);
            failedLinks.push(sessionKey);
          }
        }
      }

      console.log('Linked session tokens to user:', userEmail, successfulLinks);
      if (failedLinks.length > 0) {
        console.warn('Failed to link some sessions:', failedLinks);
      }
    } catch (error) {
      console.error('Error linking sessions to user:', error);
    }
  };

  const storeSessionId = (sessionId: string) => {
    localStorage.setItem('lastOrderSessionId', sessionId);
    console.log('🔥 SESSION TRACKING: Stored session ID:', sessionId);
  };

  const storePaymentIntent = (paymentIntentId: string) => {
    localStorage.setItem('lastPaymentIntent', paymentIntentId);
    console.log('🔥 SESSION TRACKING: Stored payment intent:', paymentIntentId);
  };

  const storeCartTotal = (total: number) => {
    localStorage.setItem('lastCartTotal', total.toString());
    console.log('🔥 SESSION TRACKING: Stored cart total:', total);
  };

  return {
    linkSessionToUser,
    storeSessionId,
    storePaymentIntent,
    storeCartTotal
  };
};