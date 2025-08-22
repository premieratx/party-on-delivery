import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Starting product collection fix...');

    // 1. Force fresh Shopify product sync
    console.log('📦 Fetching fresh products from Shopify...');
    const productsResponse = await supabaseClient.functions.invoke('fetch-shopify-products', {
      body: { forceRefresh: true }
    });

    if (productsResponse.error) {
      throw new Error(`Product fetch failed: ${productsResponse.error.message}`);
    }

    console.log(`✅ Fetched ${productsResponse.data?.products_count || 0} products`);

    // 2. Force fresh collections sync  
    console.log('📋 Fetching fresh collections from Shopify...');
    const collectionsResponse = await supabaseClient.functions.invoke('get-all-collections', {
      body: { forceRefresh: true }
    });

    if (collectionsResponse.error) {
      throw new Error(`Collections fetch failed: ${collectionsResponse.error.message}`);
    }

    console.log(`✅ Fetched ${collectionsResponse.data?.collections?.length || 0} collections`);

    // 3. Force unified product refresh with collection mapping
    console.log('🔄 Refreshing unified products with collection mapping...');
    const unifiedResponse = await supabaseClient.functions.invoke('get-unified-products', {
      body: { 
        use_type: 'delivery',
        forceRefresh: true,
        lightweight: false
      }
    });

    if (unifiedResponse.error) {
      console.warn('Unified products warning:', unifiedResponse.error);
    }

    console.log(`✅ Unified products refreshed: ${unifiedResponse.data?.products?.length || 0} products`);

    // 4. Clear all Shopify-related cache
    console.log('🧹 Clearing stale cache...');
    await supabaseClient
      .from('cache')
      .delete()
      .like('key', 'shopify%');

    await supabaseClient
      .from('cache')
      .delete()
      .like('key', 'unified%');

    await supabaseClient
      .from('cache')
      .delete()
      .like('key', 'collection%');

    console.log('✅ Cache cleared');

    // 5. Warm the cache again
    console.log('🔥 Warming cache...');
    const cacheWarmResponse = await supabaseClient.functions.invoke('cache-warmer');
    
    console.log('✅ Product collection fix completed!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product collections fixed and synced',
        products_count: productsResponse.data?.products_count || 0,
        collections_count: collectionsResponse.data?.collections?.length || 0,
        unified_products: unifiedResponse.data?.products?.length || 0,
        cache_warmed: !cacheWarmResponse.error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Product collection fix error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})