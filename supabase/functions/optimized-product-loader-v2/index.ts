import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      collection_handle,
      use_type = 'delivery',
      limit = 50,
      offset = 0,
      lightweight = true,
      compress_images = true
    } = await req.json()

    console.log(`🚀 Optimized loader v2: ${collection_handle}, limit: ${limit}, offset: ${offset}`)

    // Use optimized query with pagination
    let query = supabase
      .from('shopify_products_cache')
      .select(`
        id,
        title,
        handle,
        shopify_id,
        price,
        image,
        vendor,
        product_type,
        data
      `)
      .range(offset, offset + limit - 1)

    // Filter by collection if specified
    if (collection_handle && collection_handle !== 'all') {
      query = query.contains('data', { collections: [collection_handle] })
    }

    const { data: products, error } = await query.order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Process products for delivery optimization
    const processedProducts = products?.map(product => {
      const productData = product.data || {}
      
      // Optimize image URLs
      let optimizedImage = product.image
      if (compress_images && product.image) {
        // Add compression parameters to Shopify images
        const url = new URL(product.image)
        url.searchParams.set('width', '400')
        url.searchParams.set('height', '400')
        url.searchParams.set('format', 'webp')
        url.searchParams.set('quality', '80')
        optimizedImage = url.toString()
      }

      return {
        id: product.id,
        shopify_id: product.shopify_id,
        title: product.title,
        handle: product.handle,
        price: product.price || '0',
        image: optimizedImage,
        vendor: product.vendor || '',
        product_type: product.product_type || '',
        category: productData.category || 'other',
        collection_handles: productData.collections || [],
        variants: lightweight ? [] : (productData.variants || []),
        description: lightweight ? '' : (productData.description || ''),
        tags: productData.tags || []
      }
    }) || []

    // Build collections structure
    const collectionsMap = new Map()
    
    processedProducts.forEach(product => {
      product.collection_handles?.forEach(handle => {
        if (!collectionsMap.has(handle)) {
          collectionsMap.set(handle, {
            id: handle,
            title: handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            handle: handle,
            products: []
          })
        }
        collectionsMap.get(handle).products.push(product)
      })
    })

    const collections = Array.from(collectionsMap.values())

    // Cache the results
    const cacheKey = `optimized_products_${collection_handle}_${offset}_${limit}`
    const cacheData = {
      products: processedProducts,
      collections,
      cached_at: new Date().toISOString(),
      total_count: processedProducts.length
    }

    // Background cache update (don't await)
    supabase
      .from('cache')
      .upsert({
        key: cacheKey,
        data: cacheData,
        expires_at: Date.now() + (5 * 60 * 1000) // 5 minutes
      })
      .then(() => console.log(`✅ Cached ${processedProducts.length} products`))
      .catch(err => console.warn('Cache update failed:', err))

    console.log(`✅ Loaded ${processedProducts.length} optimized products`)

    return new Response(
      JSON.stringify({
        success: true,
        products: processedProducts,
        collections,
        pagination: {
          offset,
          limit,
          total: processedProducts.length,
          has_more: processedProducts.length === limit
        },
        cached: false,
        optimized: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes browser cache
        } 
      }
    )

  } catch (error) {
    console.error('Optimized loader error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products: [],
        collections: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})