import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Add admin context fix to all delivery app creators in bulk
 */
export const useAdminContextFix = () => {
  const setAdminContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error: contextError } = await supabase.rpc('set_admin_context', {
          admin_email: user.email
        });
        if (contextError) {
          console.warn('Failed to set admin context:', contextError);
        } else {
          console.log('✅ Admin context set for save operation:', user.email);
        }
      }
    } catch (error) {
      console.warn('Admin context setup failed:', error);
    }
  };

  useEffect(() => {
    // Set context on component mount
    setAdminContext();
  }, []);

  return { setAdminContext };
};