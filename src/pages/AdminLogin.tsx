import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/party-on-delivery-logo.png';

export const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        // Check if user is admin
        const { data } = await supabase.functions.invoke('verify-admin-google', {
          body: { email: session.user.email }
        });
        if (data?.isAdmin) {
          navigate('/affiliate/admin');
        }
      }
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        // Check if user is admin after Google sign in
        const { data } = await supabase.functions.invoke('verify-admin-google', {
          body: { email: session.user.email }
        });
        if (data?.isAdmin) {
          toast({
            title: "Welcome!",
            description: "Successfully logged in as admin.",
          });
          navigate('/affiliate/admin');
        } else {
          // Sign out non-admin users
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin access.",
            variant: "destructive"
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify admin credentials using edge function
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: {
          email: formData.email,
          password: formData.password
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in as admin.",
        });
        navigate('/affiliate/admin');
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Error",
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/affiliate/admin-login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

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
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@partyondelivery.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 w-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
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