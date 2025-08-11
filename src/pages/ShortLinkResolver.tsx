import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Resolves short links for:
// 1) /:shortPath -> delivery app short_path (app precedence)
// 2) /:affiliateSlug -> affiliate code only (fallback to default assigned app or home)
// 3) /:appShortPath/:affiliateSlug -> combined app + affiliate
export default function ShortLinkResolver() {
  const { shortPath, appShortPath, affiliateSlug } = useParams<{
    shortPath?: string;
    appShortPath?: string;
    affiliateSlug?: string;
  }>();
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      const appPath = appShortPath || shortPath; // prefer explicit 2-seg param
      const affCode = affiliateSlug || (appShortPath ? undefined : undefined);

      try {
        // If both app and affiliate are present: resolve app then forward with aff param
        if (appShortPath && affiliateSlug) {
          const { data: app, error: appErr } = await supabase
            .from('delivery_app_variations')
            .select('app_slug')
            .eq('short_path', appShortPath)
            .eq('is_active', true)
            .maybeSingle();
          if (appErr) throw appErr;
          if (app?.app_slug) {
            navigate(`/app/${app.app_slug}?aff=${encodeURIComponent(affiliateSlug)}`, { replace: true });
            return;
          }
          navigate('/404', { replace: true });
          return;
        }

        // Single segment: app precedence
        if (appPath) {
          const { data: app, error: appErr } = await supabase
            .from('delivery_app_variations')
            .select('app_slug')
            .eq('short_path', appPath)
            .eq('is_active', true)
            .maybeSingle();
          if (appErr) throw appErr;
          if (app?.app_slug) {
            navigate(`/app/${app.app_slug}`, { replace: true });
            return;
          }

          // Not an app short link: treat as affiliate code
          const { data: affiliate, error: affErr } = await supabase
            .from('affiliates')
            .select('id, affiliate_code')
            .eq('affiliate_code', appPath)
            .maybeSingle();
          if (affErr) throw affErr;

          if (affiliate?.id) {
            // Find default app assignment for this affiliate
            const { data: assign, error: assignErr } = await supabase
              .from('affiliate_app_assignments')
              .select('app_variation_id')
              .eq('affiliate_id', affiliate.id)
              .eq('_df', true)
              .maybeSingle();
            if (assignErr) {
              // Even if this fails, we can still apply code at home
              navigate(`/?aff=${encodeURIComponent(affiliate.affiliate_code)}`, { replace: true });
              return;
            }

            if (assign?.app_variation_id) {
              const { data: app2 } = await supabase
                .from('delivery_app_variations')
                .select('app_slug')
                .eq('id', assign.app_variation_id)
                .maybeSingle();

              if (app2?.app_slug) {
                navigate(`/app/${app2.app_slug}?aff=${encodeURIComponent(affiliate.affiliate_code)}`, { replace: true });
                return;
              }
            }
            // Fallback: send to home with affiliate code
            navigate(`/?aff=${encodeURIComponent(affiliate.affiliate_code)}`, { replace: true });
            return;
          }

          // No match
          navigate('/404', { replace: true });
          return;
        }

        // Nothing to resolve
        navigate('/', { replace: true });
      } catch (e) {
        navigate('/404', { replace: true });
      }
    };
    resolve();
  }, [shortPath, appShortPath, affiliateSlug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p>Redirecting…</p>
      </div>
    </div>
  );
}

