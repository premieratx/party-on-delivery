import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [adminContextSet, setAdminContextSet] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        // Ensure listener is set up first to avoid missed events
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          // If returning from OAuth, Supabase will exchange the code for a session asynchronously.
          const hasAuthParams = window.location.search.includes('code=') || window.location.search.includes('state=') || window.location.hash.includes('access_token');
          if (hasAuthParams) {
            setAllowed(null); // wait for auth to settle
            return;
          }
          setAllowed(false);
          if (window.location.pathname !== '/affiliate/admin-login') {
            navigate('/affiliate/admin-login', { replace: true });
          }
          return;
        }

        // Verify admin via edge function (same as AdminLogin)
        console.log('🔍 DEBUG: Verifying admin with email:', session.user.email);
        const { data, error } = await supabase.functions.invoke('verify-admin-google', {
          body: { email: session.user.email }
        });
        
        console.log('🔍 DEBUG: Admin verification response:', { data, error });
        if (error) {
          console.error('verify-admin-google error:', error);
        }

        if (data?.isAdmin) {
          console.log('✅ Admin verified and context set');
          setAdminContextSet(true);
          setAllowed(true);
        } else {
          await supabase.auth.signOut();
          setAllowed(false);
          toast({ title: 'Access denied', description: "Your account isn't authorized for admin.", variant: 'destructive' });
          navigate('/affiliate/admin-login', { replace: true });
        }
      } catch (e) {
        console.error('Admin guard error:', e);
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      }
    };

    // Set up auth state listener to react to login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setAdminContextSet(false);
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      } else {
        // Reset context state and re-check admin on sign-in
        setAdminContextSet(false);
        setTimeout(() => {
          check();
        }, 0);
      }
    });

    check();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (allowed === null || !adminContextSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
};

export default RequireAdmin;
