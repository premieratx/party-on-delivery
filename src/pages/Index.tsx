import React, { useEffect, useState } from 'react';
import '../utils/forceTailgateBeerSync'; // Force tailgate beer collection order sync
import { ProductCategories } from '@/components/delivery/ProductCategories';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { UnifiedCart } from '@/components/common/UnifiedCart';
import { ForceProductSync } from '@/components/emergency/ForceProductSync';
import { DeliveryAppDropdown } from '@/components/delivery/DeliveryAppDropdown';
import { CriticalProductSync } from '@/components/emergency/CriticalProductSync';
import { DirectProductSync } from '@/components/emergency/DirectProductSync';
import { InstantProductSync } from '@/components/emergency/InstantProductSync';
import { QuickSyncTrigger } from '@/components/emergency/QuickSyncTrigger';
import { SimpleForceSync } from '@/components/emergency/SimpleForceSync';
import { ForceCollectionOrderSync } from '@/components/ForceCollectionOrderSync';
import { syncCollectionOrder } from '@/utils/productSync';
import { RestoreShopifyOrder } from '@/components/emergency/RestoreShopifyOrder';

const Index = () => {
  console.log('🏠 Index: Loading Main Delivery App as homepage');
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCoverPage, setShowCoverPage] = useState(false);
  const [showForceSync, setShowForceSync] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Force complete sync with collection order preservation
  useEffect(() => {
    const forceShopifyCollectionSync = async () => {
      console.log('🔄 FORCING SHOPIFY COLLECTION SYNC WITH EXACT ORDER...');
      
      try {
        // 1. First force unified sync to get all products and collections
        console.log('🔄 Step 1: Unified Shopify sync...');
        const { data: unifiedResult, error: unifiedError } = await supabase.functions.invoke('unified-shopify-sync', {
          body: { forceRefresh: true }
        });
        
        if (unifiedError) {
          console.error('❌ Unified sync failed:', unifiedError);
          return;
        }
        
        console.log('✅ Unified sync completed:', unifiedResult);
        
        // 2. Wait for sync to complete then sync collection orders
        setTimeout(async () => {
          console.log('🔄 Step 2: Syncing collection orders for all collections...');
          
          // Get all collections from delivery apps
          const collectionsToSync = [
            'tailgate-beer', 'seltzer-collection', 'cocktail-kits', 
            'mixers-non-alcoholic', 'spirits', 'bourbon-rye', 'gin-rum',
            'tequila-mezcal', 'decorations', 'drinkware-bartending-tools',
            'party-supplies', 'bachelorette-supplies'
          ];
          
          for (const collection of collectionsToSync) {
            try {
              console.log(`🎯 Syncing order for collection: ${collection}`);
              const { data: orderResult, error: orderError } = await supabase.functions.invoke('shopify-collection-order', {
                body: { collection_handle: collection }
              });
              
              if (orderError) {
                console.warn(`⚠️ Failed to sync order for ${collection}:`, orderError);
              } else {
                console.log(`✅ Synced order for ${collection}:`, orderResult);
              }
            } catch (error) {
              console.warn(`⚠️ Error syncing ${collection}:`, error);
            }
          }
          
          console.log('🎉 ALL COLLECTION ORDERS SYNCED - Products now in exact Shopify order');
          
          // Clear browser caches to force fresh data
          localStorage.removeItem('products-cache');
          localStorage.removeItem('collections-cache');
          
          // Trigger a refresh event for components
          window.dispatchEvent(new CustomEvent('collectionsUpdated'));
          
        }, 3000);
        
      } catch (error) {
        console.error('❌ Complete sync error:', error);
      }
    };
    
    forceShopifyCollectionSync();
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
        console.log('🚨 CRITICAL: No products in cache, triggering collection sync...');
        
        try {
          console.log('🔄 Auto-triggering collection sync...');
          const { data: syncResult } = await supabase.functions.invoke('shopify-collection-sync');
          if (syncResult?.success) {
            console.log(`✅ Collection sync completed: ${syncResult.collections_synced} collections, ${syncResult.products_synced} products`);
            // Reload the page to show properly mapped products
            setTimeout(() => window.location.reload(), 2000);
          }
        } catch (syncError) {
          console.error('Collection sync failed:', syncError);
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
      {/* Restore exact Shopify order immediately */}
      <RestoreShopifyOrder />
      
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
        onOpenCart={() => setIsCartOpen(true)}
      />
      
      {/* Cart Sidebar */}
      <UnifiedCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      
      {/* Bottom Menu Bar with Admin Button and Sync */}
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              size="sm"
              className="bg-background/90 backdrop-blur-sm border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Admin
            </Button>
            <ForceCollectionOrderSync />
          </div>
          
          <div className="ml-4">
            <DeliveryAppDropdown />
          </div>
        </div>
      </div>
      
      {/* Desktop Admin Button and Sync - Bottom Right */}
      <div className="hidden lg:flex lg:gap-2 fixed bottom-4 right-4 z-50">
        <ForceCollectionOrderSync />
        <Button 
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Admin
        </Button>
      </div>
    </>
  );
};

export default Index;