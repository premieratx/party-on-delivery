import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

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

    console.log('🚀 Starting immediate Shopify sync...');

    // Step 1: Fetch latest products from Shopify
    console.log('📦 Fetching products from Shopify...');
    const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { forceRefresh: true }
    });

    if (shopifyError) {
      console.error('❌ Shopify fetch error:', shopifyError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Shopify fetch failed: ${shopifyError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('✅ Shopify products fetched successfully');

    // Step 2: Clear existing cache entries
    console.log('🗑️ Clearing cache...');
    const { error: cacheError } = await supabase
      .from('cache')
      .delete()
      .like('key', '%products%');

    if (cacheError) {
      console.warn('⚠️ Cache clear warning:', cacheError.message);
    }

    // Step 3: Sync any pending product modifications to Shopify
    console.log('🔄 Syncing modifications to Shopify...');
    const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-products-to-app', {
      body: { immediate: true }
    });

    if (syncError) {
      console.warn('⚠️ Sync warning:', syncError.message);
    }

    // Step 4: Update cache with fresh data
    console.log('💾 Updating cache with fresh data...');
    const cacheKey = 'shopify_products_latest';
    const { error: cacheUpsertError } = await supabase.rpc('safe_cache_upsert', {
      cache_key: cacheKey,
      cache_data: shopifyData,
      expires_timestamp: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    if (cacheUpsertError) {
      console.warn('⚠️ Cache upsert warning:', cacheUpsertError.message);
    }

    console.log('🎉 Immediate Shopify sync completed successfully');

    // Return success with sync details
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Immediate Shopify sync completed',
        details: {
          shopifyProductsCount: shopifyData?.products?.length || 0,
          cacheCleared: !cacheError,
          syncCompleted: !syncError,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Immediate sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unexpected error during immediate sync' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});