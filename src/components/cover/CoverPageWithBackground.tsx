import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';
import { CustomDeliveryTabsPage } from '@/components/custom-delivery/CustomDeliveryTabsPage';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useGlobalCart } from '@/components/common/GlobalCartProvider';
import { useDataFlowTracking } from '@/hooks/useDataFlowTracking';
import { DataFlowMonitor } from '@/components/tracking/DataFlowMonitor';
import { Loader2 } from 'lucide-react';

interface BackgroundApp {
  id: string;
  app_name: string;
  collections_config: any;
  main_app_config?: any;
  logo_url?: string;
}

const CoverPageWithBackground = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [backgroundApp, setBackgroundApp] = useState<BackgroundApp | null>(null);
  const { initializeCoverPageFlow, trackButtonClick, flowData } = useDataFlowTracking();
  
  // Mobile debugging
  useEffect(() => {
    console.log('🔍 MOBILE DEBUG: Component mounted');
    console.log('🔍 MOBILE DEBUG: Slug from URL:', slug);
    console.log('🔍 MOBILE DEBUG: User agent:', navigator.userAgent);
    console.log('🔍 MOBILE DEBUG: Window location:', window.location.href);
    console.log('🔍 MOBILE DEBUG: Screen dimensions:', window.screen.width, 'x', window.screen.height);
  }, []);
  
  // Just load the damn cover page - no unnecessary validation
  
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useUnifiedCart();
  
  const { openCart } = useGlobalCart();

  // Load cover page data
  const { data: coverPage, isLoading: loadingCover, error } = useQuery({
    queryKey: ['cover-page', slug],
    queryFn: async () => {
      if (!slug) {
        console.error('🔍 MOBILE DEBUG: No slug provided!');
        throw new Error('No slug provided');
      }
      
      console.log('🔍 MOBILE DEBUG: Loading cover page with slug:', slug);
      console.log('🔍 MOBILE DEBUG: Current URL:', window.location.href);
      console.log('🔍 MOBILE DEBUG: Supabase client available:', !!supabase);
      
      // Simple database lookup
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ MOBILE DEBUG: Database error:', error);
        console.error('❌ MOBILE DEBUG: Error details:', JSON.stringify(error));
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data) {
        console.log('✅ MOBILE DEBUG: Cover page found:', data.title);
        console.log('✅ MOBILE DEBUG: Cover page data:', JSON.stringify(data, null, 2));
        return data;
      }
      
      // Not found
      console.error('❌ MOBILE DEBUG: Cover page not found for slug:', slug);
      throw new Error(`Cover page not found: ${slug}`);
    },
    enabled: !!slug
  });

  // Load delivery apps for button URL resolution
  const { data: deliveryApps } = useQuery({
    queryKey: ['delivery-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_slug')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Initialize tracking when cover page loads (prevent infinite loops)
  useEffect(() => {
    if (coverPage && !flowData?.coverPageId) {
      // Extract affiliate code from URL or cover page data
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateCode = urlParams.get('affiliate') || coverPage.affiliate_slug;
      
      initializeCoverPageFlow(coverPage.id, coverPage.slug, affiliateCode);
      // Remove excessive logging - tracking works silently
    }
  }, [coverPage?.id, coverPage?.slug, initializeCoverPageFlow, flowData?.coverPageId]);

  // Preload default homepage app in background
  useEffect(() => {
    const loadBackgroundApp = async () => {
      try {
        console.log('🚀 Loading default homepage app for background...');
        
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_homepage', true)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Background app error:', error);
          return;
        }
        
        if (data) {
          const processedApp: BackgroundApp = {
            id: data.id,
            app_name: data.app_name,
            collections_config: data.collections_config || { tab_count: 0, tabs: [] },
            main_app_config: data.main_app_config || {},
            logo_url: data.logo_url || ''
          };
          
          console.log('✅ Background app loaded:', processedApp.app_name);
          setBackgroundApp(processedApp);
        }
      } catch (err) {
        console.error('❌ Failed to load background app:', err);
      }
    };

    loadBackgroundApp();
  }, []);

  const handleAddToCart = (item: any) => {
    console.log('🛒 Adding to cart from cover page:', item);
    addToCart(item);
  };

  const handleUpdateQuantity = (id: string, variant: string | undefined, quantity: number) => {
    updateQuantity(id, variant, quantity);
  };

  const handleProceedToCheckout = () => {
    console.log('🛒 Navigating to checkout from cover page');
    navigate('/checkout');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loadingCover) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !coverPage) {
    console.error('❌ MOBILE DEBUG: Showing error page');
    console.error('❌ MOBILE DEBUG: Error:', error);
    console.error('❌ MOBILE DEBUG: Cover page:', coverPage);
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The cover page you're looking for doesn't exist or has been disabled.</p>
          <p className="text-xs text-muted-foreground mt-4">
            Debug: Slug="{slug}" Error="{error?.message}" 
          </p>
        </div>
      </div>
    );
  }

  // Parse cover page data
  const parsedFeatures = typeof coverPage.checklist === 'string' ? 
    JSON.parse(coverPage.checklist || '[]') : coverPage.checklist || [];
  const parsedButtons = typeof coverPage.buttons === 'string' ? 
    JSON.parse(coverPage.buttons || '[]') : coverPage.buttons || [];
  const parsedStyles = typeof coverPage.styles === 'string' ? 
    JSON.parse(coverPage.styles || '{}') : coverPage.styles || {};

  // Transform features to the expected format
  const features = parsedFeatures.length > 0 ? 
    parsedFeatures.map((item: any, index: number) => ({
      emoji: parsedStyles.features?.[index]?.emoji || '⭐',
      title: typeof item === 'string' ? item : item.title || item,
      description: typeof item === 'string' ? 'Premium feature' : item.description || 'Premium feature'
    })) : [];

  // Transform buttons with click handlers and tracking
  const buttons = parsedButtons.map((btn: any) => ({
    ...btn,
    onClick: () => {
      console.log('🔍 Button clicked:', btn);
      
      // Track button click with enhanced data
      trackButtonClick({
        button_text: btn.text,
        button_type: btn.type,
        target_url: btn.target || btn.url,
        delivery_app_slug: btn.delivery_app_id || (btn.target?.includes('/app/') ? btn.target.split('/app/')[1] : null),
        markup_percentage: btn.markup_percentage || 0,
        markup_dollar_amount: btn.markup_dollar_amount || 0,
        special_action: btn.special_action,
        prefill_data: btn.prefill_data || null
      });
      
      // Determine the target URL based on button configuration
      let targetUrl = btn.target || btn.url;
      
      // Handle different assignment types
      if (btn.assignment_type === 'delivery_app' && btn.delivery_app_id) {
        // Find the delivery app by ID and redirect to its slug
        const deliveryApp = deliveryApps?.find(app => app.id === btn.delivery_app_id);
        targetUrl = `/app/${deliveryApp?.app_slug || 'delivery'}`;
      } else if (btn.assignment_type === 'special') {
        // Handle special actions
        if (btn.special_action === 'free_delivery') {
          targetUrl = '/delivery?free_shipping=true';
        } else if (btn.special_action === 'prefill_address' && btn.prefill_data?.address) {
          targetUrl = `/delivery?address=${encodeURIComponent(btn.prefill_data.address)}`;
        } else if (btn.special_action === 'prefill_datetime' && btn.prefill_data) {
          const params = new URLSearchParams();
          if (btn.prefill_data.date) params.set('date', btn.prefill_data.date);
          if (btn.prefill_data.time) params.set('time', btn.prefill_data.time);
          targetUrl = `/delivery?${params.toString()}`;
        }
      } else if (btn.assignment_type === 'url' && btn.url) {
        targetUrl = btn.url;
      }
      
      // Default fallback to main delivery page
      if (!targetUrl) {
        targetUrl = '/delivery';
      }
      
      console.log('🔗 Redirecting to:', targetUrl);
      
      if (targetUrl.startsWith('http')) {
        // External link - use window.location
        window.location.href = targetUrl;
      } else {
        // Internal link - use React Router
        navigate(targetUrl);
      }
    }
  }));

  return (
    <div className="relative min-h-screen">
      {/* Preloaded Background Homepage - Hidden but Cached */}
      {backgroundApp && (
        <div className="absolute inset-0 opacity-0 pointer-events-none">
          <CustomDeliveryTabsPage
            appName={backgroundApp.app_name}
            heroHeading={backgroundApp.main_app_config?.hero_heading || backgroundApp.app_name}
            heroSubheading={backgroundApp.main_app_config?.hero_subheading || 'Premium delivery service'}
            logoUrl={backgroundApp.logo_url}
            collectionsConfig={backgroundApp.collections_config}
            onAddToCart={handleAddToCart}
            cartItemCount={getTotalItems()}
            onOpenCart={openCart}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onProceedToCheckout={handleProceedToCheckout}
            onGoHome={handleGoHome}
          />
        </div>
      )}

      {/* Cover Page Overlay */}
      <div className="relative z-10 min-h-screen">
        <EditableCoverScreen
          title={coverPage.title}
          subtitle={coverPage.subtitle}
          logoUrl={coverPage.logo_url}
          logoEmoji={parsedStyles.logoEmoji || '🎉'}
          backgroundImageUrl={coverPage.bg_image_url}
          backgroundVideoUrl={coverPage.bg_video_url}
          features={features}
          buttons={buttons}
          variant={coverPage.theme || parsedStyles.variant || 'original'}
          customColors={parsedStyles.customColors}
          typography={parsedStyles.typography}
          logoSizing={parsedStyles.logoSizing}
          positioning={parsedStyles.positioning}
          sizing={parsedStyles.sizing}
          standalone={true}
        />
      </div>

      {/* Data Flow Monitor */}
      <DataFlowMonitor />
    </div>
  );
};

export default CoverPageWithBackground;