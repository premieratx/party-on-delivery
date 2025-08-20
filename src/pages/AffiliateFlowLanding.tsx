import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';

interface FlowAssignment {
  id: string;
  customer_flow_id: string;
  affiliate_id: string;
  share_slug: string;
  is_active: boolean;
  free_shipping: boolean;
  discount_type: string | null;
  discount_percentage: number | null;
  discount_dollar_amount: number | null;
  customer_flow: {
    id: string;
    name: string;
    slug: string;
    cover_page_id: string | null;
    delivery_app_id: string | null;
    post_checkout_id: string | null;
    is_active: boolean;
  };
  affiliate: {
    id: string;
    name: string;
    company_name: string;
    affiliate_code: string;
  };
}

export const AffiliateFlowLanding: React.FC = () => {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const navigate = useNavigate();
  const { startTracking } = useAffiliateTracking();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<FlowAssignment | null>(null);

  useEffect(() => {
    if (shareSlug) {
      loadFlowAssignment();
    }
  }, [shareSlug]);

  const loadFlowAssignment = async () => {
    if (!shareSlug) return;

    try {
      const { data, error } = await supabase
        .from('affiliate_flow_assignments')
        .select(`
          *,
          customer_flow:customer_flows(*),
          affiliate:affiliates(*)
        `)
        .eq('share_slug', shareSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading flow assignment:', error);
        // Redirect to homepage if assignment not found
        navigate('/');
        return;
      }

      setAssignment(data);

      // Start affiliate tracking
      startTracking(data.affiliate.affiliate_code, data.customer_flow.cover_page_id);

      // Store discount/shipping info for checkout
      if (data.free_shipping || data.discount_type) {
        const promoData = {
          free_shipping: data.free_shipping,
          discount_type: data.discount_type,
          discount_percentage: data.discount_percentage,
          discount_dollar_amount: data.discount_dollar_amount,
          affiliate_code: data.affiliate.affiliate_code
        };
        
        sessionStorage.setItem('affiliate-promo', JSON.stringify(promoData));
      }

      // Redirect to the appropriate page based on flow configuration
      if (data.customer_flow.cover_page_id) {
        // If flow has a cover page, redirect there
        const { data: coverPage } = await supabase
          .from('cover_pages')
          .select('slug')
          .eq('id', data.customer_flow.cover_page_id)
          .single();
        
        if (coverPage) {
          navigate(`/cover/${coverPage.slug}?aff=${data.affiliate.affiliate_code}`);
          return;
        }
      }

      if (data.customer_flow.delivery_app_id) {
        // If flow has a delivery app, redirect there
        const { data: deliveryApp } = await supabase
          .from('delivery_app_variations')
          .select('app_slug')
          .eq('id', data.customer_flow.delivery_app_id)
          .single();
        
        if (deliveryApp) {
          navigate(`/app/${deliveryApp.app_slug}?aff=${data.affiliate.affiliate_code}`);
          return;
        }
      }

      // Fallback to homepage with affiliate code
      navigate(`/?aff=${data.affiliate.affiliate_code}`);

    } catch (error) {
      console.error('Error in flow assignment:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your personalized experience...</p>
          {assignment && (
            <p className="text-sm text-muted-foreground mt-2">
              Powered by {assignment.affiliate.company_name}
            </p>
          )}
        </div>
      </div>
    );
  }

  // This component should not render anything visible as it redirects
  return null;
};