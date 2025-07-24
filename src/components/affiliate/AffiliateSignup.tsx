import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AffiliateSignupProps {
  onSuccess: () => void;
  initialData?: {
    name?: string;
    email?: string;
  };
}

export const AffiliateSignup: React.FC<AffiliateSignupProps> = ({ onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'google' | 'details'>(initialData ? 'details' : 'google');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: '',
    companyName: '',
    venmoHandle: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener for OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        console.log('OAuth redirect detected, user signed in:', session.user.email);
        
        // Check if affiliate already exists
        const { data: existingAffiliate, error: checkError } = await supabase
          .from('affiliates')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking affiliate:', checkError);
          return;
        }
        
        if (existingAffiliate) {
          console.log('Existing affiliate found, redirecting to dashboard');
          navigate('/affiliate/dashboard');
          return;
        }
        
        // If no affiliate exists, proceed to details step
        console.log('New user, showing details form');
        setStep('details');
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
        }));
      }
    });

    // Also check initial session state for users who already completed OAuth
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && !initialData) {
        console.log('Found existing session on load:', session.user.email);
        
        // Check if affiliate already exists
        const { data: existingAffiliate, error: checkError } = await supabase
          .from('affiliates')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking affiliate:', checkError);
          return;
        }
        
        if (existingAffiliate) {
          console.log('Existing affiliate found on load, redirecting to dashboard');
          navigate('/affiliate/dashboard');
          return;
        }
        
        // If no affiliate exists, proceed to details step
        setStep('details');
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
        }));
      }
    };
    
    checkInitialSession();
    
    return () => subscription.unsubscribe();
  }, [navigate, initialData]);

  const handleGoogleAuth = async () => {
    console.log('Google auth clicked');
    setLoading(true);
    try {
      // Clear any existing session first to ensure clean OAuth flow
      await supabase.auth.signOut();
      console.log('Cleared existing session');
      
      // Use Supabase SDK with redirect URL pointing back to affiliate signup page for processing
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/affiliate`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // The redirect will happen automatically, no need to handle it here
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Error",
        description: `Authentication failed: ${error.message}. Please try again.`,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (name, company, and phone).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Generate affiliate code and create affiliate profile
      const { data, error } = await supabase.functions.invoke('create-affiliate', {
        body: {
          name: formData.name,
          phone: formData.phone,
          companyName: formData.companyName,
          venmoHandle: formData.venmoHandle,
          email: user.email
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your affiliate account has been created successfully.",
      });

      onSuccess();
      navigate('/affiliate/dashboard');
    } catch (error: any) {
      console.error('Affiliate creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create affiliate account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'google') {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Continue with Google</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              We'll ask for additional details after you sign in
            </p>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Button variant="link" size="sm" onClick={() => navigate('/affiliate/admin-login')} className="text-xs text-muted-foreground hover:text-foreground">
            Admin Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Best Cell Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venmoHandle">Venmo Handle (Optional)</Label>
              <Input
                id="venmoHandle"
                value={formData.venmoHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, venmoHandle: e.target.value }))}
                placeholder="@your-venmo-handle"
              />
              <p className="text-xs text-muted-foreground">
                For faster commission payouts
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Affiliate Account
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center mt-4">
        <Button variant="link" size="sm" onClick={() => navigate('/affiliate/admin-login')} className="text-xs text-muted-foreground hover:text-foreground">
          Admin Login
        </Button>
      </div>
    </div>
  );
};