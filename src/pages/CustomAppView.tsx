import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { CustomDeliveryCart } from '@/components/custom-delivery/CustomDeliveryCart';
import { BottomCartBar } from '@/components/common/BottomCartBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomDeliveryCoverModal } from '@/components/custom-delivery/CustomDeliveryCoverModal';
import bgImage from '@/assets/old-fashioned-bg.jpg';

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

interface DeliveryAppConfig {
  app_name: string;
  app_slug: string;
  logo_url?: string;
  collections_config: {
    tab_count: number;
    tabs: Array<{
      name: string;
      collection_handle: string;
      icon?: string;
    }>;
  };
  start_screen_config?: {
    title?: string;
    subtitle?: string;
    logo_url?: string;
  };
  main_app_config?: {
    hero_heading: string;
    hero_subheading?: string;
    hero_scrolling_text?: string;
    cover_modal?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      phone?: string;
      sms?: string;
    };
  };
  post_checkout_config?: {
    heading: string;
    subheading: string;
    redirect_url: string;
    button_text?: string;
  };
}

// Centralized app config fetcher with caching
const fetchAppConfig = async (appName: string): Promise<DeliveryAppConfig | null> => {
  if (!appName) return null;

  const { data, error } = await supabase
    .from('delivery_app_variations')
    .select('*')
    .eq('app_slug', appName)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error loading app config:', error);
    throw new Error('Failed to load delivery app configuration');
  }

  if (!data) return null;

    return {
      app_name: data.app_name,
      app_slug: data.app_slug,
      logo_url: data.logo_url,
      collections_config: data.collections_config as {
        tab_count: number;
        tabs: Array<{
          name: string;
          collection_handle: string;
          icon?: string;
        }>;
      },
      start_screen_config: data.start_screen_config as any,
      main_app_config: data.main_app_config as any,
      post_checkout_config: data.post_checkout_config as {
        heading: string;
        subheading: string;
        redirect_url: string;
        button_text?: string;
      } | undefined
    };
};

// Optimized storage hook
const useAppStep = (initialStep: CustomDeliveryStep = 'start') => {
  const [step, setStep] = useState<CustomDeliveryStep>(() => {
    try {
      // If initial step is explicitly 'start', always prefer it to avoid flicker
      if (initialStep === 'start') return 'start';
      const stored = sessionStorage.getItem('customDeliveryStep');
      return (stored as CustomDeliveryStep) || initialStep;
    } catch {
      return initialStep;
    }
  });

  const updateStep = (newStep: CustomDeliveryStep) => {
    setStep(newStep);
    try {
      sessionStorage.setItem('customDeliveryStep', newStep);
    } catch (error) {
      console.warn('Failed to save step to sessionStorage:', error);
    }
  };

  return [step, updateStep] as const;
};

