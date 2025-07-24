import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderContinuation } from '@/components/OrderContinuation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReliableStorage } from '@/hooks/useReliableStorage';

interface AffiliateInfo {
  id: string;
  company_name: string;
  affiliate_code: string;
}

export const AffiliateLanding: React.FC = () => {
  const { affiliateCode } = useParams<{ affiliateCode: string }>();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [affiliateReferral, setAffiliateReferral] = useReliableStorage('affiliateReferral', '');

  useEffect(() => {
    if (affiliateCode) {
      loadAffiliate();
      // Store affiliate referral for checkout tracking
      setAffiliateReferral(affiliateCode);
    }
  }, [affiliateCode]);

  const loadAffiliate = async () => {
    if (!affiliateCode) return;

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, company_name, affiliate_code')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error loading affiliate:', error);
        // If affiliate not found, redirect to main app
        navigate('/');
        return;
      }

      setAffiliate(data);
    } catch (error) {
      console.error('Error loading affiliate:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewOrder = () => {
    // Navigate to main app with affiliate tracking
    navigate('/', { state: { fromAffiliate: affiliateCode } });
  };

  const handleResumeOrder = () => {
    // Navigate to main app with affiliate tracking
    navigate('/', { state: { fromAffiliate: affiliateCode, resumeOrder: true } });
  };

  const handleAddToRecentOrder = () => {
    // Navigate to main app with affiliate tracking
    navigate('/', { state: { fromAffiliate: affiliateCode, addToRecent: true } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Affiliate Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The affiliate link you're looking for doesn't exist or is no longer active.</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Party On Delivery
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2">
      <div className="max-w-sm w-full">
        {/* Free Shipping Banner */}
        <div className="bg-green-600 text-white text-center py-2 px-4 rounded-t-lg">
          <p className="font-semibold">🚚 FREE DELIVERY INCLUDED!</p>
        </div>
        
        {/* Modified Order Continuation with Affiliate Branding */}
        <div className="bg-white rounded-b-lg shadow-floating">
          <div className="text-center py-4 px-4">
            {/* Company Logo Placeholder */}
            <div className="w-24 h-24 mx-auto mb-2 bg-muted rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {affiliate.company_name.charAt(0)}
              </span>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-brand-blue">
                {affiliate.company_name}
              </h1>
              <p className="text-base text-brand-blue font-medium">
                Powered by Party On Delivery
              </p>
              <p className="text-sm text-muted-foreground">
                Austin's Best Alcohol Delivery
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pb-4 px-4">
            {/* Action Buttons */}
            <button 
              onClick={handleStartNewOrder}
              className="w-full h-12 text-base bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
              Start New Order
            </button>
            
            <button 
              onClick={handleResumeOrder}
              className="w-full h-12 text-base border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Resume Order
            </button>
            
            <button 
              onClick={() => window.location.href = '/customer/login'}
              className="w-full h-12 text-base border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login to Manage Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};