import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';
import UltraSimplePage from './UltraSimplePage';

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
    console.log('🏠 Starting homepage app load...');
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Homepage load timeout, using fallback');
      setLoading(false);
      setHomepageApp(null);
    }, 5000);

    try {
      console.log('🔍 Querying delivery_app_variations table...');
      
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_homepage', true)
        .eq('is_active', true)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === 'PGRST116') {
          // No homepage app set
          console.log('⚠️ No homepage app configured, using fallback');
          setHomepageApp(null);
        } else {
          console.error('❌ Error loading homepage app:', error);
          setError(`Database error: ${error.message}`);
          setHomepageApp(null);
        }
      } else {
        console.log('✅ Loaded homepage app:', data?.app_name || 'Unknown');
        
        // Process the app data to ensure proper structure
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
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Failed to load homepage app:', error);
      setError(error.message || 'Unknown error occurred');
      setHomepageApp(null); // Fallback to simple page
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

  if (loading) {
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
  if (!homepageApp) {
    console.log('🏠 No homepage app configured, showing fallback page');
    return <UltraSimplePage />;
  }

  // Render the configured homepage delivery app
  console.log('🏠 Rendering homepage app:', homepageApp.app_name);
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