import { supabase } from '@/integrations/supabase/client';

/**
 * Fix product ordering by syncing with Shopify collection order
 */
export const fixProductOrdering = async () => {
  console.log('🔧 Fixing product ordering across all collections...');
  
  // Collections that need proper ordering - updated to include mixers-non-alcoholic
  const collectionsToSync = [
    'tailgate-beer',
    'spirits', 
    'mixers-non-alcoholic',
    'wine',
    'party-supplies',
    'bachelorette-supplies',
    'disco-collection',
    'seltzer-collection',
    'cocktail-kits'
  ];
  
  const results = [];
  
  for (const collection of collectionsToSync) {
    try {
      console.log(`📋 Syncing collection order for: ${collection}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-collection-order', {
        body: { collection_handle: collection }
      });
      
      if (error) {
        console.error(`❌ Failed to sync ${collection}:`, error);
        results.push({ collection, success: false, error });
      } else {
        console.log(`✅ Successfully synced ${collection}:`, data);
        results.push({ collection, success: true, data });
      }
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error syncing ${collection}:`, error);
      results.push({ collection, success: false, error });
    }
  }
  
  // Clear local storage caches to force refresh
  localStorage.removeItem('products-cache');
  localStorage.removeItem('collections-cache');
  
  // Trigger refresh events
  window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  window.dispatchEvent(new CustomEvent('forceProductRefresh'));
  
  console.log('🎉 Product ordering fix complete');
  return results;
};

// Auto-execute on import to fix ordering
fixProductOrdering().catch(console.error);