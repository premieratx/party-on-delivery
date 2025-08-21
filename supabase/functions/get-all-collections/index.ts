import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Fetching Shopify collections from cache...');

    // Try to get fresh collections from cache first
    const { data: cacheData } = await supabase
      .from('cache')
      .select('data')
      .eq('key', 'shopify_collections_all')
      .gt('expires_at', Math.floor(Date.now() / 1000) * 1000)
      .order('created_at', { ascending: false })
      .limit(1);

    if (cacheData?.[0]?.data) {
      console.log('✅ Found fresh collections in cache');
      const collections = Array.isArray(cacheData[0].data) 
        ? cacheData[0].data 
        : (cacheData[0].data as any)?.collections || [];

      const validCollections = collections
        .filter((c: any) => c && c.handle && (c.products_count > 0 || c.product_count > 0))
        .map((c: any) => ({
          handle: c.handle,
          title: c.title || c.name || c.handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          products_count: c.products_count || c.product_count || 0,
          id: c.id
        }));

      return new Response(
        JSON.stringify({ 
          success: true, 
          collections: validCollections,
          source: 'cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 No fresh cache found, fetching from Shopify...');

    // Try shopify_products_cache table as backup
    const { data: productsData } = await supabase
      .from('shopify_products_cache')
      .select('data')
      .limit(1000);

    if (productsData && productsData.length > 0) {
      console.log(`📦 Processing ${productsData.length} products for collection extraction`);
      
      const collectionsMap = new Map();
      
      productsData.forEach((product: any) => {
        if (product.data?.collections) {
          product.data.collections.forEach((collectionHandle: string) => {
            if (collectionHandle && typeof collectionHandle === 'string') {
              const existing = collectionsMap.get(collectionHandle) || { count: 0 };
              collectionsMap.set(collectionHandle, {
                handle: collectionHandle,
                title: collectionHandle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                products_count: existing.count + 1,
                id: `gid://shopify/Collection/${Math.random().toString(36).substr(2, 9)}`
              });
            }
          });
        }
      });

      const extractedCollections = Array.from(collectionsMap.values())
        .filter(c => c.products_count > 0)
        .sort((a, b) => b.products_count - a.products_count);

      console.log(`✅ Extracted ${extractedCollections.length} collections from products`);

      // Cache the extracted collections
      await supabase
        .from('cache')
        .upsert({
          key: 'shopify_collections_all',
          data: extractedCollections,
          expires_at: Date.now() + (15 * 60 * 1000) // 15 minutes
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          collections: extractedCollections,
          source: 'extracted'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Final fallback - return default collections
    console.log('⚠️ Using fallback collections');
    const fallbackCollections = [
      { handle: 'spirits', title: 'Premium Spirits', products_count: 120, id: 'spirits-1' },
      { handle: 'tailgate-beer', title: 'Tailgate Beer', products_count: 95, id: 'beer-1' },
      { handle: 'cocktail-kits', title: 'Cocktail Kits', products_count: 65, id: 'cocktails-1' },
      { handle: 'party-supplies', title: 'Party Supplies', products_count: 85, id: 'party-1' },
      { handle: 'champagne', title: 'Champagne & Sparkling', products_count: 55, id: 'champagne-1' },
      { handle: 'whiskey', title: 'Whiskey & Bourbon', products_count: 75, id: 'whiskey-1' },
      { handle: 'vodka', title: 'Premium Vodka', products_count: 45, id: 'vodka-1' },
      { handle: 'tequila', title: 'Tequila & Mezcal', products_count: 35, id: 'tequila-1' }
    ];

    return new Response(
      JSON.stringify({ 
        success: true, 
        collections: fallbackCollections,
        source: 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in get-all-collections:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        collections: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});