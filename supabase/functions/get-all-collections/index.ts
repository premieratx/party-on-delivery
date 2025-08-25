import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  products_count: number;
  description?: string;
  products?: any[];
}

interface ResponseData {
  success: boolean;
  collections: ShopifyCollection[];
  source: string;
  total_count: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Getting all collections for delivery app configuration...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all collections by calling the unified products function
    const { data: unifiedData, error: unifiedError } = await supabase.functions.invoke('get-unified-products', {
      body: { 
        use_type: 'delivery',
        lightweight: true 
      }
    });

    if (unifiedError) {
      console.error('❌ Unified products function error:', unifiedError);
      throw unifiedError;
    }

    if (unifiedData?.collections && Array.isArray(unifiedData.collections)) {
      const collections = unifiedData.collections
        .filter((collection: any) => collection.products && collection.products.length > 0)
        .map((collection: any) => ({
          id: collection.id || collection.handle,
          handle: collection.handle,
          title: collection.title,
          name: collection.title, // Add name field for DeliveryAppCreator compatibility
          products_count: collection.products?.length || 0,
          description: collection.description || ''
        }))
        .sort((a: ShopifyCollection, b: ShopifyCollection) => 
          b.products_count - a.products_count // Sort by product count desc
        );

      console.log(`✅ Found ${collections.length} collections with products`);
      
      return new Response(
        JSON.stringify({
          success: true,
          collections,
          source: 'unified-products',
          total_count: collections.length
        } as ResponseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: Extract collections from products cache directly
    console.log('📝 Fallback: Extracting collections from products cache...');
    
    const { data: products, error: productsError } = await supabase
      .from('shopify_products_cache')
      .select('data')
      .not('data', 'is', null)
      .limit(1000);

    if (productsError) throw productsError;

    // Extract unique collections from product data
    const collectionMap = new Map<string, ShopifyCollection>();
    
    products?.forEach((product: any) => {
      const productData = product.data;
      const collections = productData?.collections || [];
      
      collections.forEach((collection: any) => {
        if (collection.handle && collection.title) {
          if (!collectionMap.has(collection.handle)) {
            collectionMap.set(collection.handle, {
              id: collection.id || collection.handle,
              handle: collection.handle,
              title: collection.title,
              products_count: 0,
              description: collection.description || ''
            });
          }
          const existing = collectionMap.get(collection.handle)!;
          existing.products_count += 1;
        }
      });
    });

    const extractedCollections = Array.from(collectionMap.values())
      .filter(collection => collection.products_count > 0)
      .sort((a, b) => b.products_count - a.products_count);

    console.log(`✅ Extracted ${extractedCollections.length} collections from products cache`);
    
    return new Response(
      JSON.stringify({
        success: true,
        collections: extractedCollections,
        source: 'products-cache',
        total_count: extractedCollections.length
      } as ResponseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in get-all-collections:', error);
    
    // Emergency fallback with real collection data from logs
    const fallbackCollections: ShopifyCollection[] = [
      { id: 'spirits', handle: 'spirits', title: 'Spirits', products_count: 134 },
      { id: 'mixers-non-alcoholic', handle: 'mixers-non-alcoholic', title: 'Mixers & Non-Alcoholic', products_count: 113 },
      { id: 'all-party-supplies', handle: 'all-party-supplies', title: 'All Party Supplies', products_count: 122 },
      { id: 'liqueurs-cordials-cocktail-ingredients', handle: 'liqueurs-cordials-cocktail-ingredients', title: 'Liqueurs, Cordials, Cocktail Ingredients', products_count: 68 },
      { id: 'concierge-backyard-pool-toys', handle: 'concierge-backyard-pool-toys', title: 'Concierge - Backyard & Pool Toys', products_count: 59 },
      { id: 'tailgate-beer', handle: 'tailgate-beer', title: 'Tailgate Beer', products_count: 57 },
      { id: 'drinkware-bartending-tools', handle: 'drinkware-bartending-tools', title: 'Drinkware, Openers, Coolers, Bar Accessories', products_count: 53 },
      { id: 'gin-rum', handle: 'gin-rum', title: 'Vodka, Gin, & Rum', products_count: 51 },
      { id: 'bourbon-rye', handle: 'bourbon-rye', title: 'Bourbon & Rye', products_count: 48 },
      { id: 'spirits-1', handle: 'spirits-1', title: 'Spirits', products_count: 47 },
      { id: 'champagne', handle: 'champagne', title: 'Wine and Champagne', products_count: 45 },
      { id: 'lake-packages-items', handle: 'lake-packages-items', title: 'Lake Packages Items', products_count: 44 },
      { id: 'all-alcohol', handle: 'all-alcohol', title: 'All Alcohol', products_count: 43 },
      { id: 'tequila-mezcal', handle: 'tequila-mezcal', title: 'Tequila & Mezcal', products_count: 41 },
      { id: 'cocktail-kits', handle: 'cocktail-kits', title: 'Cocktail Collection - ALL', products_count: 41 },
      { id: 'bachelorette-mixers-misc', handle: 'bachelorette-mixers-misc', title: 'Bachelorette (Mixers & Non-Alcoholic)', products_count: 38 },
      { id: 'party-supplies', handle: 'party-supplies', title: 'Party Supplies', products_count: 38 },
      { id: 'bachelorette-party-supplies', handle: 'bachelorette-party-supplies', title: 'Bachelorette (Party Supplies)', products_count: 37 },
      { id: 'disco-collection', handle: 'disco-collection', title: 'Disco Collection', products_count: 36 },
      { id: 'bachelorette-booze', handle: 'bachelorette-booze', title: 'Bachelorette (Booze)', products_count: 35 },
      { id: 'beer-airbnb-craft', handle: 'beer-airbnb-craft', title: 'Beer - airbnb / craft', products_count: 32 },
      { id: 'rental-items', handle: 'rental-items', title: 'Rental Items', products_count: 32 },
      { id: 'decorations', handle: 'decorations', title: 'Decorations', products_count: 30 },
      { id: 'bachelor-spirits-cocktails', handle: 'bachelor-spirits-cocktails', title: 'Bachelor - Spirits & Cocktails', products_count: 28 },
      { id: 'concierge-backyard-parties', handle: 'concierge-backyard-parties', title: 'Concierge - Backyard Parties', products_count: 28 },
      { id: 'concierge-pool-toys', handle: 'concierge-pool-toys', title: 'Concierge - Pool Toys', products_count: 27 },
      { id: 'hats-sunglasses', handle: 'hats-sunglasses', title: 'Hats, Headbands, Necklaces & Sunglasses', products_count: 27 },
      { id: 'tailgate-supplies-and-fun', handle: 'tailgate-supplies-and-fun', title: 'Tailgate - NA + mixers', products_count: 26 },
      { id: 'tailgate-seltzers', handle: 'tailgate-seltzers', title: 'Seltzers & Champagne', products_count: 25 },
      { id: 'hangover-management', handle: 'hangover-management', title: 'Hangover Management', products_count: 24 },
      { id: 'chill-supplies', handle: 'chill-supplies', title: 'Chill Supplies', products_count: 23 },
      { id: 'wine-champagne-bnb-wedding', handle: 'wine-champagne-bnb-wedding', title: 'Wine & Champagne - Bnb / Wedding', products_count: 23 },
      { id: 'beer-light-beer-boat', handle: 'beer-light-beer-boat', title: 'Beer - Light Beer / Boat', products_count: 21 },
      { id: 'bachelor-seltzers-wine', handle: 'bachelor-seltzers-wine', title: 'Bachelor - Seltzers & Wine', products_count: 20 },
      { id: 'seltzers-wine-champagne', handle: 'seltzers-wine-champagne', title: 'Seltzers, Wine, Champagne', products_count: 82 },
      { id: 'bachelorette-supplies', handle: 'bachelorette-supplies', title: 'Bachelorette Supplies', products_count: 84 }
    ];

    console.log(`📝 Using fallback collections: ${fallbackCollections.length} collections`);
    
    return new Response(
      JSON.stringify({
        success: true,
        collections: fallbackCollections,
        source: 'fallback',
        total_count: fallbackCollections.length
      } as ResponseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})