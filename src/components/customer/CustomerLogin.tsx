import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Mail, ShoppingBag } from 'lucide-react';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    console.log('CustomerLogin: Checking auth state');
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      console.log('Processing customer auth for:', session.user.email);
      await processCustomerAuth(session.user.email, session);
    }
  };

  const processCustomerAuth = async (customerEmail: string, session: any) => {
    try {
      // Enhanced customer linking with better error handling
      const { data, error } = await supabase.functions.invoke('link-customer-session-enhanced', {
        body: {
          customerEmail,
          sessionToken: session?.access_token || 'direct-auth',
          orderData: {
            customer_name: session?.user?.user_metadata?.name || '',
            customer_phone: session?.user?.user_metadata?.phone || ''
          }
        }
      });

      if (error) {
        console.error('Customer linking error:', error);
      } else {
        console.log('✅ Customer session linked successfully:', data);
      }

      console.log('Redirecting customer to:', '/customer/dashboard');
      navigate('/customer/dashboard');
    } catch (error: any) {
      console.error('Customer upsert error:', error);
      // Still redirect - the dashboard will handle missing data
      navigate('/customer/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/customer/login`
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in",
      });
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast({
        title: "Failed to send magic link",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to view your orders and manage your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In */}
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMagicLink()}
            />
          </div>

          <Button 
            onClick={handleMagicLink}
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Magic Link
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              New customer?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/')}
              >
                Start shopping
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;