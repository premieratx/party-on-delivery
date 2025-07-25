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
    let hasNavigated = false; // Prevent multiple navigations

    // Check if user is already logged in first
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !hasNavigated) {
        hasNavigated = true;
        // Link any stored session IDs to this user
        if (session.user.email) {
          await linkSessionToUser(session.user.email);
        }
        
        localStorage.removeItem('loginRedirectIntent');
        navigate('/customer/dashboard', { replace: true });
        return;
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && !hasNavigated) {
          hasNavigated = true;
          // Link any stored session IDs to this user
          if (session.user.email) {
            await linkSessionToUser(session.user.email);
          }
          
          // Clear redirect intent and always go to dashboard
          localStorage.removeItem('loginRedirectIntent');
          navigate('/customer/dashboard', { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, linkSessionToUser]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Store intent to redirect to dashboard in localStorage
      localStorage.setItem('loginRedirectIntent', 'dashboard');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
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