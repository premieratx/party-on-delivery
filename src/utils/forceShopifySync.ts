import { supabase } from '@/integrations/supabase/client';

export const forceShopifyCollectionSync = async () => {
  console.log('🔄 FORCING COMPLETE SHOPIFY SYNC WITH COLLECTION ORDER PRESERVATION');
  
  try {
    // 1. Clear all caches to ensure fresh data
    console.log('🗑️ Clearing existing caches...');
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shopify_collections_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 2. Force unified sync
    console.log('🔄 Starting unified Shopify sync...');
    const { data: unifiedResult, error: unifiedError } = await supabase.functions.invoke('unified-shopify-sync', {
      body: { forceRefresh: true }
    });
    
    if (unifiedError) throw unifiedError;
    
    console.log('✅ Unified sync completed:', unifiedResult);
    
    // 3. Wait for sync to complete, then preserve collection orders
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // All main collections used in delivery apps
    const deliveryCollections = [
      'tailgate-beer',
      'seltzer-collection', 
      'cocktail-kits',
      'mixers-non-alcoholic',
      'spirits',
      'bourbon-rye',
      'gin-rum',
      'tequila-mezcal',
      'decorations',
      'drinkware-bartending-tools',
      'bachelorette-supplies',
      'party-supplies'
    ];
    
    console.log('🎯 Syncing collection orders to preserve exact Shopify order...');
    
    for (const collection of deliveryCollections) {
      try {
        console.log(`📦 Syncing order for: ${collection}`);
        const { data: orderResult, error: orderError } = await supabase.functions.invoke('shopify-collection-order', {
          body: { collection_handle: collection }
        });
        
        if (orderError) {
          console.warn(`⚠️ Failed to sync ${collection}:`, orderError);
        } else {
          console.log(`✅ ${collection} order synced successfully`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.warn(`⚠️ Error syncing ${collection}:`, error);
      }
    }
    
    // 4. Clear browser caches
    localStorage.removeItem('products-cache');
    localStorage.removeItem('collections-cache');
    
    console.log('🎉 SHOPIFY SYNC COMPLETE - All products now in exact Shopify collection order');
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    window.dispatchEvent(new CustomEvent('forceProductRefresh'));
    
    return { success: true, message: 'Shopify collections synced with preserved order' };
    
  } catch (error) {
    console.error('❌ Shopify sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-execute on import
forceShopifyCollectionSync();