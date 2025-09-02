import { supabase } from '@/integrations/supabase/client';

export const triggerCollectionOrderSync = async () => {
  console.log('🎯 TRIGGERING SHOPIFY COLLECTION ORDER SYNC');
  
  try {
    // Key collections that need proper ordering
    const collections = ['tailgate-beer', 'seltzer-collection', 'cocktail-kits', 'spirits', 'mixers-non-alcoholic'];
    
    for (const collection of collections) {
      console.log(`📦 Syncing order for collection: ${collection}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-collection-order', {
        body: { collection_handle: collection }
      });
      
      if (error) {
        console.error(`❌ Failed to sync ${collection}:`, error);
      } else {
        console.log(`✅ Successfully synced ${collection}:`, data);
      }
      
      // Small delay to avoid overwhelming Shopify API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 Collection order sync complete!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Collection order sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Call it immediately to fix the ordering
triggerCollectionOrderSync();