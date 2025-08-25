import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedCallback, setHasProcessedCallback] = useState(false);

  // Only clear sessions if NOT processing OAuth callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || window.location.hash.includes('access_token');
    
    if (!hasOAuthParams) {
      const clearSessions = async () => {
        await supabase.auth.signOut({ scope: 'global' });
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Clean startup complete');
      };
      clearSessions();
    }
  }, []);

  // Handle OAuth callback - only once
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      if (hasProcessedCallback) return; // Prevent multiple processing
      
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthParams = urlParams.has('code') || window.location.hash.includes('access_token');
      
      if (user?.email && hasOAuthParams) {
        setHasProcessedCallback(true);
        console.log('Processing OAuth callback for:', user.email);
        
        try {
          const { data, error } = await supabase.functions.invoke('verify-admin-google', {
            body: { email: user.email }
          });

          if (error) {
            console.error('Admin verification error:', error);
            toast({
              title: "Authentication Error",
              description: "Failed to verify admin status.",
              variant: "destructive",
            });
            return;
          }

          if (data?.isAdmin) {
            console.log('Admin verified, redirecting to dashboard');
            // Clear the URL params to prevent loop
            window.history.replaceState({}, document.title, '/affiliate/admin-login');
            navigate('/admin', { replace: true });
          } else {
            toast({
              title: "Access Denied", 
              description: "Your account does not have admin privileges.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Admin verification error:', error);
          toast({
            title: "Authentication Error",
            description: "An error occurred during verification.",
            variant: "destructive",
          });
        }
      }
    };

    handleOAuthCallback();
  }, [user?.email, navigate, toast, hasProcessedCallback]);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/affiliate/admin-login`
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: `Google login failed: ${error.message}`,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error", 
        description: `Login failed: ${error.message}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
          <p className="text-muted-foreground">Affiliate Program Administration</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Enhanced Security Active</strong><br />
            Fresh Google authentication required for every admin session
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Secure Access</CardTitle>
            <CardDescription>
              Admin access is restricted to authorized Google accounts only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/affiliate')}
            className="text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Affiliate Program
          </Button>
        </div>
      </div>
    </div>
  );
}