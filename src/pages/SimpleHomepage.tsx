import React from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';
import { useNavigate } from 'react-router-dom';

const SimpleHomepage = () => {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, getTotalItems } = useUnifiedCart();
  const { openCart } = useGlobalCart();

  const handleCheckout = () => {
    localStorage.setItem('deliveryAppReferrer', '/');
    navigate('/checkout');
  };

  return (
    <ProductCategories
      appName="Party On Delivery"
      heroHeading="Premium Alcohol Delivery"
      heroSubheading="Delivered fresh to your door"
      logoUrl=""
      cartItems={cartItems}
      onAddToCart={addToCart}
      cartItemCount={getTotalItems()}
      onOpenCart={openCart}
      onUpdateQuantity={updateQuantity}
      onProceedToCheckout={handleCheckout}
      collectionsConfig={{
        tab_count: 5,
        tabs: [
          { name: "Beer", collection_handle: "tailgate-beer" },
          { name: "Seltzers", collection_handle: "seltzer-collection" },
          { name: "Cocktails", collection_handle: "cocktail-kits" },
          { name: "Mixers & N/A", collection_handle: "mixers-non-alcoholic" },
          { name: "Spirits", collection_handle: "spirits" }
        ]
      }}
      customSiteSlug="main-delivery-app"
      maxProducts={50}
      forceRefresh={true}
      onCheckout={handleCheckout}
    />
  );
};

export default SimpleHomepage;