import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminSessionManager } from '@/utils/sessionPersistence';

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
    let checkInProgress = false;

    const check = async () => {
      if (checkInProgress) {
        console.log('🔍 Admin check already in progress, skipping duplicate');
        return;
      }
      checkInProgress = true;

      try {
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

        // Skip verification if already verified to avoid redundant calls
        if (allowed === true && adminContextSet) {
          console.log('✅ Admin already verified, skipping duplicate check');
          return;
        }

        // Verify admin via edge function (same as AdminLogin) - SINGLE CALL ONLY
        console.log('🔍 DEBUG: Verifying admin with email:', session.user.email);
        const { data, error } = await supabase.functions.invoke('verify-admin-google', {
          body: { email: session.user.email }
        });
        
        console.log('🔍 DEBUG: Admin verification response:', { data, error });
        if (error) {
          console.error('verify-admin-google error:', error);
        }

        if (data?.isAdmin) {
          console.log('✅ Admin verified and context set - PERSISTING SESSION');
          setAdminContextSet(true);
          setAllowed(true);
          
          // Store admin session with enhanced persistence
          AdminSessionManager.setAdminSession(session.user.email || '');
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
      } finally {
        checkInProgress = false;
      }
    };

    // Check if already verified to avoid unnecessary calls
    const isAlreadyVerified = AdminSessionManager.isAdminSessionValid();
    if (isAlreadyVerified && allowed === null) {
      const session = AdminSessionManager.getAdminSession();
      setAdminContextSet(true);
      setAllowed(true);
      console.log('🔄 Admin session restored from persistent cache:', session?.email);
      return;
    }

    // Set up auth state listener to react to login/logout only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        AdminSessionManager.clearAdminSession();
        setAdminContextSet(false);
        setAllowed(false);
        navigate('/affiliate/admin-login', { replace: true });
      } else if (event === 'SIGNED_IN' && !adminContextSet && !isAlreadyVerified) {
        // Only re-check on new sign-in, not on existing sessions
        setTimeout(() => {
          check();
        }, 100);
      }
    });

    // Initial check only if not already verified
    if (allowed === null && !isAlreadyVerified) {
      check();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]); // Removed allowed and adminContextSet from dependencies to prevent loops

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
