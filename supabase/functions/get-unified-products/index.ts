import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Unified product loader that serves both categories and collections
 * from a single source of truth
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      app_slug, 
      category, 
      collection_handle,
      search_category, // For search functionality (uses productType)
      use_type = 'delivery', // 'search' or 'delivery' - determines filtering method
      lightweight = true, 
      force_refresh = false,
      limit = 100
    } = await req.json().catch(() => ({}))

    console.log(`🔍 Loading unified products - use_type: ${use_type}, category: ${category}, collection: ${collection_handle}, search_category: ${search_category}, lightweight: ${lightweight}`)

    // Check if we need to refresh cache
    if (force_refresh || await needsCacheRefresh(supabase)) {
      console.log('🔄 Triggering unified sync...')
      await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      })
    }

    // Get products from unified cache
    let productsQuery = supabase
      .from('shopify_products_cache')
      .select(lightweight ? 
        'id, title, price, image, category, category_title, vendor, handle, product_type, search_category, collection_handles' : 
        '*'
      )
      .order('updated_at', { ascending: false })

    // Apply filters based on use type
    if (use_type === 'search') {
      // For search: use search_category (normalized productType)
      if (search_category && search_category !== 'all') {
        productsQuery = productsQuery.eq('search_category', search_category)
      }
    } else {
      // For delivery apps: use collections and category
      if (category && category !== 'all') {
        productsQuery = productsQuery.eq('category', category)
      }

      if (collection_handle && collection_handle !== 'all') {
        productsQuery = productsQuery.contains('collection_handles', [collection_handle])
      }
    }

    if (limit) {
      productsQuery = productsQuery.limit(limit)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    // Get collections/categories
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('shopify_collections_cache')
      .select('handle, title, products_count, data')
      .order('handle')

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError)
    }

    // Transform to unified format based on use type
    let collections: any[] = []
    
    if (use_type === 'search') {
      // For search: group by search_category (productType-based)
      const searchCategories = new Map()
      products?.forEach(product => {
        const searchCat = product.search_category || 'other'
        if (!searchCategories.has(searchCat)) {
          searchCategories.set(searchCat, {
            id: searchCat,
            title: formatCategoryTitle(searchCat),
            handle: searchCat,
            product_count: 0,
            products: []
          })
        }
        const category = searchCategories.get(searchCat)
        category.products.push(product)
        category.product_count++
      })
      collections = Array.from(searchCategories.values())
    } else {
      // For delivery apps: use collections
      collections = collectionsData?.map(col => ({
        id: col.handle,
        title: col.title,
        handle: col.handle,
        product_count: col.products_count,
        products: products?.filter(p => p.category === col.handle) || []
      })) || []
    }

    // Get cache metadata
    const { data: cacheData } = await supabase
      .from('cache')
      .select('data, updated_at')
      .eq('key', 'shopify-unified-sync')
      .single()

    const result = {
      success: true,
      products: products || [],
      collections,
      categories: collections, // Categories and collections based on use_type
      total_products: products?.length || 0,
      total_collections: collections.length,
      cached: true,
      lightweight,
      use_type,
      last_sync: cacheData?.updated_at || null,
      cache_info: cacheData?.data || null
    }

    console.log(`✅ Returning ${result.total_products} products in ${result.total_collections} collections`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in get-unified-products:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products: [],
        collections: [],
        categories: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function needsCacheRefresh(supabase: any): Promise<boolean> {
  try {
    // Check if products cache is empty
    const { count: productCount } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    if (!productCount || productCount < 50) {
      console.log(`🚨 Product cache too small: ${productCount} products`)
      return true
    }

    // Check if cache is stale (older than 30 minutes)
    const { data: cacheData } = await supabase
      .from('cache')
      .select('updated_at')
      .eq('key', 'shopify-unified-sync')
      .single()

    if (!cacheData) {
      console.log('🚨 No unified sync cache found')
      return true
    }

    const cacheAge = Date.now() - new Date(cacheData.updated_at).getTime()
    const thirtyMinutes = 30 * 60 * 1000

    if (cacheAge > thirtyMinutes) {
      console.log(`🚨 Cache is stale: ${Math.floor(cacheAge / 60000)} minutes old`)
      return true
    }

    return false

  } catch (error) {
    console.error('Error checking cache freshness:', error)
    return true // Refresh on error
  }
}

function formatCategoryTitle(category: string): string {
  const titleMap: Record<string, string> = {
    'beer': 'Beer',
    'wine': 'Wine & Champagne',
    'spirits': 'Spirits',
    'cocktails': 'Cocktails',
    'mixers': 'Mixers & N/A',
    'party-supplies': 'Party Supplies',
    'snacks': 'Snacks',
    'other': 'Other'
  }
  
  return titleMap[category] || category.charAt(0).toUpperCase() + category.slice(1)
}