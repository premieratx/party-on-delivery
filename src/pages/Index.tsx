import React, { useEffect, useState } from 'react';
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { CoverPageLoader } from '@/components/cover-page/CoverPageLoader';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';
import { InstantProductLoader } from '@/components/emergency/InstantProductLoader';
import { CriticalProductSync } from '@/components/emergency/CriticalProductSync';
import { DirectProductSync } from '@/components/emergency/DirectProductSync';
import { InstantProductSync } from '@/components/emergency/InstantProductSync';
import { QuickSyncTrigger } from '@/components/emergency/QuickSyncTrigger';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCoverPage, setShowCoverPage] = useState(false);
  const [showForceSync, setShowForceSync] = useState(false);
  const navigate = useNavigate();
  const { cartItems } = useUnifiedCart();
  const [searchParams] = useSearchParams();
  const affiliateCode = searchParams.get('ref');

  useEffect(() => {
    const checkAndSyncProducts = async () => {
      // Check if products exist in cache
      const { count, error: countError } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Current product count in cache: ${count || 0}`);

      if (!countError && (!count || count < 100)) {
        console.log('🚨 CRITICAL: Insufficient products in cache, showing force sync option...');
        setShowForceSync(true);
        
        // Auto-trigger emergency sync
        try {
          console.log('🔄 Auto-triggering emergency sync...');
          const { data: syncResult } = await supabase.functions.invoke('emergency-product-sync');
          if (syncResult?.success) {
            console.log(`✅ Auto-sync completed: ${syncResult.products_synced} products`);
            setShowForceSync(false);
          }
        } catch (syncError) {
          console.error('Auto-sync failed:', syncError);
        }
      } else {
        console.log(`✅ Product cache healthy: ${count} products available`);
        setShowForceSync(false);
      }
    };

    const loadDefaultDeliveryApp = async () => {
      try {
        console.log('🏠 Index: Loading default delivery app config...');
        
        // Get the homepage delivery app or first active app
        const { data: apps, error: appsError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .order('is_homepage', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1);

        if (appsError) {
          console.error('Error fetching delivery apps:', appsError);
          throw appsError;
        }

        if (!apps || apps.length === 0) {
          throw new Error('No delivery apps found - please create one in admin dashboard');
        } 

        // Always use the real delivery app from database
        setAppConfig(apps[0]);
        console.log('🏠 Index: Loaded delivery app:', apps[0].app_name);
        
        // Cover pages are now disabled by default
        
      } catch (err) {
        console.error('Error loading delivery app:', err);
        setError('Failed to load delivery app: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Run both checks
    checkAndSyncProducts();
    loadDefaultDeliveryApp();
  }, [navigate]);

  const handleCheckout = (items: any[]) => {
    localStorage.setItem('deliveryAppReferrer', '/');
    localStorage.setItem('app-context', JSON.stringify({
      appSlug: appConfig?.app_slug || 'party-on-delivery',
      appName: appConfig?.app_name || "Austin's Premier Party Supply Delivery"
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div>
            <h3 className="text-lg font-semibold">Loading Main Delivery App</h3>
            <p className="text-muted-foreground">Setting up your party experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show instant product loader if products are missing
  if (showForceSync) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-red-600">🚨 Loading Products</h2>
            <p className="text-muted-foreground">
              Product cache is empty. Loading all products now...
            </p>
          </div>
        <InstantProductSync />
        <DirectProductSync />
        </div>
      </div>
    );
  }

  if (error || !appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Failed to Load App</h3>
          <p className="text-muted-foreground">{error || 'App configuration not found'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <QuickSyncTrigger />
      <ProductCategories
        appName={appConfig?.app_name || "Austin's Premier Party Supply Delivery"}
        heroHeading={appConfig?.main_app_config?.hero_heading || "Austin's Premier Party Supply Delivery"}
        heroSubheading={appConfig?.main_app_config?.hero_subheading || "Satisfaction Guaranteed, On-Time Delivery"}
        heroScrollingText={appConfig?.main_app_config?.hero_scrolling_text || "Let's Get It"}
        logoUrl={appConfig?.logo_url}
        collectionsConfig={appConfig?.collections_config}
        cartItemCount={cartItems.length}
      />
      
    </>
  );
};

export default Index;