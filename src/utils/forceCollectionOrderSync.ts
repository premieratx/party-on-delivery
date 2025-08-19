import { supabase } from '@/integrations/supabase/client';

export const forceCollectionOrderSync = async () => {
  console.log('🔄 FORCING SHOPIFY COLLECTION ORDER SYNC');
  
  try {
    // Main collections used in delivery apps - sync these in exact Shopify order
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
        
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`⚠️ Error syncing ${collection}:`, error);
      }
    }
    
    // Clear browser caches to force refresh
    localStorage.removeItem('products-cache');
    localStorage.removeItem('collections-cache');
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    window.dispatchEvent(new CustomEvent('forceProductRefresh'));
    
    console.log('🎉 COLLECTION ORDER SYNC COMPLETE - Products should now show in exact Shopify order');
    
    return { success: true, message: 'Collection orders synced successfully' };
    
  } catch (error) {
    console.error('❌ Collection order sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Execute immediately when imported
forceCollectionOrderSync();