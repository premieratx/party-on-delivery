import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Loader2, Lock, Mail, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedCallback, setHasProcessedCallback] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    console.log('🔐 Starting admin login process...');
    
    try {
      console.log('📡 Calling admin-login edge function...');
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { email, password }
      });

      console.log('📡 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to authenticate.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        console.log('❌ Login failed:', data?.message);
        toast({
          title: "Authentication Failed",
          description: data?.message || "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Success - redirect immediately
      console.log('✅ Admin login successful, redirecting...');
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.admin?.name || 'Admin'}!`,
      });
      
      // Force immediate redirect to admin dashboard
      window.location.href = '/admin';
    } catch (error: any) {
      console.error('💥 Login error:', error);
      toast({
        title: "Authentication Error", 
        description: `Login failed: ${error.message}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('request-admin-password-reset', {
        body: { email: resetEmail }
      });

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message || "Failed to send reset email.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reset Email Sent",
        description: "If your email exists in our system, you'll receive reset instructions.",
      });
      
      setShowPasswordReset(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Reset Error",
        description: `Failed to request password reset: ${error.message}`,
        variant: "destructive",
      });
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
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin Access Required</strong><br />
            Use your admin credentials (brian@partyondelivery.com) or Google account to access the dashboard.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your admin credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="brian@partyondelivery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
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

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset Admin Password</CardTitle>
              <CardDescription>
                Enter your admin email to receive reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Admin Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="brian@partyondelivery.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Send Reset Link
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}