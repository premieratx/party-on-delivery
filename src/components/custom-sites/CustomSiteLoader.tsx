import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomSiteConfig {
  id: string;
  site_slug: string;
  site_name: string;
  business_name: string;
  business_address: any;
  custom_promo_code: string | null;
  site_type: string;
  affiliate_id: string | null;
  affiliate_code?: string;
  collections: string[];
}

interface CustomSiteLoaderProps {
  siteSlug: string;
  onSiteLoaded: (config: CustomSiteConfig | null) => void;
  children: React.ReactNode;
}

export function CustomSiteLoader({ siteSlug, onSiteLoaded, children }: CustomSiteLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [siteConfig, setSiteConfig] = useState<CustomSiteConfig | null>(null);

  useEffect(() => {
    loadSiteConfig();
  }, [siteSlug]);

  const loadSiteConfig = async () => {
    try {
      console.log('Loading site config for slug:', siteSlug);
      
      // Load site data with affiliate info
      const { data: siteData, error: siteError } = await supabase
        .from('custom_affiliate_sites')
        .select(`
          *,
          affiliates:affiliate_id (
            affiliate_code
          )
        `)
        .eq('site_slug', siteSlug)
        .eq('is_active', true)
        .single();

      if (siteError) {
        console.error('Error loading site:', siteError);
        setSiteConfig(null);
        onSiteLoaded(null);
        return;
      }

      if (!siteData) {
        console.log('No site found for slug:', siteSlug);
        setSiteConfig(null);
        onSiteLoaded(null);
        return;
      }

      // Load site collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('site_product_collections')
        .select('shopify_collection_handle')
        .eq('site_id', siteData.id)
        .eq('is_enabled', true)
        .order('display_order');

      if (collectionsError) {
        console.error('Error loading collections:', collectionsError);
      }

      const config: CustomSiteConfig = {
        id: siteData.id,
        site_slug: siteData.site_slug,
        site_name: siteData.site_name,
        business_name: siteData.business_name,
        business_address: siteData.business_address,
        custom_promo_code: siteData.custom_promo_code,
        site_type: siteData.site_type,
        affiliate_id: siteData.affiliate_id,
        affiliate_code: siteData.affiliates?.affiliate_code,
        collections: collectionsData?.map(c => c.shopify_collection_handle) || []
      };

      console.log('Site config loaded:', config);
      setSiteConfig(config);
      onSiteLoaded(config);

    } catch (error) {
      console.error('Error loading site configuration:', error);
      setSiteConfig(null);
      onSiteLoaded(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading custom site...</p>
        </div>
      </div>
    );
  }

  if (!siteConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The custom site "{siteSlug}" could not be found or is not active.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Main Site
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}