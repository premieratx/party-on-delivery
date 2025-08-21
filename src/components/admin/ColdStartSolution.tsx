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
        console.log('🔥 Functions kept warm at:', new Date().toISOString());
      } catch (error) {
        console.warn('Keep-alive failed, but continuing:', error);
      }
    };

    // Initial warm-up
    keepFunctionsWarm();

    // Set up interval - every 4 minutes (before 5min cold timeout)
    keepAliveInterval = setInterval(keepFunctionsWarm, 4 * 60 * 1000);

    // Also warm up on user activity
    const handleUserActivity = () => {
      keepFunctionsWarm();
    };

    window.addEventListener('focus', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      window.removeEventListener('focus', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ColdStartSolution;
