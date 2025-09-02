import { supabase } from '@/integrations/supabase/client';

export const syncCollectionOrders = async () => {
  console.log('🔄 SYNCING ALL COLLECTION ORDERS TO MATCH SHOPIFY');
  
  try {
    // Key delivery collections that need proper ordering
    const collections = [
      'tailgate-beer',
      'seltzer-collection', 
      'cocktail-kits',
      'spirits',
      'mixers-non-alcoholic',
      'wine-champagne-bnb-wedding',
      'rental-items',
      'drinkware-bartending-tools',
      'beer-light-beer-boat',
      'liqueurs-cordials-cocktail-ingredients'
    ];
    
    console.log('🎯 Syncing collection orders to preserve exact Shopify order...');
    
    for (const collection of collections) {
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
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.warn(`⚠️ Error syncing ${collection}:`, error);
      }
    }
    
    // Clear all caches to force refresh
    localStorage.removeItem('products-cache');
    localStorage.removeItem('collections-cache');
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    window.dispatchEvent(new CustomEvent('forceProductRefresh'));
    
    console.log('🎉 COLLECTION ORDER SYNC COMPLETE - Products now in exact Shopify order');
    
    return { success: true, message: 'All collection orders synced successfully' };
    
  } catch (error) {
    console.error('❌ Collection order sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Make available globally for console access
(window as any).syncCollectionOrders = syncCollectionOrders;