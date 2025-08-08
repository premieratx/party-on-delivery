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
      if (!mounted || authProcessed || !session?.user?.email) return;
      if (sessionStorage.getItem('customer-auth-processed') === '1') return;
      
      authProcessed = true;
      sessionStorage.setItem('customer-auth-processed', '1');
      console.log('Processing customer auth for:', session.user.email);
      setIsLoading(false);
      
      try {
        // Link any stored session IDs to this user
        await linkSessionToUser(session.user.email);
        
        // Check for group order join decision to determine redirect
        const groupOrderJoinDecision = localStorage.getItem('groupOrderJoinDecision');
        const originalGroupOrderData = localStorage.getItem('originalGroupOrderData');
        
        // Default to customer dashboard
        let redirectTo = '/customer/dashboard';
        
        // Override with explicit redirect params
        if (redirectParam === 'dashboard') {
          redirectTo = '/customer/dashboard';
        } else if (returnUrl) {
          redirectTo = returnUrl;
        }
        
        // If user chose to join group order, redirect to group order dashboard
        if (groupOrderJoinDecision === 'yes' && originalGroupOrderData) {
          try {
            const groupData = JSON.parse(originalGroupOrderData);
            if (groupData.shareToken) {
              redirectTo = `/order/${groupData.shareToken}`;
              console.log('Redirecting to group order dashboard:', redirectTo);
            }
          } catch (error) {
            console.error('Error parsing group order data for redirect:', error);
          }
        }
        
        console.log('Redirecting to:', redirectTo);
        
        // Use replace to avoid back button issues
        window.location.replace(redirectTo);
      } catch (error) {
        console.error('Customer auth processing error:', error);
        setIsLoading(false);
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Customer auth state change:', event, !!session);
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setTimeout(() => {
            processAuth(session);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          authProcessed = false;
          sessionStorage.removeItem('customer-auth-processed');
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          console.log('Found existing customer session');
          await processAuth(session);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [linkSessionToUser, redirectParam, returnUrl]);

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