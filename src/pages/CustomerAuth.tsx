import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CustomerAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const redirectTo = searchParams.get('redirectTo') || '/customer/dashboard';

  const handleSuccessfulAuth = async (userEmail: string) => {
    try {
      console.log('Handling successful auth for:', userEmail);
      
      // Create or update customer profile
      const { error: upsertError } = await supabase
        .from('customers')
        .upsert({
          email: userEmail,
          name: user?.user_metadata?.full_name || userEmail,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Customer profile upsert error:', upsertError);
      }

      // Clear processed flags
      sessionStorage.removeItem('customer-auth-processed');
      
      const destination = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      console.log('Redirecting to:', destination);
      navigate(destination, { replace: true });
      
    } catch (error) {
      console.error('Error in handleSuccessfulAuth:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to complete authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.email) {
      handleSuccessfulAuth(user.email);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Customer Access</CardTitle>
          <p className="text-muted-foreground">
            Create an account or sign in to continue with your order and access exclusive features.
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <GoogleAuthButton 
            userType="customer"
            redirectTo={redirectTo}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Create New Account
          </GoogleAuthButton>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-primary"
            >
              ← Back to Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAuth;