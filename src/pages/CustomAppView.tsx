import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { CustomDeliveryStartScreen } from '@/components/custom-delivery/CustomDeliveryStartScreen';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { CustomDeliveryCart } from '@/components/custom-delivery/CustomDeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CustomDeliveryStep = 'start' | 'tabs' | 'cart';

interface CustomCartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  category?: string;
}

interface CustomDeliveryInfo {
  selectedDate: string | null;
  selectedTime: string | null;
  customerInfo: any | null;
  deliveryAddress: any | null;
  specialInstructions: string;
}

interface DeliveryAppConfig {
  app_name: string;
  app_slug: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  start_screen_config?: {
    title: string;
    subtitle: string;
  };
  main_app_config?: {
    hero_heading: string;
  };
  post_checkout_config?: {
    heading: string;
    subheading: string;
    redirect_url: string;
  };
}

export default function CustomAppView() {
  const { appName } = useParams<{ appName: string }>();
  useWakeLock();
  
  const [currentStep, setCurrentStep] = useReliableStorage<CustomDeliveryStep>('customDeliveryStep', 'start');
  const [deliveryInfo, setDeliveryInfo] = useLocalStorage<CustomDeliveryInfo>('customDeliveryInfo', {
    selectedDate: null,
    selectedTime: null,
    customerInfo: null,
    deliveryAddress: null,
    specialInstructions: ''
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appConfig, setAppConfig] = useState<DeliveryAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  const cartHook = useUnifiedCart();
  const { cartItems, addToCart, updateQuantity, emptyCart, getTotalItems, getTotalPrice } = cartHook;

  // Load app configuration
  useEffect(() => {
    const loadAppConfig = async () => {
      if (!appName) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appName)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error loading app config:', error);
          toast.error('Delivery app not found');
          return;
        }

        if (data) {
          const typedConfig = {
            app_name: data.app_name,
            app_slug: data.app_slug,
            collections_config: data.collections_config as {
              tab_count: number;
              tabs: Array<{
                name: string;
                collection_handle: string;
                icon?: string;
              }>;
            },
            start_screen_config: data.start_screen_config as {
              title: string;
              subtitle: string;
            } | undefined,
            main_app_config: data.main_app_config as {
              hero_heading: string;
            } | undefined,
            post_checkout_config: data.post_checkout_config as {
              heading: string;
              subheading: string;
              redirect_url: string;
            } | undefined
          };
          setAppConfig(typedConfig);
        }
      } catch (error) {
        console.error('Error loading app config:', error);
        toast.error('Failed to load delivery app');
      } finally {
        setLoading(false);
      }
    };

    loadAppConfig();
  }, [appName]);

  const handleStartOrder = () => {
    // Store custom app context for checkout redirect
    if (appConfig) {
      sessionStorage.setItem('custom-app-context', JSON.stringify({
        appSlug: appConfig.app_slug,
        appName: appConfig.app_name
      }));
    }
    setCurrentStep('tabs');
  };

  const handleSearchProducts = () => {
    // Store custom app context for checkout redirect
    if (appConfig) {
      sessionStorage.setItem('custom-app-context', JSON.stringify({
        appSlug: appConfig.app_slug,
        appName: appConfig.app_name
      }));
    }
    setCurrentStep('tabs');
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleAddToCart = (product: Omit<CustomCartItem, 'quantity'>) => {
    console.log('Adding product to cart:', product);
    addToCart({
      ...product,
      name: product.title
    });
  };

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    console.log('Updating quantity:', productId, quantity);
    updateQuantity(productId, variantId, quantity);
  };

  const handleRemoveFromCart = (productId: string, variantId?: string) => {
    console.log('Removing from cart:', productId);
    updateQuantity(productId, variantId, 0);
  };

  const handleEmptyCart = () => {
    console.log('Emptying cart');
    emptyCart();
  };

  const handleCheckout = () => {
    console.log('Proceeding to checkout');
    setIsCartOpen(false);
    
    // Store custom app context for checkout redirect
    if (appConfig) {
      sessionStorage.setItem('custom-app-context', JSON.stringify({
        appSlug: appConfig.app_slug,
        appName: appConfig.app_name
      }));
      localStorage.setItem('custom-app-source', appConfig.app_slug);
    }
    
    // Convert cart items to proper format
    const checkoutItems = cartItems.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: Math.max(1, item.quantity),
      image: item.image,
      productId: item.id,
      variant: item.variant || 'gid://shopify/ProductVariant/default',
      category: 'delivery-app',
      eventName: appConfig?.app_name || 'Custom Delivery',
      name: item.title
    }));
    
    // Store in both formats for compatibility
    localStorage.setItem('unified-cart', JSON.stringify(checkoutItems));
    localStorage.setItem('party-cart', JSON.stringify(checkoutItems));
    
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading delivery app...</p>
        </div>
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Delivery App Not Found</h1>
          <p className="text-muted-foreground">The requested delivery app could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Start Screen */}
      {currentStep === 'start' && (
        <CustomDeliveryStartScreen
          appName={appConfig.app_name}
          title={appConfig.start_screen_config?.title || appConfig.app_name}
          subtitle={appConfig.start_screen_config?.subtitle || 'Order your party supplies for delivery'}
          onStartOrder={handleStartOrder}
          onSearchProducts={handleSearchProducts}
          onGoHome={handleGoHome}
        />
      )}

      {/* Tabs Page */}
      {currentStep === 'tabs' && (
        <CustomDeliveryTabsPage
          appName={appConfig.app_name}
          heroHeading={appConfig.main_app_config?.hero_heading || `Order ${appConfig.app_name}`}
          collectionsConfig={appConfig.collections_config}
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={handleBackToStart}
          onGoHome={handleGoHome}
        />
      )}

      {/* Custom Delivery Cart */}
      <CustomDeliveryCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onEmptyCart={handleEmptyCart}
        onCheckout={handleCheckout}
        totalPrice={getTotalPrice()}
        deliveryInfo={{
          date: deliveryInfo.selectedDate ? new Date(deliveryInfo.selectedDate) : null,
          timeSlot: deliveryInfo.selectedTime,
          address: deliveryInfo.deliveryAddress
        }}
      />

      {/* Bottom Cart Bar */}
      {currentStep === 'tabs' && getTotalItems() > 0 && (
        <BottomCartBar
          items={cartItems}
          totalPrice={getTotalPrice()}
          isVisible={true}
          onOpenCart={() => setIsCartOpen(true)}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}