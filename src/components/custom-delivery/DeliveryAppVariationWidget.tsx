import React, { useState, useEffect } from 'react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useReliableStorage } from '@/hooks/useReliableStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { CustomDeliveryIntro } from './CustomDeliveryIntro';
import { CustomProductCategories } from './CustomProductCategoriesVariation';
import { CustomDeliveryCart } from './CustomDeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CustomDeliveryStep = 'intro' | 'products' | 'cart';

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

interface DeliveryAppVariationWidgetProps {
  appSlug: string;
}

interface DeliveryAppConfig {
  app_name: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
}

export function DeliveryAppVariationWidget({ appSlug }: DeliveryAppVariationWidgetProps) {
  useWakeLock();
  
  const [currentStep, setCurrentStep] = useReliableStorage<CustomDeliveryStep>('customDeliveryStep', 'intro');
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
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error loading app config:', error);
          toast.error('Delivery app not found');
          return;
        }

        if (data) {
          // Type cast the data to match our interface
          const typedConfig = {
            app_name: data.app_name,
            collections_config: data.collections_config as {
              tab_count: number;
              tabs: Array<{
                name: string;
                collection_handle: string;
                icon?: string;
              }>;
            }
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
  }, [appSlug]);

  const handleStartOrder = () => {
    setCurrentStep('products');
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleAddToCart = (product: Omit<CustomCartItem, 'quantity'>) => {
    console.log('🛒 DeliveryAppVariationWidget: Adding product to cart:', product);
    // CRITICAL: Use ONLY updateQuantity to avoid dual cart system conflicts
    const currentQty = cartItems.find(item => {
      const itemId = item.productId || item.id;
      const itemVariant = item.variant || 'default';
      const checkVariant = product.variant || 'default';
      return itemId === product.id && itemVariant === checkVariant;
    })?.quantity || 0;
    
    updateQuantity(product.id, product.variant, currentQty + 1, {
      ...product,
      name: product.title,
      productId: product.id
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
    // Navigate to checkout with unified cart
    window.location.href = '/checkout';
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
      {/* Intro Step */}
      {currentStep === 'intro' && (
        <CustomDeliveryIntro
          appName={appConfig.app_name}
          onStartOrder={handleStartOrder}
          onGoHome={handleGoHome}
        />
      )}

      {/* Products Step */}
      {currentStep === 'products' && (
        <CustomProductCategories
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={() => setCurrentStep('intro')}
          onGoHome={handleGoHome}
          collectionsConfig={appConfig.collections_config}
          appName={appConfig.app_name}
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
      {currentStep === 'products' && getTotalItems() > 0 && (
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