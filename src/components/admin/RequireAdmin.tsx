import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      try {
        // Check if user has a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          console.log('❌ No valid session found');
          setAllowed(false);
          navigate('/affiliate/admin-login', { replace: true });
          return;
        }

        // Check if user is admin
        console.log('🔍 Checking admin access for:', session.user.email);
        
        // Simple admin check - verify user exists in admin_users table
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('id, email, name')
          .eq('email', session.user.email)
          .single();

        if (!mounted) return;

        if (error || !adminData) {
          console.log('❌ Not an admin user:', session.user.email);
          await supabase.auth.signOut();
          setAllowed(false);
          toast({
            title: "Access Denied",
            description: "Your account does not have admin privileges.",
            variant: "destructive",
          });
          navigate('/affiliate/admin-login', { replace: true });
          return;
        }

        console.log('✅ Admin access granted for:', session.user.email);
        setAllowed(true);

      } catch (error) {
        console.error('❌ Admin check error:', error);
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔍 Auth state change:', event);

      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, checking admin access');
        checkAdminAccess();
      }
    });

    // Initial check
    checkAdminAccess();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Show loading while checking
  if (allowed === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // If not allowed, don't render anything (redirect will happen)
  if (!allowed) return null;

  // If allowed, render the admin content
  return <>{children}</>;
};

export default RequireAdmin;