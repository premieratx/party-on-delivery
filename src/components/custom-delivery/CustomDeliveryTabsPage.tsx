import React from 'react';
import ProductCategories from '@/components/delivery/ProductCategories';

interface CustomDeliveryTabsPageProps {
  appName: string;
  heroHeading?: string;
  heroSubheading?: string;
  heroScrollingText?: string;
  logoUrl?: string;
  collectionsConfig: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
      subheadline_text?: string;
      subheadline_font?: 'default' | 'playfair' | 'oswald' | 'montserrat';
      subheadline_size?: 'sm' | 'md' | 'lg' | 'xl';
    }>;
  };
  onAddToCart: (item: any) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  cartItems: any[];
  onUpdateQuantity: (id: string, variant: string | undefined, quantity: number) => void;
  onProceedToCheckout: () => void;
  onBack?: () => void;
  onGoHome: () => void;
}

export const CustomDeliveryTabsPage: React.FC<CustomDeliveryTabsPageProps> = ({
  appName,
  heroHeading,
  heroSubheading,
  logoUrl,
  collectionsConfig,
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onGoHome,
  heroScrollingText,
}) => {
  // Don't render ProductCategories hero section - delivery apps have their own
  return (
    <div className="min-h-screen bg-background">
      {/* Custom delivery app hero section here (not ProductCategories hero) */}
      <div className="relative min-h-[60vh] flex flex-col justify-center px-4 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
            {heroHeading || appName}
          </h1>
          {heroSubheading && (
            <p className="text-xl lg:text-2xl text-white/90 font-medium">
              {heroSubheading}
            </p>
          )}
          {heroScrollingText && (
            <p className="text-lg text-white/80">
              {heroScrollingText}
            </p>
          )}
        </div>
      </div>
      
      {/* Use ProductCategories ONLY for the products/tabs, not the hero */}
      <ProductCategories 
        customSiteSlug={appName}
        hideContent={false}
      />
    </div>
  );
};