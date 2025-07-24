import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateSignup } from '@/components/affiliate/AffiliateSignup';
import { useToast } from '@/hooks/use-toast';

export const AffiliateCompleteSignup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          toast({
            title: "Authentication Error",
            description: "Please try signing up again.",
            variant: "destructive"
          });
          navigate('/affiliate');
          return;
        }

        if (session?.user) {
          setUser(session.user);
          
          // Check if user already has an affiliate account
          const { data: existingAffiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('email', session.user.email)
            .single();
          
          if (existingAffiliate) {
            toast({
              title: "Welcome back!",
              description: "You already have an affiliate account.",
            });
            navigate('/affiliate/dashboard');
            return;
          }
        } else {
          // No session, redirect to signup
          navigate('/affiliate');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/affiliate');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSuccess = () => {
    navigate('/affiliate/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Completing your signup...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign up first to continue.</p>
          <button 
            onClick={() => navigate('/affiliate')}
            className="text-primary hover:underline"
          >
            ← Back to Affiliate Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <AffiliateSignup onSuccess={handleSuccess} />
      </div>
    </div>
  );
};