import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CustomSiteLoader } from '@/components/custom-sites/CustomSiteLoader';
import { CustomDeliveryWidget } from '@/components/custom-sites/CustomDeliveryWidget';

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

export default function CustomSiteView() {
  const { siteSlug } = useParams<{ siteSlug: string }>();
  const [siteConfig, setSiteConfig] = useState<CustomSiteConfig | null>(null);

  const handleSiteLoaded = (config: CustomSiteConfig | null) => {
    setSiteConfig(config);
  };

  if (!siteSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Site URL</h1>
          <p className="text-muted-foreground mb-4">No site slug provided.</p>
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

  return (
    <CustomSiteLoader siteSlug={siteSlug} onSiteLoaded={handleSiteLoaded}>
      {siteConfig && <CustomDeliveryWidget siteConfig={siteConfig} />}
    </CustomSiteLoader>
  );
}