import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const body = await req.json().catch(() => ({}))
    const { action = 'get', category, forceRefresh = false } = body

    console.log(`🎯 Smart cache action: ${action}`, { category, forceRefresh })

    switch (action) {
      case 'get':
        return await getCachedProducts(supabase, category, forceRefresh)
      
      case 'refresh':
        return await refreshCache(supabase)
      
      case 'stats':
        return await getCacheStats(supabase)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('❌ Smart cache error:', error)
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

async function getCachedProducts(supabase: any, category?: string, forceRefresh = false) {
  console.log('📦 Getting cached products...', { category, forceRefresh })

  // Check cache freshness
  if (!forceRefresh) {
    const { data: cacheCheck } = await supabase
      .from('shopify_products_cache')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const isCacheFresh = cacheCheck && new Date(cacheCheck.updated_at) > fifteenMinutesAgo

    if (!isCacheFresh) {
      console.log('🔄 Cache is stale, triggering refresh...')
      // Trigger background refresh but don't wait for it
      supabase.functions.invoke('bulk-product-sync', { body: {} }).catch(console.error)
    }
  }

  // Build query based on category
  let query = supabase
    .from('shopify_products_cache')
    .select(`
      id,
      shopify_id,
      title,
      handle,
      description,
      vendor,
      product_type,
      price,
      compare_at_price,
      available,
      image,
      variants,
      collection_handles,
      tags,
      category,
      updated_at
    `)
    .eq('available', true)
    .order('title')

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: products, error } = await query

  if (error) {
    throw error
  }

  // Get collections
  const { data: collections } = await supabase
    .from('shopify_collections_cache')
    .select('*')
    .order('title')

  // Group products by category
  const productsByCategory = products?.reduce((acc: any, product: any) => {
    const cat = product.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(product)
    return acc
  }, {}) || {}

  // Get category counts
  const categoryCounts = Object.entries(productsByCategory).map(([cat, prods]: [string, any]) => ({
    category: cat,
    count: prods.length,
    products: prods
  }))

  console.log(`✅ Loaded ${products?.length || 0} products in ${categoryCounts.length} categories`)

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        products: products || [],
        collections: collections || [],
        categories: categoryCounts,
        stats: {
          total_products: products?.length || 0,
          total_collections: collections?.length || 0,
          last_updated: products?.[0]?.updated_at || null,
          cache_fresh: !forceRefresh
        }
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function refreshCache(supabase: any) {
  console.log('🔄 Triggering cache refresh...')

  // Trigger bulk sync
  const { data, error } = await supabase.functions.invoke('bulk-product-sync', {
    body: { forceRefresh: true }
  })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Cache refresh triggered',
      data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCacheStats(supabase: any) {
  console.log('📊 Getting cache statistics...')

  const [
    { count: productCount },
    { count: collectionCount },
    { data: lastUpdate }
  ] = await Promise.all([
    supabase.from('shopify_products_cache').select('*', { count: 'exact', head: true }),
    supabase.from('shopify_collections_cache').select('*', { count: 'exact', head: true }),
    supabase.from('shopify_products_cache').select('updated_at').order('updated_at', { ascending: false }).limit(1).single()
  ])

  // Get category breakdown
  const { data: categoryStats } = await supabase
    .from('shopify_products_cache')
    .select('category')
    .not('category', 'is', null)

  const categoryBreakdown = categoryStats?.reduce((acc: any, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {}) || {}

  const stats = {
    total_products: productCount || 0,
    total_collections: collectionCount || 0,
    last_updated: lastUpdate?.updated_at || null,
    cache_age_minutes: lastUpdate?.updated_at 
      ? Math.floor((Date.now() - new Date(lastUpdate.updated_at).getTime()) / (1000 * 60))
      : null,
    categories: categoryBreakdown
  }

  console.log('📊 Cache stats:', stats)

  return new Response(
    JSON.stringify({
      success: true,
      stats
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}