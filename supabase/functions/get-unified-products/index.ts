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

    const requestBody = await req.json().catch(() => ({}))
    
    const { 
      app_slug, 
      category, 
      collection_handle,
      search_category, // For search functionality (uses productType)
      delivery_app_id, // For specific delivery app filtering
      tab_collection_handles, // Array of collection handles for this tab
      use_type = 'delivery', // 'search' or 'delivery' - determines filtering method
      lightweight = true, 
      force_refresh = false,
      limit = null // Remove default limit to process ALL products for collections
    } = requestBody

    console.log(`🔍 Loading unified products - use_type: ${use_type}, category: ${category}, collection: ${collection_handle}, search_category: ${search_category}, tab_collections: ${tab_collection_handles}, lightweight: ${lightweight}`)
    console.log('🔍 Full request body:', requestBody)

    // Debug: Check what products we actually have in cache
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('shopify_products_cache')
      .select('id, title, collection_handles')
      .limit(5)
    
    console.log('🔍 Sample products in cache:', sampleProducts?.map(p => ({
      id: p.id,
      title: p.title,
      collection_handles: p.collection_handles
    })))

    // Check if we need to refresh cache OR if cache is empty
    const { count: productCount, error: countError } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    const cacheEmpty = !productCount || productCount < 50
    
    if (force_refresh || cacheEmpty || await needsCacheRefresh(supabase)) {
      console.log(`🔄 Triggering unified sync... (force: ${force_refresh}, empty: ${cacheEmpty}, products: ${productCount || 0})`)
      await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      })
    }

    // Get products from unified cache
    let productsQuery = supabase
      .from('shopify_products_cache')
      .select(lightweight ? 
        'id, title, price, image, category, category_title, vendor, handle, product_type, search_category, collection_handles, sort_order' : 
        '*'
      )
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    // CRITICAL: For collection requests, bypass products cache and go straight to collections cache
    if (collection_handle && collection_handle !== 'all') {
      console.log(`🎯 Getting exact Shopify collection: ${collection_handle}`)
      
      // Get collection data directly from Shopify collections cache (already in correct order)
      const { data: collectionData, error: collectionError } = await supabase
        .from('shopify_collections_cache')
        .select('*')
        .eq('handle', collection_handle)
        .single()
      
      if (collectionError || !collectionData) {
        console.error('Collection not found:', collectionError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Collection '${collection_handle}' not found in cache`,
            products: [], 
            collections: [] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Use products directly from collection data (preserves Shopify sort order)
      const collectionProducts = collectionData.data?.products || []
      console.log(`✅ SHOPIFY ORDER: Found ${collectionProducts.length} products for ${collection_handle}`)
      console.log(`First 3 products: ${collectionProducts.slice(0, 3).map(p => p.title).join(', ')}`)
      
      const result = {
        success: true,
        products: collectionProducts,
        collections: [{
          id: collection_handle,
          title: collectionData.title || collection_handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          handle: collection_handle,
          product_count: collectionProducts.length,
          products: collectionProducts
        }],
        categories: [],
        total_products: collectionProducts.length,
        total_collections: 1,
        cached: true,
        lightweight,
        use_type,
        last_sync: collectionData.updated_at,
        cache_info: { source: 'shopify_collections_cache', preserves_shopify_order: true }
      }
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      // For delivery apps: FORCE create collections from ALL available collection handles
      console.log(`🔍 Processing ${products?.length || 0} products for collection mapping`)
      
      const collectionsMap = new Map()
      
      // Process every product and extract ALL collection handles
      products?.forEach((product, index) => {
        if (index < 5) {
          console.log(`🔍 Sample product ${index + 1}:`, {
            id: product.id,
            title: product.title,
            collection_handles: product.collection_handles,
            type: typeof product.collection_handles
          })
        }
        
        // Handle different possible formats of collection_handles
        let handles = []
        if (typeof product.collection_handles === 'string') {
          // If it's a string, try to parse as JSON
          try {
            handles = JSON.parse(product.collection_handles)
          } catch {
            // If not JSON, treat as single handle
            handles = [product.collection_handles]
          }
        } else if (Array.isArray(product.collection_handles)) {
          handles = product.collection_handles
        }
        
        if (handles && handles.length > 0) {
          handles.forEach(handle => {
            if (handle && typeof handle === 'string') {
              if (!collectionsMap.has(handle)) {
                // Find collection title from collectionsData or create readable title
                const collectionData = collectionsData?.find(col => col.handle === handle)
                collectionsMap.set(handle, {
                  id: handle,
                  title: collectionData?.title || handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  handle: handle,
                  product_count: 0,
                  products: []
                })
              }
              const collection = collectionsMap.get(handle)
              collection.products.push(product)
              collection.product_count++
            }
          })
        }
      })
      
      collections = Array.from(collectionsMap.values())
      
      console.log(`📦 Created ${collections.length} collections from products:`)
      collections.forEach(col => {
        console.log(`📦 Collection "${col.handle}" (${col.title}): ${col.product_count} products`)
      })
      
      // If specific collection handles are requested, filter collections
      if (tab_collection_handles && Array.isArray(tab_collection_handles) && tab_collection_handles.length > 0) {
        console.log(`🎯 Filtering for specific collections: ${tab_collection_handles.join(', ')}`)
        collections = collections.filter(col => tab_collection_handles.includes(col.handle))
        console.log(`🎯 Filtered to ${collections.length} collections`)
      }
      
      // Log specific collections we're looking for
      const tailgateBeer = collections.find(c => c.handle === 'tailgate-beer')
      const spirits = collections.find(c => c.handle === 'spirits')
      const cocktailKits = collections.find(c => c.handle === 'cocktail-kits')
      
      console.log('🍺 tailgate-beer collection:', tailgateBeer ? `${tailgateBeer.product_count} products` : 'NOT FOUND')
      console.log('🥃 spirits collection:', spirits ? `${spirits.product_count} products` : 'NOT FOUND')
      console.log('🍸 cocktail-kits collection:', cocktailKits ? `${cocktailKits.product_count} products` : 'NOT FOUND')
    }

    // Get cache metadata
    const { data: cacheData } = await supabase
      .from('cache')
      .select('data, updated_at')
      .eq('key', 'shopify-unified-sync')
      .maybeSingle()

    // If specific collection was requested, return ONLY those products, not all products
    const finalProducts = collection_handle && collection_handle !== 'all' 
      ? (products || []).filter(product => {
          const handles = Array.isArray(product.collection_handles) 
            ? product.collection_handles 
            : typeof product.collection_handles === 'string' 
              ? JSON.parse(product.collection_handles || '[]')
              : []
          return handles.includes(collection_handle)
        })
      : (products || [])

    const result = {
      success: true,
      products: limit ? finalProducts.slice(0, limit) : finalProducts,
      collections,
      categories: collections, // Categories and collections based on use_type
      total_products: finalProducts.length,
      total_collections: collections.length,
      cached: true,
      lightweight,
      use_type,
      last_sync: cacheData?.updated_at || null,
      cache_info: cacheData?.data || null
    }

    console.log(`✅ Returning ${result.products.length} products (from ${result.total_products} total) in ${result.total_collections} collections`)

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
    const { count: productCount, error: countError } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking product count:', countError)
      return true
    }

    if (!productCount || productCount < 50) {
      console.log(`🚨 Product cache too small: ${productCount} products`)
      return true
    }

    // Check if cache is stale (older than 30 minutes)
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache')
      .select('updated_at')
      .eq('key', 'shopify-unified-sync')
      .maybeSingle()

    if (cacheError) {
      console.error('Error checking cache:', cacheError)
      return true
    }

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