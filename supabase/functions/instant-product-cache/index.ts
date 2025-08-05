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

    // Parse request body for force refresh option
    let forceRefresh = false
    try {
      const body = await req.json()
      forceRefresh = body?.forceRefresh === true
    } catch {
      // No body or invalid JSON, use default
    }

    console.log('⚡ Starting instant product cache optimization...')
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - skipping cache')
    }

    // Check if we have fresh cache (less than 2 minutes old) and not force refreshing
    let existingCache = null
    if (!forceRefresh) {
      const { data } = await supabase
        .from('cache')
        .select('*')
        .eq('key', 'instant_products_v3')
        .gte('expires_at', Date.now())
        .single()
      
      existingCache = data
    }

    if (existingCache && !forceRefresh) {
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

    // Fetch fresh data from Shopify in parallel
    console.log('📦 Fetching fresh products...')
    
    const [shopifyResult, collectionsResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-shopify-products'),
      supabase.functions.invoke('get-all-collections', { body: { limit: 50 } })
    ])

    let products = []
    let collections = []

    // Only use results if we successfully got products - don't cache empty results!
    if (shopifyResult.status === 'fulfilled' && !shopifyResult.value.error && shopifyResult.value.data?.products?.length > 0) {
      products = shopifyResult.value.data.products
      console.log(`✅ Successfully fetched ${products.length} products`)
    } else {
      console.log('⚠️ No products fetched or error occurred')
      console.log('Shopify result:', shopifyResult)
      
      // If force refresh failed and we have existing cache, return it
      if (forceRefresh && existingCache) {
        console.log('🔄 Force refresh failed, returning existing cache')
        return new Response(
          JSON.stringify({
            success: true,
            source: 'existing',
            data: existingCache.data,
            warning: 'Force refresh failed, using existing cache'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Try to get any existing cache as fallback
      if (!existingCache) {
        const { data: fallbackCache } = await supabase
          .from('cache')
          .select('*')
          .eq('key', 'instant_products_v3')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (fallbackCache) {
          console.log('📦 Using expired cache as fallback')
          return new Response(
            JSON.stringify({
              success: true,
              source: 'fallback',
              data: fallbackCache.data,
              warning: 'Using expired cache - fresh data unavailable'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    if (collectionsResult.status === 'fulfilled' && !collectionsResult.value.error) {
      collections = collectionsResult.value.data?.collections || []
      console.log(`✅ Successfully fetched ${collections.length} collections`)
    }

    // Don't cache if we have no products at all
    if (products.length === 0) {
      console.log('❌ No products to cache, aborting cache update')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No products available to cache',
          data: { products: [], collections: collections }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optimize product data for instant loading - ALL PRODUCTS!
    const optimizedProducts = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image?.includes('?') 
        ? `${product.image}&width=300&height=300` 
        : `${product.image}?width=300&height=300`,
      handle: product.handle,
      variants: product.variants?.slice(0, 1) || []
    }))

    const optimizedCollections = collections.slice(0, 50).map((collection: any) => ({
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

    console.log(`✅ Caching ALL ${optimizedProducts.length} products and ${optimizedCollections.length} collections`)

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