import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSessionTracking } from '@/hooks/useSessionTracking';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { linkSessionToUser } = useSessionTracking();
  const [isLoading, setIsLoading] = useState(false);

  // Get return URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get('return');
  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    let mounted = true;
    let authProcessed = false;

    const processAuth = async (session: any) => {
      if (!mounted || authProcessed) return;
      
      authProcessed = true;
      console.log('Processing customer auth');
      setIsLoading(false);
      
      try {
        // Link any stored session IDs to this user
        if (session.user.email) {
          await linkSessionToUser(session.user.email);
        }
        
        // Redirect to intended destination
        const redirectTo = redirectParam === 'dashboard' ? '/customer/dashboard' : (returnUrl || '/customer/dashboard');
        console.log('Redirecting to:', redirectTo);
        window.location.replace(redirectTo);
      } catch (error) {
        console.error('Customer auth processing error:', error);
        setIsLoading(false);
      }
    };

    // Check for existing session first
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          console.log('Found existing customer session, processing...');
          await processAuth(session);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Customer auth state change:', event);
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          await processAuth(session);
        }
        
        if (event === 'SIGNED_OUT') {
          authProcessed = false;
          setIsLoading(false);
        }
      }
    );

    // Check existing session after setting up listener
    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, linkSessionToUser, redirectParam, returnUrl]);

  const handleGoogleLogin = async () => {
    if (isLoading) return; // Prevent double clicks
    
    setIsLoading(true);
    console.log('Initiating Google login...');
    
    try {
      // Use current URL for redirect to preserve params
      const currentUrl = window.location.href;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: currentUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('OAuth initiation error:', error);
        throw error;
      }
      
      // Loading state will be cleared by auth state listener
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Customer Login</CardTitle>
          <CardDescription>
            Sign in to manage your orders and delivery details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By signing in, you agree to our terms of service and privacy policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;