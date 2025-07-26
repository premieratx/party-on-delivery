import { supabase } from '@/integrations/supabase/client';

export const getShopifyCategories = async () => {
  try {
    // First try to get cached collections
    const { data: collections, error: collectionError } = await supabase.functions.invoke('get-all-collections');
    
    if (collectionError) {
      console.error('Error fetching collections:', collectionError);
      return [];
    }

    const categories = new Set<string>();
    
    // Extract categories from product data
    if (collections?.collections) {
      collections.collections.forEach((collection: any) => {
        if (collection.products) {
          collection.products.forEach((product: any) => {
            // Check if product has tags or categories
            if (product.tags) {
              product.tags.forEach((tag: string) => {
                // Filter for alcohol-related categories
                const lowercaseTag = tag.toLowerCase();
                if (lowercaseTag.includes('whiskey') || 
                    lowercaseTag.includes('vodka') || 
                    lowercaseTag.includes('gin') || 
                    lowercaseTag.includes('rum') || 
                    lowercaseTag.includes('tequila') || 
                    lowercaseTag.includes('beer') || 
                    lowercaseTag.includes('wine') || 
                    lowercaseTag.includes('champagne') || 
                    lowercaseTag.includes('bourbon') || 
                    lowercaseTag.includes('scotch') || 
                    lowercaseTag.includes('brandy') || 
                    lowercaseTag.includes('cognac') || 
                    lowercaseTag.includes('liqueur')) {
                  categories.add(tag);
                }
              });
            }
            
            // Also check product type
            if (product.productType) {
              const lowercaseType = product.productType.toLowerCase();
              if (lowercaseType.includes('whiskey') || 
                  lowercaseType.includes('vodka') || 
                  lowercaseType.includes('gin') || 
                  lowercaseType.includes('rum') || 
                  lowercaseType.includes('tequila') || 
                  lowercaseType.includes('beer') || 
                  lowercaseType.includes('wine') || 
                  lowercaseType.includes('champagne') || 
                  lowercaseType.includes('bourbon') || 
                  lowercaseType.includes('scotch') || 
                  lowercaseType.includes('brandy') || 
                  lowercaseType.includes('cognac') || 
                  lowercaseType.includes('liqueur')) {
                categories.add(product.productType);
              }
            }
          });
        }
      });
    }
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting Shopify categories:', error);
    return [];
  }
};