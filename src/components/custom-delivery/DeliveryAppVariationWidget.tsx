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
import { useNavigate } from 'react-router-dom';

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
  hero_heading?: string;
  hero_subheading?: string;
  logo_url?: string;
  main_app_config?: {
    hero_heading?: string;
    hero_subheading?: string;
    logo_size?: number;
    headline_size?: number;
    subheadline_size?: number;
    logo_vertical_pos?: number;
    headline_vertical_pos?: number;
    subheadline_vertical_pos?: number;
    background_image_url?: string;
    background_opacity?: number;
    overlay_color?: string;
    headline_font?: string;
    headline_color?: string;
    subheadline_font?: string;
    subheadline_color?: string;
  };
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
  const navigate = useNavigate();

  // Load app configuration
  useEffect(() => {
    async function loadAppConfig() {
      try {
        console.log('🔄 Loading delivery app config for slug:', appSlug);
        
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appSlug)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('❌ Error loading app config:', error);
          setAppConfig(null);
          return;
        }

        console.log('✅ Raw loaded app config:', data);
        console.log('🔥 CRITICAL DEBUG - Raw main_app_config from DB:', data.main_app_config);
        
        // Ensure main_app_config is properly parsed as JSON if it's a string
        let parsedData = { ...data };
        
        if (typeof data.main_app_config === 'string') {
          try {
            parsedData.main_app_config = JSON.parse(data.main_app_config);
            console.log('📋 Parsed main_app_config from string:', parsedData.main_app_config);
          } catch (e) {
            console.error('❌ Failed to parse main_app_config:', e);
            parsedData.main_app_config = {};
          }
        } else if (data.main_app_config) {
          console.log('📋 main_app_config already object:', data.main_app_config);
        } else {
          console.log('⚠️ No main_app_config found, using empty object');
          parsedData.main_app_config = {};
        }

        console.log('🔥 CRITICAL DEBUG - Final parsed hero_heading:', (parsedData.main_app_config as any)?.hero_heading);
        console.log('🔥 CRITICAL DEBUG - Final parsed hero_subheading:', (parsedData.main_app_config as any)?.hero_subheading);
        console.log('🎯 FIXED - Direct hero_heading from DB:', (parsedData as any).hero_heading);
        console.log('🎯 FIXED - Direct hero_subheading from DB:', (parsedData as any).hero_subheading);
        console.log('🚨 ULTIMATE DEBUG - Raw data from database:', data);
        console.log('🚨 ULTIMATE DEBUG - ALL database fields:', Object.keys(data).sort());
        
        // Ensure collections_config is properly parsed as JSON if it's a string
        if (typeof data.collections_config === 'string') {
          try {
            parsedData.collections_config = JSON.parse(data.collections_config);
          } catch (e) {
            console.error('❌ Failed to parse collections_config:', e);
            parsedData.collections_config = { tabs: [] };
          }
        } else if (!data.collections_config) {
          parsedData.collections_config = { tabs: [] };
        }
        
        console.log('🎯 Final parsed delivery app config:', parsedData);
        
        setAppConfig(parsedData as unknown as DeliveryAppConfig);
      } catch (error) {
        console.error('💥 Failed to load app config:', error);
        setAppConfig(null);
      } finally {
        setLoading(false);
      }
    }

    if (appSlug) {
      loadAppConfig();
    } else {
      setLoading(false);
    }
  }, [appSlug]);

  const handleStartOrder = () => {
    setCurrentStep('products');
  };

  const handleGoHome = () => {
    navigate('/');
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
    navigate('/checkout');
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
          heroHeading={appConfig.main_app_config?.hero_heading || ''}
          heroSubheading={appConfig.main_app_config?.hero_subheading || ''}
          logoUrl={appConfig.logo_url}
          mainAppConfig={appConfig.main_app_config}
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