import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminSessionManager } from '@/utils/sessionPersistence';
import { Lock, AlertTriangle, LogOut } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [forcingFreshAuth, setForcingFreshAuth] = useState(false);

  React.useEffect(() => {
    // SECURITY: Clear any cached admin sessions on login page load
    console.log('🔐 SECURITY: Clearing cached admin sessions for fresh authentication');
    AdminSessionManager.clearAdminSession();
    
    // Also clear any existing Supabase sessions completely
    const clearAllSessions = async () => {
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('🔐 SECURITY: All Supabase sessions cleared');
      } catch (error) {
        console.log('🔐 Note: Error clearing sessions (may not exist):', error);
      }
    };
    clearAllSessions();
  }, []);

  // SECURITY: Force complete logout and fresh auth
  const forceCompleteLogout = async () => {
    setForcingFreshAuth(true);
    console.log('🔐 SECURITY: Forcing complete logout and session clear');
    
    try {
      // Clear all possible session storage
      AdminSessionManager.clearAdminSession();
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Supabase sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear browser cache for this origin
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast({
        title: "Sessions Cleared",
        description: "All sessions have been cleared. Click 'Sign in with Google' for fresh authentication.",
      });
      
    } catch (error) {
      console.error('Error during force logout:', error);
    } finally {
      setForcingFreshAuth(false);
    }
  };

  // SECURITY: Force fresh Google auth - ignore existing user sessions
  const forceGoogleAuth = async () => {
    if (isProcessingAuth) return;
    
    setIsProcessingAuth(true);
    console.log('🔐 SECURITY: Forcing fresh Google OAuth for admin');
    
    try {
      // Clear any existing session first
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('🔐 Attempting Google OAuth with config:', {
        redirectTo: `${window.location.origin}/affiliate/admin-login`,
        origin: window.location.origin
      });
      
      // Force fresh Google OAuth with account selection
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/affiliate/admin-login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account consent', // Force account selection
          },
          skipBrowserRedirect: false,
        },
      });
      
      console.log('🔐 OAuth Response:', { data, error });
      
      if (error) {
        console.error('🚨 SECURITY: OAuth error:', error);
        toast({
          title: "OAuth Configuration Error",
          description: `Google OAuth failed: ${error.message}. Please check Supabase Google provider configuration.`,
          variant: "destructive",
        });
      } else {
        console.log('🔐 OAuth initiated successfully, redirecting to Google...');
      }
    } catch (error: any) {
      console.error('🚨 SECURITY: Unexpected error during OAuth:', error);
      toast({
        title: "Authentication Error", 
        description: `Unexpected error: ${error.message}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      // Reset loading state after a delay if no redirect happened
      setTimeout(() => {
        setIsProcessingAuth(false);
      }, 3000);
    }
  };

  const processAuth = async (email: string) => {
    console.log('🔐 SECURITY: Processing fresh admin auth for:', email);
    try {
      // Use edge function for admin verification (faster, no RLS issues)
      const { data, error } = await supabase.functions.invoke('verify-admin-google', {
        body: { email }
      });

      console.log('🔍 SECURITY: Admin verification response:', { data, error });

      if (error) {
        console.error('🚨 SECURITY: Error verifying admin:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify admin status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.isAdmin) {
        console.log('✅ SECURITY: Admin verified with fresh Google auth, redirecting to dashboard');
        navigate('/admin', { replace: true });
      } else {
        console.log('❌ SECURITY: Access denied - not an admin');
        toast({
          title: "Access Denied", 
          description: "Your account does not have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🚨 SECURITY: Unexpected error during admin verification:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // SECURITY: Only process auth if user came from OAuth redirect
  React.useEffect(() => {
    console.log('🔍 SECURITY: AdminLogin checking auth state');
    
    // Only process if this is an OAuth callback with fresh session
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || window.location.hash.includes('access_token');
    
    if (user?.email && hasOAuthParams && !isProcessingAuth) {
      console.log('🔐 SECURITY: Processing OAuth callback for:', user.email);
      processAuth(user.email);
    }
  }, [user, isProcessingAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-20 h-20 mx-auto mb-4"
          />
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Login
          </CardTitle>
          <p className="text-muted-foreground">
            Affiliate Program Administration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Enhanced Security Active</p>
                <p className="text-amber-700">
                  Fresh Google authentication required for every admin session
                </p>
              </div>
            </div>
          </div>

          {/* Show current session warning if user is detected */}
          {user && !isProcessingAuth && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Existing Session Detected</p>
                  <p className="text-red-700">
                    Currently logged in as: {user.email}
                  </p>
                  <p className="text-red-700 mt-1">
                    For security, you must clear all sessions and re-authenticate with Google.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Admin access is restricted to authorized Google accounts only.
            </p>
          </div>

          {/* Force logout button if user is detected */}
          {user && (
            <Button
              onClick={forceCompleteLogout}
              disabled={forcingFreshAuth}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {forcingFreshAuth ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Clearing Sessions...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Clear All Sessions & Force Logout
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={forceGoogleAuth}
            disabled={isProcessingAuth}
            className="w-full"
            size="lg"
          >
            {isProcessingAuth ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {/* Debug info for troubleshooting */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Debug: {window.location.origin}</p>
            <p>Redirect: /affiliate/admin-login</p>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/affiliate" 
              className="text-sm text-primary hover:underline"
            >
              ← Back to Affiliate Program
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};