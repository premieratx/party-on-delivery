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
    
    // Prevent multiple processing with session storage flag
    const authProcessingKey = 'customer-auth-processing';
    const isProcessing = sessionStorage.getItem(authProcessingKey);
    
    if (isProcessing) {
      console.log('Customer auth already processing, skipping...');
      return;
    }

    const processAuth = async (session: any) => {
      if (!mounted) return;
      
      // Set processing flag
      sessionStorage.setItem(authProcessingKey, 'true');
      
      console.log('Processing customer auth');
      setIsLoading(false);
      
      try {
        // Link any stored session IDs to this user
        if (session.user.email) {
          await linkSessionToUser(session.user.email);
        }
        
        // Clear redirect intent and navigate to dashboard
        localStorage.removeItem('loginRedirectIntent');
        sessionStorage.removeItem(authProcessingKey);
        window.location.replace('/customer/dashboard');
      } catch (error) {
        console.error('Customer auth processing error:', error);
        sessionStorage.removeItem(authProcessingKey);
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
          sessionStorage.removeItem(authProcessingKey);
          setIsLoading(false);
        }
      }
    );

    // Check existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          await processAuth(session);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, linkSessionToUser]);

  const handleGoogleLogin = async () => {
    if (isLoading) return; // Prevent double clicks
    
    setIsLoading(true);
    try {
      // Clear any existing redirect intents
      localStorage.removeItem('loginRedirectIntent');
      
      // Use current origin for redirect with proper mobile detection
      const redirectUrl = `${window.location.origin}/customer/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
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