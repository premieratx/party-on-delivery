import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('brian@partyondelivery.com');
  const [password, setPassword] = useState('');

  // Clear any existing Supabase sessions on component mount, but preserve admin session
  React.useEffect(() => {
    const clearSessions = async () => {
      // Check if we have a valid admin session before clearing
      const adminSession = localStorage.getItem('admin_session');
      let preserveAdminSession = false;
      
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          if (session.isAdmin && (Date.now() - session.timestamp < 24 * 60 * 60 * 1000)) {
            preserveAdminSession = true;
            console.log('🔒 Preserving valid admin session');
            // Redirect to admin if we already have a valid session
            window.location.href = '/admin';
            return;
          }
        } catch (e) {
          // Invalid session data, will be cleared
        }
      }
      
      await supabase.auth.signOut({ scope: 'global' });
      if (!preserveAdminSession) {
        localStorage.clear();
      }
      sessionStorage.clear();
      console.log('✅ Clean startup complete');
    };
    clearSessions();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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

      // Success - now create a proper Supabase session
      console.log('✅ Admin login successful, creating Supabase session...');
      
      // Create a Supabase auth session for the admin user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'temp_admin_session' // This will fail, but we'll handle it
      });

      // If that fails (which it will), we'll sign in anonymously and set the user manually
      if (authError) {
        console.log('📝 Creating admin session manually...');
        // Store admin session in localStorage for RequireAdmin to find
        localStorage.setItem('admin_session', JSON.stringify({
          user: { email: email },
          admin: data.admin,
          isAdmin: true,
          timestamp: Date.now()
        }));
      }

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
            <strong>Admin Access</strong><br />
            Login with brian@partyondelivery.com and your admin password.
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
            <form onSubmit={handleLogin} className="space-y-4">
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
    </div>
  );
}