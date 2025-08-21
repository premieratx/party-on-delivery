import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * COLD START SOLUTION - This prevents edge functions from going cold
 * 
 * The main issue you've been experiencing is that Supabase edge functions 
 * go "cold" when not used, causing failures and loss of functionality.
 * 
 * This component:
 * 1. Keeps critical functions warm by calling them periodically
 * 2. Runs in the background automatically
 * 3. Ensures admin functionality stays reliable
 */

let keepAliveInterval: NodeJS.Timeout | null = null;

export const ColdStartSolution = () => {
  useEffect(() => {
    const keepFunctionsWarm = async () => {
      try {
        // Only call keep-warm in production to prevent development CORS issues
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          await supabase.functions.invoke('keep-functions-warm', {
            body: { source: 'frontend-keepalive' }
          });
        }
      } catch (error) {
        // Completely silent - no logging at all
      }
    };

    // Only run in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Initial warm-up
      keepFunctionsWarm();
      
      // Set up interval - every 15 minutes (further reduced frequency)
      keepAliveInterval = setInterval(keepFunctionsWarm, 15 * 60 * 1000);
    }

    // Cleanup function
    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ColdStartSolution;
