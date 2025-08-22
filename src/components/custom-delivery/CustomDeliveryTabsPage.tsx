import React from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';

interface CustomDeliveryTabsPageProps {
  appName: string;
  heroHeading?: string;
  heroSubheading?: string;
  logoUrl?: string;
  appConfig?: any; // App configuration including hero_config
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
  appConfig,
  collectionsConfig,
  onAddToCart,
  cartItemCount,
  onOpenCart,
  cartItems,
  onUpdateQuantity,
  onProceedToCheckout,
  onBack,
  onGoHome,
}) => {
  // Use the exact same ProductCategories component as the main delivery app
  // This ensures identical layout, styling, and functionality
  return (
    <ProductCategories
      appName={appName}
      heroHeading={heroHeading}
      heroSubheading={heroSubheading}
      logoUrl={logoUrl}
      appConfig={appConfig}
      collectionsConfig={collectionsConfig}
      onAddToCart={onAddToCart}
      cartItemCount={cartItemCount}
      onOpenCart={onOpenCart}
      cartItems={cartItems}
      onUpdateQuantity={onUpdateQuantity}
      onProceedToCheckout={onProceedToCheckout}
      onBack={onBack}
      onGoHome={onGoHome}
      showSearch={true}
      maxProducts={50}
    />
  );
};