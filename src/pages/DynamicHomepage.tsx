import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';

interface HomepageDeliveryApp {
  id: string;
  app_name: string;
  app_slug: string;
  collections_config: {
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
  main_app_config?: {
    hero_heading?: string;
    hero_subheading?: string;
  };
  logo_url?: string;
}

export default function DynamicHomepage() {
  const navigate = useNavigate();
  const [homepageApp, setHomepageApp] = useState<HomepageDeliveryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useUnifiedCart();
  
  const { openCart } = useGlobalCart();

  useEffect(() => {
    loadHomepageApp();
  }, []);

  const loadHomepageApp = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_homepage', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      if (!data) {
        console.log('⚠️ No homepage app configured');
        setError('No homepage delivery app configured');
        return;
      }

      const processedApp: HomepageDeliveryApp = {
        id: data.id,
        app_name: data.app_name,
        app_slug: data.app_slug,
        collections_config: {
          tab_count: (data.collections_config as any)?.tab_count || 0,
          tabs: (data.collections_config as any)?.tabs || []
        },
        main_app_config: (data.main_app_config as any) || {},
        logo_url: data.logo_url || ''
      };
      
      setHomepageApp(processedApp);
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(`System error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: any) => {
    console.log('🛒 Adding to cart from homepage:', item);
    addToCart(item);
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    updateQuantity(id, variant, quantity);
  };

  const handleProceedToCheckout = () => {
    console.log('🛒 Navigating to checkout from homepage');
    // Enhanced referrer tracking for proper "Back to Cart" functionality
    const currentUrl = window.location.pathname + window.location.search;
    try {
      localStorage.setItem('last-delivery-app-url', currentUrl);
      localStorage.setItem('deliveryAppReferrer', currentUrl);
      console.log('Stored delivery app referrer:', currentUrl);
    } catch (error) {
      console.warn('Failed to store delivery app referrer:', error);
    }
    navigate('/checkout');
  };

  const handleGoHome = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    // Show demo cover page on error
    const DemoCoverPage = React.lazy(() => import('@/components/demo/DemoCoverPage'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <DemoCoverPage />
      </React.Suspense>
    );
  }
  // Safety check - show demo if no collections configured
  if (!homepageApp.collections_config?.tabs || homepageApp.collections_config.tabs.length === 0) {
    const DemoCoverPage = React.lazy(() => import('@/components/demo/DemoCoverPage'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <DemoCoverPage />
      </React.Suspense>
    );
  }

  // Show demo cover page if no app configured
  if (!homepageApp) {
    const DemoCoverPage = React.lazy(() => import('@/components/demo/DemoCoverPage'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <DemoCoverPage />
      </React.Suspense>
    );
  }

  return (
    <CustomDeliveryTabsPage
      appName={homepageApp.app_name}
      heroHeading={homepageApp.main_app_config?.hero_heading || homepageApp.app_name}
      heroSubheading={homepageApp.main_app_config?.hero_subheading || 'Premium delivery service'}
      logoUrl={homepageApp.logo_url}
      collectionsConfig={homepageApp.collections_config}
      onAddToCart={handleAddToCart}
      cartItemCount={getTotalItems()}
      onOpenCart={openCart}
      cartItems={cartItems}
      onUpdateQuantity={handleUpdateQuantity}
      onProceedToCheckout={handleProceedToCheckout}
      onGoHome={handleGoHome}
    />
  );
}