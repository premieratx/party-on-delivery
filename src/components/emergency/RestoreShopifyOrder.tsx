import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const RestoreShopifyOrder = () => {
  useEffect(() => {
    const restoreExactShopifyOrder = async () => {
      console.log('🔄 RESTORING EXACT SHOPIFY ORDER - FORCE SYNC INITIATED');
      
      try {
        // 1. First do unified sync to ensure we have all products
        console.log('📦 Step 1: Unified Shopify sync...');
        const { data: unifiedData, error: unifiedError } = await supabase.functions.invoke('unified-shopify-sync', {
          body: { forceRefresh: true }
        });
        
        if (unifiedError) {
          console.error('❌ Unified sync failed:', unifiedError);
          throw unifiedError;
        }
        
        console.log('✅ Unified sync completed:', unifiedData);
        
        // 2. Wait then sync all collection orders to match exact Shopify order
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🎯 Step 2: Syncing all collection orders...');
        
        const collections = [
          'spirits', 'tailgate-beer', 'seltzer-collection', 'cocktail-kits',
          'party-supplies', 'champagne', 'disco-collection',
          'liqueurs-cordials-cocktail-ingredients', 'mixers-non-alcoholic',
          'hats-sunglasses', 'tequila-mezcal', 'gin-rum', 'decorations',
          'bourbon-rye', 'bachelorette-supplies', 'drinkware-bartending-tools'
        ];
        
        for (const collection of collections) {
          try {
            console.log(`🔄 Syncing ${collection} order...`);
            const { data: orderData, error: orderError } = await supabase.functions.invoke('shopify-collection-order', {
              body: { collection_handle: collection }
            });
            
            if (orderData?.success) {
              console.log(`✅ ${collection}: ${orderData.products_updated} products ordered`);
            } else {
              console.warn(`⚠️ ${collection}: ${orderError?.message || 'Failed to sync'}`);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.warn(`⚠️ Error syncing ${collection}:`, error);
          }
        }
        
        // 3. Clear all caches to force fresh data
        localStorage.removeItem('products-cache');
        localStorage.removeItem('collections-cache');
        localStorage.removeItem('product-preloader-cache');
        
        // 4. Dispatch events to refresh components
        window.dispatchEvent(new CustomEvent('collectionsUpdated'));
        window.dispatchEvent(new CustomEvent('forceProductRefresh'));
        
        console.log('🎉 SHOPIFY ORDER RESTORATION COMPLETE - All products now in exact Shopify order');
        
        // 5. Force page reload after sync completes
        setTimeout(() => {
          console.log('🔄 Reloading page to show exact Shopify order...');
          window.location.reload();
        }, 3000);
        
      } catch (error) {
        console.error('❌ Failed to restore Shopify order:', error);
      }
    };
    
    // Trigger immediately on component mount
    restoreExactShopifyOrder();
  }, []);
  
  return null; // This is a utility component with no UI
};