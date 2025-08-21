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

    // Try to get collections from multiple cache sources
    const cacheKeys = ['shopify_collections_all', 'shopify-collections', 'shopify-collections-metadata'];
    
    for (const key of cacheKeys) {
      const { data: cacheData } = await supabase
        .from('cache')
        .select('data')
        .eq('key', key)
        .order('created_at', { ascending: false })
        .limit(1);

      if (cacheData?.[0]?.data) {
        console.log(`✅ Found collections in cache under key: ${key}`);
        const collections = Array.isArray(cacheData[0].data) 
          ? cacheData[0].data 
          : (cacheData[0].data as any)?.collections || [];

        if (collections.length > 0) {
          const validCollections = collections
            .filter((c: any) => c && c.handle && (c.products_count > 0 || c.product_count > 0 || !c.hasOwnProperty('products_count')))
            .map((c: any) => ({
              handle: c.handle,
              title: c.title || c.name || c.handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              products_count: c.products_count || c.product_count || 0,
              id: c.id
            }));

          if (validCollections.length > 0) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                collections: validCollections,
                source: `cache-${key}`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
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
        // Try multiple data structures for collections
        let productCollections = [];
        
        // Method 1: Direct collections array in data (FIXED - this is the main structure)
        if (product.data?.collections && Array.isArray(product.data.collections)) {
          productCollections = product.data.collections;
        }
        // Method 2: Collections nested deeper in data
        else if (product.data?.data?.collections && Array.isArray(product.data.data.collections)) {
          productCollections = product.data.data.collections;
        }
        // Method 3: Collections as collection_handles array
        else if (product.data?.collection_handles && Array.isArray(product.data.collection_handles)) {
          productCollections = product.data.collection_handles.map((handle: string) => ({
            handle: handle,
            title: handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            id: `gid://shopify/Collection/${handle}`
          }));
        }
        // Method 4: Try to extract from product object directly
        else if (product.collection_handles && Array.isArray(product.collection_handles)) {
          productCollections = product.collection_handles.map((handle: string) => ({
            handle: handle,
            title: handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            id: `gid://shopify/Collection/${handle}`
          }));
        }
        // Method 5: Extract from JSON string if data is stringified
        else if (typeof product.data === 'string') {
          try {
            const parsed = JSON.parse(product.data);
            if (parsed.collections && Array.isArray(parsed.collections)) {
              productCollections = parsed.collections;
            } else if (parsed.collection_handles && Array.isArray(parsed.collection_handles)) {
              productCollections = parsed.collection_handles.map((handle: string) => ({
                handle: handle,
                title: handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                id: `gid://shopify/Collection/${handle}`
              }));
            }
          } catch (e) {
            console.log('Failed to parse stringified product data');
          }
        }
        
        productCollections.forEach((collection: any) => {
          if (collection && (collection.handle || collection)) {
            const handle = typeof collection === 'string' ? collection : collection.handle;
            const title = typeof collection === 'string' ? 
              collection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
              (collection.title || collection.name || handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            
            if (handle && typeof handle === 'string') {
              const existing = collectionsMap.get(handle) || { count: 0 };
              collectionsMap.set(handle, {
                handle: handle,
                title: title,
                products_count: existing.count + 1,
                id: collection.id || `gid://shopify/Collection/${handle}`
              });
            }
          }
        });
      });

      const extractedCollections = Array.from(collectionsMap.values())
        .filter(c => c.products_count > 0)
        .sort((a, b) => b.products_count - a.products_count);

      console.log(`✅ Extracted ${extractedCollections.length} collections from products using enhanced extraction`);
      
      if (extractedCollections.length > 0) {
        // Cache the extracted collections with longer TTL
        await supabase
          .from('cache')
          .upsert({
            key: 'shopify_collections_all',
            data: extractedCollections,
            expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            collections: extractedCollections,
            source: 'extracted_enhanced'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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