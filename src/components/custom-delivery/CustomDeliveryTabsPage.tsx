import React from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';

interface CustomDeliveryTabsPageProps {
  appName: string;
  heroHeading?: string;
  collectionsConfig: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
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
    <div className="min-h-screen bg-background">
      <ProductCategories
        onAddToCart={onAddToCart}
        cartItemCount={cartItemCount}
        onOpenCart={onOpenCart}
        cartItems={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onProceedToCheckout={onProceedToCheckout}
        customAppName={appName}
        customHeroHeading={heroHeading}
        customCollections={collectionsConfig}
      />
    </div>
  );
};