export default function CustomAppView() {
  const { appName } = useParams<{ appName: string }>();
  const navigate = useNavigate(); // Add navigate hook
  const [searchParams] = useSearchParams();
  useWakeLock();
  
  // Determine initial step from URL (force 'start' to avoid flicker)
  const initialStepParam = (searchParams.get('step') as CustomDeliveryStep) || 'start';
  const [currentStep, setCurrentStep] = useAppStep(initialStepParam);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  
  const cartHook = useUnifiedCart();
  const { cartItems, addToCart, updateQuantity, emptyCart, getTotalItems, getTotalPrice } = cartHook;

  // Optimized app config loading with React Query caching
  const {
    data: appConfig,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['delivery-app-config', appName],
    queryFn: () => fetchAppConfig(appName!),
    enabled: !!appName,
    staleTime: 10 * 60 * 1000, // 10 minutes - configs don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache (updated from cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized app context to prevent unnecessary re-renders
  const appContext = useMemo(() => {
    if (!appConfig) return null;
    return {
      appSlug: appConfig.app_slug,
      appName: appConfig.app_name
    };
  }, [appConfig]);

  // Store app context in session storage when available
  useEffect(() => {
    if (appContext) {
      try {
        sessionStorage.setItem('custom-app-context', JSON.stringify(appContext));
        // Session-based home override: make this delivery app the Home for the session
        sessionStorage.setItem('home-override', `/app/${appContext.appSlug}`);
      } catch (error) {
        console.warn('Failed to store app context:', error);
      }
    }
  }, [appContext]);

  const resolved = useMemo(() => {
    if (!appConfig) return {
      title: 'Welcome',
      subtitle: 'Exclusive concierge delivery',
      logoUrl: undefined,
      buttonText: 'Order Now',
      checklist: ['Locally Owned', 'Same Day Delivery', 'Cocktail Kits on Demand']
    };
    const cfg: any = appConfig.start_screen_config || {};
    return {
      title: cfg.custom_title || cfg.title || appConfig.app_name || 'Welcome',
      subtitle: cfg.custom_subtitle || cfg.subtitle || 'Exclusive concierge delivery',
      logoUrl: cfg.logo_url || appConfig.logo_url,
      buttonText: cfg.start_button_text || 'Order Now',
      checklist: [
        cfg.checklist_item_1 || 'Locally Owned',
        cfg.checklist_item_2 || 'Same Day Delivery',
        cfg.checklist_item_3 || 'Cocktail Kits on Demand',
        cfg.checklist_item_4 || 'Private Event Specialists',
        cfg.checklist_item_5 || 'Delivering All Over Austin',
      ],
    };
  }, [appConfig]);

  const startBgVideo = useMemo(() => {
    try {
      const fromParams = searchParams.get('bgVideo') || searchParams.get('video');
      const fromConfig = (appConfig?.start_screen_config as any)?.background_video_url;
      return (fromParams || fromConfig || '/videos/whiskey-over-ice-5143-360.mp4') as string | undefined;
    } catch {
      return '/videos/whiskey-over-ice-5143-360.mp4';
    }
  }, [searchParams, appConfig]);

  const goToAppTabs = () => {
    try { if (appConfig) sessionStorage.setItem(`startSeen_${appConfig.app_slug}`, '1'); } catch {}
    const aff = searchParams.get('aff') || undefined;
    const params = new URLSearchParams(searchParams);
    params.set('step', 'tabs');
    if (aff) params.set('aff', aff);
    navigate(`?${params.toString()}`, { replace: true });
    setCurrentStep('tabs');
  };

  // Prefill delivery address for Premier app
  useEffect(() => {
    if (appConfig?.app_slug === 'premier-party-cruises---official-alcohol-delivery-service') {
      try {
        localStorage.setItem('prefilled_delivery_address', JSON.stringify({
          street: '13993 FM 2769',
          city: 'Leander',
          state: 'TX',
          zip_code: '78641',
          instructions: ''
        }));
      } catch {}
    }
  }, [appConfig]);

  // Cover modal disabled per new design (single start screen only)
  useEffect(() => {
    setCoverOpen(false);
  }, [appConfig]);
  // URL overrides: step and open cart for shareable links
  useEffect(() => {
    try {
      const stepParam = searchParams.get('step') as CustomDeliveryStep | null;
      const aff = searchParams.get('aff');
      if (stepParam && (stepParam === 'start' || stepParam === 'tabs' || stepParam === 'cart')) {
        setCurrentStep(stepParam);
      }
      if (aff) {
        try { localStorage.setItem('affiliate_code', aff); } catch {}
      }
      if (searchParams.get('cart') === '1' || searchParams.get('openCart') === '1') {
        setIsCartOpen(true);
      }
    } catch (e) {
      console.warn('Failed to parse URL params for CustomAppView');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-show Start screen once per app if enabled and not seen
  useEffect(() => {
    if (!appConfig) return;
    const enabled = (appConfig.start_screen_config as any)?.enabled !== false;
    const seenKey = `startSeen_${appConfig.app_slug}`;
    const seen = sessionStorage.getItem(seenKey);
    if (enabled && !seen) {
      setCurrentStep('start');
    }
  }, [appConfig]);

  // Ensure returning 'Home' or revisiting app within the same session skips cover
  useEffect(() => {
    if (!appConfig) return;
    const seen = sessionStorage.getItem(`startSeen_${appConfig.app_slug}`);
    if (seen && currentStep === 'start') {
      setCurrentStep('tabs');
    }
  }, [appConfig, currentStep]);

  const handleSearchProducts = () => {
    try { if (appConfig) sessionStorage.setItem(`startSeen_${appConfig.app_slug}`, '1'); } catch {}
    setCurrentStep('tabs');
  };
  const handleGoHome = () => {
    try {
      const override = sessionStorage.getItem('home-override');
      if (override) {
        navigate(override);
        return;
      }
    } catch (e) {
      // ignore
    }
    navigate('/');
  };

  const handleAddToCart = (product: Omit<CustomCartItem, 'quantity'>) => {
    console.log('🛒 CustomApp: Adding product to cart:', product);
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
    console.log('🛒 CustomApp: Updating quantity:', productId, variantId, 'to', quantity);
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
    if (appContext) {
      try {
        localStorage.setItem('custom-app-source', appContext.appSlug);
        // Also set the delivery app referrer for proper back navigation
        localStorage.setItem('deliveryAppReferrer', `/app/${appContext.appSlug}`);
      } catch (error) {
        console.warn('Failed to store app source:', error);
      }
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
    
    console.log('✅ CustomAppView: Navigating to checkout with unified cart data');
    // No need to store cart data - unified cart handles persistence
    navigate('/checkout');
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading delivery app...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Load App</h1>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'The delivery app could not be loaded. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // App not found
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
      {currentStep === 'start' && (
        <CustomDeliveryCoverModal
          open={true}
          onOpenChange={() => {}}
          onStartOrder={goToAppTabs}
          appName={appConfig.app_name}
          logoUrl={resolved.logoUrl}
          title={resolved.title}
          subtitle={resolved.subtitle}
          buttonText={resolved.buttonText}
          checklistItems={resolved.checklist}
          backgroundImageUrl={bgImage}
          backgroundVideoUrl={startBgVideo}
        />
      )}
      {/* Start screen enabled above; tabs shown behind/after with blur */}
      <div className={currentStep === 'start' ? 'pointer-events-none blur-sm' : ''}>
        <CustomDeliveryTabsPage
          appName={appConfig.app_name}
          heroHeading={appConfig.main_app_config?.hero_heading || `Order ${appConfig.app_name}`}
          heroSubheading={appConfig.main_app_config?.hero_subheading || "Select from our curated collection of drinks and party supplies"}
          logoUrl={appConfig.logo_url}
          collectionsConfig={appConfig.collections_config}
          onAddToCart={handleAddToCart}
          cartItemCount={getTotalItems()}
          onOpenCart={() => setIsCartOpen(true)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToCheckout={handleCheckout}
          onBack={handleGoHome}
          onGoHome={handleGoHome}
          heroScrollingText={currentStep === 'tabs' ? appConfig.main_app_config?.hero_scrolling_text : undefined}
        />
      </div>

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
          date: null,
          timeSlot: null,
          address: null
        }}
      />

      {/* Bottom Cart Bar */}
      <BottomCartBar
        items={cartItems}
        totalPrice={getTotalPrice()}
        isVisible={true}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}