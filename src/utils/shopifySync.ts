import { supabase } from '@/integrations/supabase/client';

export const triggerShopifySync = async () => {
  console.log('🔄 Triggering Shopify collection order sync...');
  
  const collections = [
    'beer', 'wine', 'spirits', 'mixers', 'party-supplies', 
    'tailgate-beer', 'bachelorette-supplies', 'disco-collection',
    'seltzer-collection', 'cocktail-kits'
  ];
  
  for (const collection of collections) {
    try {
      const { data, error } = await supabase.functions.invoke('shopify-collection-order', {
        body: { collection_handle: collection }
      });
      
      if (data?.success) {
        console.log(`✅ Updated Shopify order for ${collection}: ${data.products_updated} products`);
      } else {
        console.error(`❌ Failed to update ${collection}:`, error || data?.error);
      }
    } catch (error) {
      console.error(`❌ Error syncing ${collection}:`, error);
    }
  }
  
  console.log('🎉 Shopify collection order sync complete - products now match Shopify order');
};