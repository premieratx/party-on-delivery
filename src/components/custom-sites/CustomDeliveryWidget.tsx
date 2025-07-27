import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DeliveryWidget } from '@/components/DeliveryWidget';

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

interface CustomDeliveryWidgetProps {
  siteConfig: CustomSiteConfig;
}

export function CustomDeliveryWidget({ siteConfig }: CustomDeliveryWidgetProps) {
  const location = useLocation();

  useEffect(() => {
    // Store custom site configuration in localStorage for the app to use
    const customSiteData = {
      isCustomSite: true,
      siteConfig: siteConfig,
      affiliateCode: siteConfig.affiliate_code,
      promoCode: siteConfig.custom_promo_code,
      businessAddress: siteConfig.business_address,
      deliveryAddress: (siteConfig as any).delivery_address || siteConfig.business_address,
      allowedCollections: siteConfig.collections,
      siteName: siteConfig.site_name,
      businessName: siteConfig.business_name,
      siteType: siteConfig.site_type,
      freeShipping: true // Custom sites get free shipping
    };

    localStorage.setItem('customSiteData', JSON.stringify(customSiteData));

    // Set affiliate code if available
    if (siteConfig.affiliate_code) {
      localStorage.setItem('affiliate_code', siteConfig.affiliate_code);
    }

    // Set promo code if available
    if (siteConfig.custom_promo_code) {
      localStorage.setItem('discount_code', siteConfig.custom_promo_code);
    }

    // Pre-fill delivery address if available
    const deliveryAddress = (siteConfig as any).delivery_address || siteConfig.business_address;
    if (deliveryAddress) {
      localStorage.setItem('prefilled_delivery_address', JSON.stringify(deliveryAddress));
    }

    // Set free shipping for custom sites
    localStorage.setItem('free_shipping_enabled', 'true');

    console.log('Custom site configuration applied:', customSiteData);

    // Clean up on unmount
    return () => {
      localStorage.removeItem('customSiteData');
    };
  }, [siteConfig]);

  // Add custom branding to document
  useEffect(() => {
    document.title = `${siteConfig.site_name} - Delivery & Party Planning`;
    
    // Add custom meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        `Order delivery and party planning services through ${siteConfig.business_name}. Powered by Party on Delivery.`
      );
    }

    return () => {
      document.title = 'Party on Delivery - Austin Premium Delivery & Party Planning';
    };
  }, [siteConfig]);

  return (
    <div className="custom-site-wrapper">
      {/* Custom site header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-white py-4 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{siteConfig.site_name}</h1>
              <p className="text-sm opacity-90">Powered by {siteConfig.business_name}</p>
            </div>
            <div className="text-right text-sm opacity-90">
              {siteConfig.custom_promo_code && (
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  Code: {siteConfig.custom_promo_code}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main delivery widget */}
      <DeliveryWidget />

      {/* Custom site footer */}
      <div className="bg-muted/50 py-4 px-6 text-center text-sm text-muted-foreground border-t">
        <p>
          This custom delivery service is provided by {siteConfig.business_name} 
          {siteConfig.affiliate_code && ` (Partner Code: ${siteConfig.affiliate_code})`}
        </p>
        <p className="mt-1">
          Powered by <a href="/" className="text-primary hover:underline">Party on Delivery</a>
        </p>
      </div>
    </div>
  );
}