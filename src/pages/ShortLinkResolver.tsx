import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MultiCTACoverModal from '@/components/custom-delivery/MultiCTACoverModal';

// Resolves short links for:
// 1) /:shortPath -> first try cover_pages.slug (public), then delivery app short_path, then affiliate code
// 2) /:affiliateSlug -> affiliate code only (fallback to default assigned app or home)
// 3) /:appShortPath/:affiliateSlug -> combined app + affiliate
export default function ShortLinkResolver() {
  const { shortPath, appShortPath, affiliateSlug } = useParams<{
    shortPath?: string;
    appShortPath?: string;
    affiliateSlug?: string;
  }>();
  const navigate = useNavigate();

  const [coverPage, setCoverPage] = useState<any | null>(null);

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
  }, [shortPath, appShortPath, affiliateSlug, navigate]);

  const buttons = useMemo(() => {
    if (!coverPage) return [] as { text: string; onClick: () => void }[];
    const list = (coverPage.buttons || []) as Array<any>;
    return list.map((b: any) => ({
      text: b.text || 'Open',
      onClick: () => {
        if (b.type === 'delivery_app' && b.app_slug) {
          const params = new URLSearchParams({ step: 'tabs' });
          if (b.openCart) params.set('openCart', '1');
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
          title={coverPage.title}
          subtitle={coverPage.subtitle || ''}
          checklistItems={checklist}
          backgroundImageUrl={coverPage.bg_image_url || undefined}
          backgroundVideoUrl={coverPage.bg_video_url || undefined}
          buttons={buttons}
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

