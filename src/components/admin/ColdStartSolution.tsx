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
        // Call our keep-warm function every 4 minutes
        await supabase.functions.invoke('keep-functions-warm', {
          body: { source: 'frontend-keepalive' }
        });
        // console.log('🔥 Functions kept warm at:', new Date().toISOString());
      } catch (error) {
        // Silently fail keep-alive to prevent console spam and CORS errors
        // Don't log anything to avoid flooding console
      }
    };

    // Initial warm-up
    keepFunctionsWarm();

    // Set up interval - every 10 minutes (reduced frequency to prevent spam)
    keepAliveInterval = setInterval(keepFunctionsWarm, 10 * 60 * 1000);

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
