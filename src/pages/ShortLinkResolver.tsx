import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MultiCTACoverModal from '@/components/custom-delivery/MultiCTACoverModal';

// Resolves short links for:
// 1) /:shortPath -> first try cover_pages.slug (public), then delivery app short_path, then affiliate code
// 2) /:affiliateSlug -> affiliate code only (fallback to default assigned app or home)
// 3) /:appShortPath/:affiliateSlug -> combined app + affiliate
export default function ShortLinkResolver() {
  const { shortPath, appShortPath, affiliateSlug, coverSlug } = useParams<{
    shortPath?: string;
    appShortPath?: string;
    affiliateSlug?: string;
    coverSlug?: string;
  }>();
  const navigate = useNavigate();

  const [coverPage, setCoverPage] = useState<any | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      const appPath = appShortPath || shortPath; // prefer explicit 2-seg param

      try {
        // Combined app + affiliate: behave as before
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
        // Affiliate + Cover Page: /:affiliateSlug/:coverSlug
        if (affiliateSlug && coverSlug) {
          const { data: cp2, error: cp2Err } = await supabase
            .from('cover_pages')
            .select('*')
            .eq('slug', coverSlug)
            .eq('is_active', true)
            .maybeSingle();
          if (cp2Err) throw cp2Err;
          if (cp2) {
            setCoverPage(cp2);
            setAffiliateCode(affiliateSlug);
            return; // keep URL intact
          }
          navigate('/404', { replace: true });
          return;
        }

        // Single segment: check COVER PAGES FIRST
        if (appPath) {
          const { data: cp, error: cpErr } = await supabase
            .from('cover_pages')
            .select('*')
            .eq('slug', appPath)
            .eq('is_active', true)
            .maybeSingle();
          if (cpErr) throw cpErr;
          if (cp) {
            setCoverPage(cp);
            return; // keep URL intact (root slug)
          }

          // Next: delivery app short link
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

          // Fallback: affiliate code
          const { data: affiliate, error: affErr } = await supabase
            .from('affiliates')
            .select('id, affiliate_code')
            .eq('affiliate_code', appPath)
            .maybeSingle();
          if (affErr) throw affErr;

          if (affiliate?.id) {
            const { data: assign } = await supabase
              .from('affiliate_app_assignments')
              .select('app_variation_id')
              .eq('affiliate_id', affiliate.id)
              .eq('_df', true)
              .maybeSingle();

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
  }, [shortPath, appShortPath, affiliateSlug, coverSlug, navigate]);

  const buttons = useMemo(() => {
    if (!coverPage) return [] as { text: string; onClick: () => void; bgColor?: string; textColor?: string }[];
    const list = (coverPage.buttons || []) as Array<any>;
    return list.map((b: any) => ({
      text: b.text || 'Open',
      bgColor: b.bg_color || undefined,
      textColor: b.text_color || undefined,
      onClick: () => {
        if (b.type === 'delivery_app' && b.app_slug) {
          // Persist per-button rules for downstream app
          try {
            const mp = typeof b.markup_percent === 'number' ? b.markup_percent : 0;
            const fs = b.free_shipping !== false; // default ON
            const ca = !!b.prefill_address; // default OFF
            sessionStorage.setItem('pricing.markupPercent', String(mp.toFixed ? mp.toFixed(2) : mp));
            sessionStorage.setItem('shipping.free', fs ? '1' : '0');
            sessionStorage.setItem('checkout.prefillAddress', ca ? '1' : '0');
            if (typeof b.commission_percent === 'number') {
              sessionStorage.setItem('commission.percent', String(b.commission_percent));
            }
            if (affiliateCode) {
              sessionStorage.setItem('affiliate.code', affiliateCode);
            }
          } catch {}

          const params = new URLSearchParams({ step: 'tabs' });
          if (b.openCart) params.set('openCart', '1');
          if (affiliateCode) params.set('aff', affiliateCode);
          window.location.href = `/app/${b.app_slug}?${params.toString()}`;
          return;
        }
        if (b.type === 'checkout') {
          window.location.href = '/checkout';
          return;
        }
        if (b.type === 'url' && b.url) {
          window.location.href = b.url;
          return;
        }
      }
    }));
  }, [coverPage]);

  // SEO for cover pages
  React.useEffect(() => {
    if (!coverPage) return;
    document.title = `${coverPage.title} | Party On Delivery`;
    const descText = coverPage.subtitle || 'Plan and order drinks with Party On Delivery.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descText;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/${coverPage.slug}`;
  }, [coverPage]);

  if (coverPage) {
    const checklist = (coverPage.checklist || []) as string[];
    return (
      <div className="min-h-screen bg-background">
        <MultiCTACoverModal
          open={true}
          onOpenChange={() => {}}
          appName={coverPage.title}
          logoUrl={coverPage.logo_url || undefined}
          logoHeight={coverPage.logo_height ?? 160}
          title={coverPage.title}
          subtitle={coverPage.subtitle || ''}
          checklistItems={checklist}
          backgroundImageUrl={coverPage.bg_image_url || undefined}
          backgroundVideoUrl={coverPage.bg_video_url || undefined}
          buttons={buttons}
          titleSize={coverPage.styles?.title_size}
          subtitleSize={coverPage.styles?.subtitle_size}
          checklistSize={coverPage.styles?.checklist_size}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p>Redirecting…</p>
      </div>
    </div>
  );
}

