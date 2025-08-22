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

    console.log('🚀 Force Shopify sync starting...');

    // 1. First, get fresh products from Shopify
    console.log('📦 Fetching fresh products from Shopify...');
    const productsResponse = await supabaseClient.functions.invoke('fetch-shopify-products', {
      body: { forceRefresh: true }
    });

    if (productsResponse.error) {
      throw new Error(`Products sync failed: ${productsResponse.error.message}`);
    }

    console.log(`✅ Products synced: ${productsResponse.data?.products_count || 0} products`);

    // 2. Get fresh collections from Shopify
    console.log('📋 Fetching fresh collections from Shopify...');
    const collectionsResponse = await supabaseClient.functions.invoke('get-all-collections', {
      body: { forceRefresh: true }
    });

    if (collectionsResponse.error) {
      throw new Error(`Collections sync failed: ${collectionsResponse.error.message}`);
    }

    console.log(`✅ Collections synced: ${collectionsResponse.data?.collections?.length || 0} collections`);

    // 3. Force refresh unified products to ensure proper collection mapping
    console.log('🔄 Refreshing unified products cache...');
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

    console.log(`✅ Unified products refreshed: ${unifiedResponse.data?.products?.length || 0} products in ${unifiedResponse.data?.collections?.length || 0} collections`);

    // 4. Update cache expiration to ensure fresh data
    await supabaseClient
      .from('cache')
      .delete()
      .like('key', 'shopify%');

    console.log('🧹 Cleared stale Shopify cache entries');

    // 5. Warm up the cache again
    console.log('🔥 Warming up fresh cache...');
    const cacheWarmResponse = await supabaseClient.functions.invoke('cache-warmer');
    
    console.log('✅ Force sync completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify sync completed successfully',
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
    console.error('❌ Force sync error:', error);
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