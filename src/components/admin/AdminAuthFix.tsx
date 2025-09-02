import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component to ensure admin context is properly set for all admin operations
 * This fixes the RLS policy issues preventing saves
 */
export const AdminAuthFix = () => {
  useEffect(() => {
    const setAdminContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          // Verify admin status and set context
          const { data, error } = await supabase.functions.invoke('verify-admin-google', {
            body: { email: user.email }
          });
          
          if (data?.isAdmin) {
            // Admin context is already set by the edge function
            console.log('✅ Admin context maintained for:', user.email);
          }
        }
      } catch (error) {
        console.warn('Admin context setup failed:', error);
      }
    };

    // Set context on mount - DISABLED PERIODIC REFRESH TO PREVENT PAGE RELOADING
    setAdminContext();
    // const interval = setInterval(setAdminContext, 5 * 60 * 1000); // Every 5 minutes - DISABLED

    // return () => clearInterval(interval); // DISABLED
  }, []);

  return null; // This component doesn't render anything
};