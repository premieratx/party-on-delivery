// Step 5: Test delivery components imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { DeliveryCart } from '@/components/delivery/DeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';

const Home = () => {
  console.log('Home component with delivery components rendering...');
  useWakeLock();
  const { cartItems, updateQuantity, removeItem, emptyCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [homepageConfig, setHomepageConfig] = useState<any>(null);

  useEffect(() => {
    const loadHomepageConfig = async () => {
      try {
        const { data } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_homepage', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (data) setHomepageConfig(data);
        console.log('Homepage config loaded:', data);
      } catch (error) {
        console.error('Failed to load homepage config:', error);
      }
    };

    loadHomepageConfig();
  }, []);
  
  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: parseFloat(String(product.price)) || 0,
      image: product.image,
      variant: product.variant || 'default'
    };
    
    const currentQuantity = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      return itemId === cartItem.id && itemVariant === cartItem.variant;
    })?.quantity || 0;
    
    updateQuantity(cartItem.id, cartItem.variant, currentQuantity + 1, cartItem);
  };

  const handleCheckout = () => {
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: 'main-delivery-app',
      appName: 'Party On Delivery'
    }));
    navigate('/checkout');
  };

  const cartItemsForDisplay = cartItems.map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    variant: item.variant
  }));

  const deliveryInfo = {
    date: new Date(),
    timeSlot: '12:00 PM - 2:00 PM',
    address: 'Sample Address',
    instructions: ''
  };
  
  return (
    <div className="min-h-screen bg-background">
      <ProductCategories
        onAddToCart={handleAddToCart}
        cartItemCount={getTotalItems()}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItemsForDisplay}
        onUpdateQuantity={updateQuantity}
        onProceedToCheckout={handleCheckout}
        customAppName={homepageConfig?.app_name}
        customHeroHeading={homepageConfig?.main_app_config?.hero_heading}
        customHeroSubheading={homepageConfig?.main_app_config?.hero_subheading}
        customLogoUrl={homepageConfig?.logo_url}
        customCollections={homepageConfig?.collections_config}
      />

      <DeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItemsForDisplay}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
        deliveryInfo={deliveryInfo}
        onEmptyCart={emptyCart}
      />

      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={getTotalItems() > 0}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Home;