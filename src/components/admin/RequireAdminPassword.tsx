import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AdminSessionManager } from '@/utils/sessionPersistence';
import { supabase } from '@/integrations/supabase/client';

interface RequireAdminPasswordProps {
  children: React.ReactNode;
}

export const RequireAdminPassword: React.FC<RequireAdminPasswordProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if admin session is valid
        const isValidSession = AdminSessionManager.isAdminSessionValid();
        
        if (!isValidSession) {
          console.log('No valid admin session, redirecting to login');
          navigate('/admin/password-login', { replace: true });
          return;
        }

        const session = AdminSessionManager.getAdminSession();
        if (session?.email) {
          // Verify admin status with edge function
          const { data, error } = await supabase.functions.invoke('verify-admin-google', {
            body: { email: session.email }
          });

          if (error || !data?.isAdmin) {
            console.log('Admin verification failed, clearing session');
            AdminSessionManager.clearAdminSession();
            navigate('/admin/password-login', { replace: true });
            return;
          }

          console.log('✅ Admin access verified for:', session.email);
          setIsAuthorized(true);
        } else {
          navigate('/admin/password-login', { replace: true });
        }
      } catch (error) {
        console.error('Admin access check failed:', error);
        AdminSessionManager.clearAdminSession();
        navigate('/admin/password-login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};