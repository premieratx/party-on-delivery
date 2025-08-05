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

    console.log('⚡ Lightning Sync - Ultra-fast data synchronization starting...')
    const syncStartTime = Date.now()

    // Parallel execution for maximum speed
    const [shopifyResult, collectionsResult, cacheCleanup] = await Promise.allSettled([
      // 1. Get fresh Shopify data
      supabase.functions.invoke('fetch-shopify-products'),
      
      // 2. Get collections with timeout
      Promise.race([
        supabase.functions.invoke('get-all-collections', { body: { limit: 100 } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]),
      
      // 3. Clean old cache in parallel
      supabase.rpc('cleanup_expired_cache')
    ])

    let products = []
    let collections = []

    // Process results with fault tolerance
    if (shopifyResult.status === 'fulfilled' && !shopifyResult.value.error) {
      products = shopifyResult.value.data?.products || []
      console.log(`✅ Shopify products loaded: ${products.length}`)
    } else {
      console.warn('⚠️ Shopify products failed, continuing with empty array')
    }

    if (collectionsResult.status === 'fulfilled' && !collectionsResult.value.error) {
      collections = collectionsResult.value.data?.collections || []
      console.log(`✅ Collections loaded: ${collections.length}`)
    } else {
      console.warn('⚠️ Collections failed, continuing with empty array')
    }

    // Ultra-optimized data structure for instant access
    const lightningData = {
      products: products.slice(0, 150).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image ? `${product.image}?width=400&height=400&format=webp&quality=85` : null,
        handle: product.handle,
        variants: product.variants?.slice(0, 2) || [],
        category: inferCategory(product.title, product.collections || [])
      })),
      
      collections: collections.slice(0, 30).map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        products: collection.products?.slice(0, 20).map((product: any) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image ? `${product.image}?width=400&height=400&format=webp&quality=85` : null,
          handle: product.handle,
          variants: product.variants?.slice(0, 1) || []
        })) || []
      })),
      
      categories: generateCategoryMap(collections),
      
      meta: {
        syncTime: new Date().toISOString(),
        totalProducts: products.length,
        totalCollections: collections.length,
        performance: {
          syncDuration: Date.now() - syncStartTime,
          dataSize: JSON.stringify({ products, collections }).length
        }
      }
    }

    // Multi-tier caching strategy
    const cacheOps = [
      // 1. Instant cache (30 seconds TTL)
      supabase.rpc('safe_cache_upsert', {
        cache_key: 'lightning_instant_v1',
        cache_data: lightningData,
        expires_timestamp: Date.now() + (30 * 1000)
      }),
      
      // 2. Standard cache (2 minutes TTL) 
      supabase.rpc('safe_cache_upsert', {
        cache_key: 'instant_products_v4',
        cache_data: lightningData,
        expires_timestamp: Date.now() + (2 * 60 * 1000)
      }),
      
      // 3. Emergency backup (1 hour TTL)
      supabase.rpc('safe_cache_upsert', {
        cache_key: 'emergency_products_backup',
        cache_data: lightningData,
        expires_timestamp: Date.now() + (60 * 60 * 1000)
      })
    ]

    await Promise.allSettled(cacheOps)

    const totalTime = Date.now() - syncStartTime
    console.log(`⚡ Lightning Sync completed in ${totalTime}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        source: 'lightning-sync',
        data: lightningData,
        performance: {
          syncTime: totalTime,
          productsCount: lightningData.products.length,
          collectionsCount: lightningData.collections.length,
          cacheOpsCompleted: cacheOps.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Lightning Sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        source: 'lightning-sync-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions for optimization
function inferCategory(title: string, collections: string[]): string {
  const text = `${title} ${collections.join(' ')}`.toLowerCase()
  
  if (text.includes('spirit') || text.includes('vodka') || text.includes('whiskey')) return 'spirits'
  if (text.includes('beer') || text.includes('brew') || text.includes('lager')) return 'beer'  
  if (text.includes('wine') || text.includes('champagne')) return 'wine'
  if (text.includes('cocktail') || text.includes('mixer')) return 'cocktails'
  if (text.includes('seltzer') || text.includes('cider')) return 'seltzers'
  if (text.includes('party') || text.includes('supplies')) return 'party-supplies'
  
  return 'other'
}

function generateCategoryMap(collections: any[]): Record<string, string[]> {
  const categoryMap: Record<string, string[]> = {
    spirits: [],
    beer: [],
    wine: [],
    cocktails: [],
    seltzers: [],
    'party-supplies': [],
    other: []
  }
  
  collections.forEach(collection => {
    const category = inferCategory(collection.title, [collection.handle])
    if (categoryMap[category]) {
      categoryMap[category].push(collection.handle)
    }
  })
  
  return categoryMap
}