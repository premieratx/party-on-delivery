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

    const check = async () => {
      try {
        // Ensure listener is set up first to avoid missed events
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          setAllowed(false);
          navigate('/affiliate/admin-login', { replace: true });
          return;
        }

        // Verify admin via secure DB function
        const { data: isAdmin, error } = await supabase.rpc('is_admin_user');
        if (error) {
          console.error('is_admin_user error:', error);
        }

        if (isAdmin) {
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
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      } else {
        // Re-check admin on sign-in
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

  if (allowed === null) {
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
