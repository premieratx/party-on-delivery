import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';
import UltraSimplePage from './UltraSimplePage';
import { HomepageCoverModal } from '@/components/common/HomepageCoverModal';

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
    hero_scrolling_text?: string;
  };
  logo_url?: string;
}

export default function DynamicHomepage() {
  const navigate = useNavigate();
  const [homepageApp, setHomepageApp] = useState<HomepageDeliveryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);
  
  console.log('🏠 DynamicHomepage render - Loading:', loading, 'Error:', error, 'App:', !!homepageApp);
  
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
    console.log('🏠 Loading homepage app...');
    
    try {
      // Get the homepage app
      console.log('🔍 Querying delivery_app_variations table...');
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_homepage', true)
        .eq('is_active', true)
        .maybeSingle();

      console.log('🔍 Query result:', { data: !!data, error, appName: data?.app_name });

      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        setHomepageApp(null);
      } else if (!data) {
        console.log('⚠️ No homepage app configured');
        setHomepageApp(null);
      } else {
        console.log('✅ Processing homepage app:', data.app_name);
        
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
        
        console.log('✅ Setting homepage app:', processedApp.app_name, 'with', processedApp.collections_config.tabs.length, 'tabs');
        setHomepageApp(processedApp);
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(`System error: ${err.message}`);
      setHomepageApp(null);
    } finally {
      console.log('🔄 Setting loading to false');
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
    // Store current delivery app referrer for back navigation
    localStorage.setItem('deliveryAppReferrer', window.location.pathname);
    navigate('/checkout');
  };

  const handleGoHome = () => {
    window.location.reload();
  };

  const handleAppSelect = (selectedAppSlug: string) => {
    localStorage.setItem('preferred-delivery-app', selectedAppSlug);
    setShowCoverModal(false);
    navigate(`/app/${selectedAppSlug}`);
  };

  const handleCoverDismiss = () => {
    setShowCoverModal(false);
    // Load default app when cover is dismissed
    loadHomepageApp();
  };

  console.log('🏠 DynamicHomepage render - Loading:', loading, 'Error:', error, 'App:', !!homepageApp, 'ShowCover:', showCoverModal);
  
  if (loading) {
    console.log('🏠 Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading homepage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🏠 Rendering error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-800 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Configuration Error</h2>
          <p className="text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/admin'}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no homepage app is configured, show the simple fallback page
  if (!homepageApp && !showCoverModal) {
    console.log('🏠 Rendering fallback page - No homepage app configured');
    return <UltraSimplePage />;
  }

  // Render cover modal first if needed
  if (showCoverModal) {
    console.log('🏠 Rendering cover modal');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <HomepageCoverModal 
          onAppSelect={handleAppSelect}
          onDismiss={handleCoverDismiss}
        />
      </div>
    );
  }

  // Render the configured homepage delivery app
  console.log('🏠 Rendering homepage app:', homepageApp?.app_name);
  if (!homepageApp) {
    console.log('❌ homepageApp is null but we reached the render section!');
    return <UltraSimplePage />;
  }
  return (
    <CustomDeliveryTabsPage
      appName={homepageApp.app_name}
      heroHeading={homepageApp.main_app_config?.hero_heading || homepageApp.app_name}
      heroSubheading={homepageApp.main_app_config?.hero_subheading || 'Premium delivery service'}
      heroScrollingText={homepageApp.main_app_config?.hero_scrolling_text || 'Fast & Reliable'}
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