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
      if (!slug) throw new Error('No slug provided');
      
      console.log('🔍 Loading cover page with slug:', slug);
      
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading cover page:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Cover page loaded successfully:', data.title);
      } else {
        console.log('❌ No cover page found for slug:', slug);
      }
      
      return data;
    },
    enabled: !!slug
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The cover page you're looking for doesn't exist or has been disabled.</p>
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
        delivery_app_slug: btn.target?.includes('/app/') ? btn.target.split('/app/')[1] : null,
        markup_percentage: btn.markup_percentage || 0,
        markup_dollar_amount: btn.markup_dollar_amount || 0,
        special_action: btn.special_action,
        prefill_data: btn.prefill_data || null
      });
      
      if (btn.target || btn.url) {
        if ((btn.target || btn.url).startsWith('http')) {
          // External link - use window.location
          window.location.href = btn.target || btn.url;
        } else {
          // Internal link - use React Router
          navigate(btn.target || btn.url);
        }
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
          standalone={true}
        />
      </div>

      {/* Data Flow Monitor */}
      <DataFlowMonitor />
    </div>
  );
};

export default CoverPageWithBackground;