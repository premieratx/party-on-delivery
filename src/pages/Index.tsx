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
import { SimpleForceSync } from '@/components/emergency/SimpleForceSync';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCoverPage, setShowCoverPage] = useState(false);
  const [showForceSync, setShowForceSync] = useState(false);
  // Immediately force sync on component mount
  useEffect(() => {
    const forceCompleteSync = async () => {
      console.log('🚀 FORCING COMPLETE SYNC FOR ALL DELIVERY APPS...');
      
      try {
        // Clear any existing cache to force fresh data
        await supabase.from('cache').delete().like('key', 'shopify%');
        
        // Force unified sync
        const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
          body: { forceRefresh: true }
        });
        
        if (data?.success) {
          console.log(`🎉 SYNC COMPLETE: ${data.products_synced} products, ${data.collections_synced} collections`);
          
          // Verify collections were cached
          setTimeout(async () => {
            const { count: collectionCount } = await supabase
              .from('shopify_collections_cache')
              .select('*', { count: 'exact', head: true });
            console.log(`✅ Verified: ${collectionCount} collections in cache`);
            
            // Trigger a custom event to refresh all components
            window.dispatchEvent(new CustomEvent('collectionsUpdated'));
          }, 2000);
        } else {
          console.error('❌ Sync failed:', error);
        }
      } catch (error) {
        console.error('❌ Complete sync error:', error);
      }
    };
    
    forceCompleteSync();
  }, []);
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

      if (!countError && (!count || count < 10)) {
        console.log('🚨 CRITICAL: No products in cache, triggering immediate fix...');
        
        try {
          console.log('🔄 Auto-triggering immediate fix...');
          const { data: syncResult } = await supabase.functions.invoke('immediate-products-fix');
          if (syncResult?.success) {
            console.log(`✅ Immediate fix completed: ${syncResult.products_synced} products`);
            // Reload the page to show products
            setTimeout(() => window.location.reload(), 1000);
          }
        } catch (syncError) {
          console.error('Immediate fix failed:', syncError);
        }
      } else {
        console.log(`✅ Product cache healthy: ${count} products available`);
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

  // Don't block the UI with loading screens - let products load in background

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
      {/* Show sync option only when needed */}
      {showForceSync && <SimpleForceSync />}
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