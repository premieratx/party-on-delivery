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
        .maybeSingle()
      
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

    // Handle different scenarios more gracefully
    if (shopifyResult.status === 'fulfilled' && shopifyResult.value.data?.success && shopifyResult.value.data?.products?.length > 0) {
      products = shopifyResult.value.data.products
      console.log(`✅ Successfully fetched ${products.length} products`)
    } else {
      console.log('⚠️ No products fetched or error occurred')
      console.log('Shopify result:', shopifyResult)
      
      // Try to get any existing cache as fallback FIRST
      const { data: fallbackCache } = await supabase
        .from('cache')
        .select('*')
        .eq('key', 'instant_products_v3')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (fallbackCache) {
        console.log('📦 Using expired cache as fallback')
        return new Response(
          JSON.stringify({
            success: true,
            source: 'fallback',
            data: fallbackCache.data,
            warning: 'Using cached data - fresh data unavailable due to rate limits'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // No cache available at all - return empty but valid structure
        console.log('❌ No cache available, returning empty structure')
        return new Response(
          JSON.stringify({
            success: true,
            source: 'empty',
            data: { 
              products: [], 
              collections: [],
              cached_at: new Date().toISOString(),
              total_products: 0,
              total_collections: 0
            },
            warning: 'No products available - cache empty and Shopify unavailable'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (collectionsResult.status === 'fulfilled' && !collectionsResult.value.error) {
      collections = collectionsResult.value.data?.collections || []
      console.log(`✅ Successfully fetched ${collections.length} collections`)
    }

    // If we still have no products but have collections, don't completely fail
    if (products.length === 0 && collections.length > 0) {
      console.log('⚠️ No products but have collections, returning collections-only cache')
      const cacheData = {
        products: [],
        collections: collections.slice(0, 50).map((collection: any) => ({
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          description: collection.description || '',
          products_count: collection.products?.length || 0,
          products: collection.products?.map((product: any) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image?.includes('?') 
              ? `${product.image}&width=300&height=300` 
              : `${product.image}?width=300&height=300`,
            handle: product.handle,
            description: product.description || '',
            variants: product.variants?.slice(0, 1) || []
          })) || []
        })),
        cached_at: new Date().toISOString(),
        total_products: 0,
        total_collections: collections.length
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          source: 'collections_only',
          data: cacheData,
          warning: 'Only collections available - product sync in progress'
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
      description: collection.description || '',
      products_count: collection.products?.length || 0,
      // For bulk editing, include ALL products in each collection, not just the first 12
      products: collection.products?.map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image?.includes('?') 
          ? `${product.image}&width=300&height=300` 
          : `${product.image}?width=300&height=300`,
        handle: product.handle,
        description: product.description || '',
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