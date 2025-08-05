import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('⚡ Starting instant product cache optimization...')

    // Check if we have fresh cache (less than 2 minutes old)
    const { data: existingCache } = await supabase
      .from('cache')
      .select('*')
      .eq('key', 'instant_products_v3')
      .gte('expires_at', Date.now())
      .single()

    if (existingCache) {
      console.log('✅ Using existing fresh cache')
      return new Response(
        JSON.stringify({
          success: true,
          source: 'cache',
          data: existingCache.data,
          timestamp: existingCache.created_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch fresh data from Shopify in parallel with cache operations
    console.log('📦 Fetching fresh products...')
    
    const [shopifyResult, collectionsResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-shopify-products'),
      supabase.functions.invoke('get-all-collections', { body: { limit: 50 } })
    ])

    let products = []
    let collections = []

    if (shopifyResult.status === 'fulfilled' && !shopifyResult.value.error) {
      products = shopifyResult.value.data?.products || []
    }

    if (collectionsResult.status === 'fulfilled' && !collectionsResult.value.error) {
      collections = collectionsResult.value.data?.collections || []
    }

    // Optimize product data for instant loading
    const optimizedProducts = products.slice(0, 100).map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image?.includes('?') 
        ? `${product.image}&width=300&height=300` 
        : `${product.image}?width=300&height=300`,
      handle: product.handle,
      variants: product.variants?.slice(0, 1) || []
    }))

    const optimizedCollections = collections.slice(0, 20).map((collection: any) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      products: collection.products?.slice(0, 12).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image?.includes('?') 
          ? `${product.image}&width=300&height=300` 
          : `${product.image}?width=300&height=300`,
        handle: product.handle,
        variants: product.variants?.slice(0, 1) || []
      })) || []
    }))

    const cacheData = {
      products: optimizedProducts,
      collections: optimizedCollections,
      cached_at: new Date().toISOString(),
      total_products: products.length,
      total_collections: collections.length
    }

    // Cache for 2 minutes with aggressive expiry
    const expiresAt = Date.now() + (2 * 60 * 1000)
    
    await supabase.rpc('safe_cache_upsert', {
      cache_key: 'instant_products_v3',
      cache_data: cacheData,
      expires_timestamp: expiresAt
    })

    console.log('✅ Instant cache updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        source: 'fresh',
        data: cacheData,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Instant cache error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})