import { supabase } from '@/integrations/supabase/client';

export const forceDirectSync = async () => {
  console.log('🔄 FORCING DIRECT SHOPIFY SYNC - TAILGATE BEER FIRST');
  
  try {
    // 1. Sync tailgate-beer collection order first
    console.log('📦 Syncing tailgate-beer collection...');
    const { data: tailgateResult, error: tailgateError } = await supabase.functions.invoke('shopify-collection-order', {
      body: { collection_handle: 'tailgate-beer' }
    });
    
    if (tailgateError) throw tailgateError;
    console.log('✅ Tailgate beer synced:', tailgateResult);

    // 2. Force unified sync for all collections
    console.log('🔄 Starting unified Shopify sync...');
    const { data: unifiedResult, error: unifiedError } = await supabase.functions.invoke('unified-shopify-sync', {
      body: { forceRefresh: true }
    });
    
    if (unifiedError) throw unifiedError;
    console.log('✅ Unified sync completed:', unifiedResult);

    // 3. Sync all collection orders to preserve Shopify order
    console.log('🎯 Syncing all collection orders...');
    const collections = [
      'spirits', 'tailgate-beer', 'seltzer-collection', 'cocktail-kits',
      'party-supplies', 'champagne', 'disco-collection', 
      'liqueurs-cordials-cocktail-ingredients', 'mixers-non-alcoholic',
      'hats-sunglasses', 'tequila-mezcal', 'gin-rum', 'decorations',
      'bourbon-rye', 'bachelorette-supplies', 'drinkware-bartending-tools'
    ];
    
    for (const collection of collections) {
      try {
        await supabase.functions.invoke('shopify-collection-order', {
          body: { collection_handle: collection }
        });
        console.log(`✅ Synced ${collection} order`);
      } catch (error) {
        console.warn(`⚠️ Failed to sync ${collection}:`, error);
      }
    }

    // Clear caches
    localStorage.removeItem('products-cache');
    localStorage.removeItem('collections-cache');
    
    console.log('🎉 DIRECT SYNC COMPLETE - RELOADING PAGE');
    setTimeout(() => window.location.reload(), 1000);
    
  } catch (error) {
    console.error('❌ Direct sync failed:', error);
    throw error;
  }
};

// Function ready to be called manually when needed
// forceDirectSync(); // Commented out to prevent automatic execution