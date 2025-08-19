import { supabase } from '@/integrations/supabase/client';

/**
 * Fix product ordering by syncing with Shopify collection order
 */
export const fixProductOrdering = async () => {
  console.log('🔧 Fixing product ordering across all collections...');
  
  // ALL collections that need proper ordering across delivery apps
  const collectionsToSync = [
    'spirits',
    'gin-rum', 
    'tequila-mezcal',
    'bourbon-rye',
    'liqueurs-cordials-cocktail-ingredients',
    'tailgate-beer',
    'champagne',
    'wine',
    'mixers-non-alcoholic',
    'seltzer-collection',
    'cocktail-kits',
    'party-supplies',
    'bachelorette-supplies',
    'bachelorette-booze',
    'bachelorette-party-supplies',
    'disco-collection',
    'decorations',
    'drinkware-bartending-tools',
    'hats-sunglasses',
    'costumes',
    'all-party-supplies',
    'bachelor-favorites',
    'hangover-management',
    'non-alcoholic'
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

// Auto-execute on import to fix ordering - triggered manually now
console.log('🎯 Manually triggering spirits collection ordering fix...');
fixProductOrdering().catch(console.error);