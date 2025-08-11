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
  const [assignedAppSlug, setAssignedAppSlug] = useState<string | null>(null);
  const [affiliateReferral, setAffiliateReferral] = useReliableStorage('affiliateReferral', '');

  useEffect(() => {
    if (affiliateCode) {
      loadAffiliate();
      // Store affiliate referral for checkout tracking
      setAffiliateReferral(affiliateCode);
      try { localStorage.setItem('affiliate_code', affiliateCode); } catch {}
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

      // Fetch assigned delivery app slug if any
      try {
        const { data: site } = await supabase
          .from('custom_affiliate_sites')
          .select('delivery_app_id')
          .eq('affiliate_id', data.id)
          .eq('is_active', true)
          .maybeSingle();
        if (site?.delivery_app_id) {
          const { data: app } = await supabase
            .from('delivery_app_variations')
            .select('app_slug')
            .eq('id', site.delivery_app_id)
            .maybeSingle();
          if (app?.app_slug) setAssignedAppSlug(app.app_slug);
        }
      } catch {}

    } catch (error) {
      console.error('Error loading affiliate:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Immediately redirect to assigned app cover screen preserving affiliate code
  useEffect(() => {
    if (!loading && affiliateCode) {
      const target = assignedAppSlug ? `/app/${assignedAppSlug}?step=start&aff=${affiliateCode}` : `/?aff=${affiliateCode}`;
      // Use hard replace to ensure aff param persists and no intermediate flicker
      window.location.replace(target);
    }
  }, [loading, assignedAppSlug, affiliateCode]);

  // Render minimal loader while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting…</p>
      </div>
    </div>
  );
};