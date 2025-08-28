import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminSessionManager } from '@/utils/sessionPersistence';
import { startAdminHealthMonitoring, stopAdminHealthMonitoring } from '@/utils/adminHealthCheck';

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

        // CRITICAL: verify-admin-google does verification AND sets RLS context
        console.log('🔐 SECURITY: Verifying admin and setting RLS context for:', session.user.email);
        const { data, error } = await supabase.functions.invoke('verify-admin-google', {
          body: { email: session.user.email }
        });
        
        console.log('🔍 SECURITY: Admin verification response:', { data, error });
        
        if (error) {
          console.error('🚨 SECURITY: verify-admin-google error:', error);
          toast({
            title: "Security Error",
            description: "Failed to establish secure admin context. Please try again.",
            variant: "destructive",
          });
          setAllowed(false);
          navigate('/affiliate/admin-login', { replace: true });
          return;
        }

        if (data?.isAdmin) {
          console.log('✅ SECURITY: Admin verified and RLS context established');
          setAdminContextSet(true);
          setAllowed(true);
          
          // Store admin session with enhanced persistence
          AdminSessionManager.setAdminSession(session.user.email || '');
          
          // Start health monitoring for this admin session
          startAdminHealthMonitoring();
        } else {
          console.log('❌ SECURITY: Access denied - not an admin user');
          await supabase.auth.signOut();
          setAllowed(false);
          toast({ 
            title: 'Access denied', 
            description: "Your account doesn't have admin privileges.",
            variant: 'destructive' 
          });
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

    // Allow cached sessions for logged in admin users - no forced re-auth
    // Users should stay logged in and have full admin access once authenticated
    const shouldForceFreshAuth = false; // Allow cached sessions for better UX
    
    if (shouldForceFreshAuth) {
      console.log('🔐 SECURITY: Forcing fresh Google authentication (cached sessions disabled)');
      AdminSessionManager.clearAdminSession(); // Clear any cached sessions
      // Skip cached session logic entirely
    } else {
      // CRITICAL: Always call verify-admin-google even for cached sessions
      // This function does TWO things: verification AND context setting for RLS
      const isAlreadyVerified = AdminSessionManager.isAdminSessionValid();
      if (isAlreadyVerified && allowed === null) {
        const cachedSession = AdminSessionManager.getAdminSession();
        console.log('🔄 SECURITY: Found cached admin session, but MUST re-verify for RLS context:', cachedSession?.email);
        
        // NEVER skip this call - it sets admin context required for RLS policies
        if (cachedSession?.email) {
          const setContextForCached = async () => {
            try {
              console.log('🔐 SECURITY: Setting admin context for cached session (REQUIRED FOR RLS)');
              const { data, error } = await supabase.functions.invoke('verify-admin-google', {
                body: { email: cachedSession.email }
              });
              
              if (!mounted) return;
              
              if (data?.isAdmin && !error) {
                console.log('✅ SECURITY: Cached admin session verified and RLS context set');
                setAdminContextSet(true);
                setAllowed(true);
              } else {
                console.error('❌ SECURITY: Cached session invalid or context setting failed, clearing');
                AdminSessionManager.clearAdminSession();
                setAllowed(false);
                navigate('/affiliate/admin-login', { replace: true });
              }
            } catch (contextError) {
              console.error('🚨 SECURITY: Failed to set admin context for cached session:', contextError);
              AdminSessionManager.clearAdminSession();
              setAllowed(false);
              navigate('/affiliate/admin-login', { replace: true });
            }
          };
          
          setContextForCached();
          return;
        }
      }
    }

    // Set up auth state listener to react to login/logout only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        AdminSessionManager.clearAdminSession();
        setAdminContextSet(false);
        setAllowed(false);
        stopAdminHealthMonitoring(); // Stop monitoring on logout
        
        // SECURITY: Force clear Supabase session to ensure fresh Google auth
        console.log('🔐 SECURITY: Clearing all auth state for fresh login');
        await supabase.auth.signOut({ scope: 'global' });
        
        navigate('/affiliate/admin-login', { replace: true });
      } else if (event === 'SIGNED_IN' && !adminContextSet) {
        // Only re-check on new sign-in, not on existing sessions
        setTimeout(() => {
          check();
        }, 100);
      }
    });

    // Initial check when component mounts
    if (allowed === null) {
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
