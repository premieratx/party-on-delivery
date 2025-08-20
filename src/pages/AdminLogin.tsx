import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();

  const processAuth = async (email: string) => {
    console.log('Processing admin auth for:', email);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-google', {
        body: { email }
      });

      console.log('Admin verification response:', { data, error });

      if (error) {
        console.error('Error verifying admin:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify admin status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.isAdmin) {
        console.log('✅ Admin verified, redirecting to dashboard');
        navigate('/affiliate/admin', { replace: true });
      } else {
        console.log('❌ Access denied - not an admin');
        toast({
          title: "Access Denied", 
          description: "Your account does not have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error during admin verification:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('AdminLogin: Checking auth state');
    
    if (user?.email) {
      processAuth(user.email);
    }
  }, [user]);

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
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Admin access is restricted to authorized Google accounts only.
            </p>
          </div>
          
          <GoogleAuthButton 
            userType="admin"
            className="w-full"
            size="lg"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </GoogleAuthButton>

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