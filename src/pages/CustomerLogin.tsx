import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSessionTracking } from '@/hooks/useSessionTracking';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { linkSessionToUser } = useSessionTracking();
  
  const redirectTo = searchParams.get('redirect') || 'dashboard';

  const processAuth = async (session: any) => {
    if (!session?.user?.email) return;

    try {
      console.log('Processing customer auth for:', session.user.email);
      
      // Link session to user
      await linkSessionToUser(session.user.email);

      // Create or update customer profile
      const { error: upsertError } = await supabase
        .from('customers')
        .upsert({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Customer upsert error:', upsertError);
      }

      // Clear processed flag
      sessionStorage.removeItem('customer-auth-processed');

      // Determine redirect destination
      let destination = '/customer/dashboard';
      if (redirectTo && redirectTo !== 'dashboard') {
        destination = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      }

      console.log('Redirecting customer to:', destination);
      navigate(destination, { replace: true });

    } catch (error) {
      console.error('Error processing customer auth:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to complete login process. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('CustomerLogin: Checking auth state');
    
    if (user) {
      processAuth({ user });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <p className="text-muted-foreground">
            Sign in to access your customer dashboard and order history.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <GoogleAuthButton 
            userType="customer"
            redirectTo={redirectTo}
            className="w-full"
            size="lg"
          >
            Continue with Google
          </GoogleAuthButton>

          <div className="text-center">
            <a 
              href="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Shopping
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;