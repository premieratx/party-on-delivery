import { supabase } from '@/integrations/supabase/client';

export const syncCollectionOrder = async () => {
  console.log('🔄 Syncing collection orders...');
  
  const collections = [
    'beer', 'wine', 'spirits', 'mixers', 'party-supplies', 
    'tailgate-beer', 'bachelorette-supplies', 'disco-collection'
  ];
  
  for (const collection of collections) {
    try {
      const { data, error } = await supabase.functions.invoke('shopify-collection-order', {
        body: { collection_handle: collection }
      });
      
      if (data?.success) {
        console.log(`✅ Updated order for ${collection}: ${data.products_updated} products`);
      } else {
        console.error(`❌ Failed to update ${collection}:`, error || data?.error);
      }
    } catch (error) {
      console.error(`❌ Error syncing ${collection}:`, error);
    }
  }
  
  console.log('🎉 Collection order sync complete');
};