import { supabase } from '@/integrations/supabase/client';

export const triggerShopifySync = async () => {
  console.log('🔄 Triggering Shopify collection order sync...');
  
  const collections = [
    'spirits', 'tailgate-beer', 'seltzer-collection', 'cocktail-kits',
    'party-supplies', 'champagne', 'disco-collection', 
    'liqueurs-cordials-cocktail-ingredients', 'mixers-non-alcoholic',
    'hats-sunglasses', 'tequila-mezcal', 'gin-rum', 'decorations',
    'bourbon-rye', 'bachelorette-supplies', 'drinkware-bartending-tools'
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