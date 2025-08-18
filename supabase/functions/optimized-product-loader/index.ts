import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Optimized product loader starting...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { app_slug, lightweight = true, force_refresh = false } = await req.json().catch(() => ({}))
    
    const cacheKey = `products_${app_slug || 'all'}_${lightweight ? 'light' : 'full'}`
    
    // Check cache first unless force refresh
    if (!force_refresh) {
      const { data: cached } = await supabase.functions.invoke('cache-manager', {
        body: { action: 'get', key: cacheKey }
      });
      
      if (cached?.success && cached.data) {
        console.log('✅ Returning cached products')
        return new Response(
          JSON.stringify({
            success: true,
            ...cached.data,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get products from cache table (faster than Shopify API)
    const productsQuery = supabase
      .from('shopify_products_cache')
      .select(lightweight ? 'id, title, price, image, category, vendor' : '*')
      .order('updated_at', { ascending: false })
      .limit(150)

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    if (!products || products.length === 0) {
      console.log('❌ No cached products found, triggering emergency sync...')
      
      // Trigger emergency product sync
      try {
        console.log('🚨 Calling emergency-product-sync...')
        const syncResult = await supabase.functions.invoke('emergency-product-sync')
        console.log('Emergency sync result:', syncResult)
        
        if (syncResult.data?.success) {
          console.log('✅ Emergency sync completed, retrying product load...')
          // Retry getting products after sync
          const { data: freshProducts } = await supabase
            .from('shopify_products_cache')
            .select(lightweight ? 'id, title, price, image, category, vendor' : '*')
            .order('updated_at', { ascending: false })
            .limit(150)
          
          if (freshProducts && freshProducts.length > 0) {
            console.log(`🎉 Found ${freshProducts.length} products after emergency sync`)
            const transformedProducts = freshProducts.map(product => ({
              id: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              category: product.category || 'other',
              vendor: product.vendor,
              ...(lightweight ? {} : {
                description: product.description,
                variants: product.variants || [],
                collection_handles: product.collection_handles || []
              })
            }))

            const { data: categories } = await supabase.rpc('get_categories_with_counts')
            const collections = categories?.map(cat => ({
              id: cat.category,
              title: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
              handle: cat.category,
              products: transformedProducts.filter(p => p.category === cat.category)
            })) || []

            const result = {
              products: transformedProducts,
              collections,
              categories: categories || [],
              cached: false,
              lightweight
            }

            return new Response(
              JSON.stringify({
                success: true,
                ...result
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (syncError) {
        console.error('Emergency sync failed:', syncError)
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          products: [],
          collections: [],
          cached: false,
          refreshing: false,
          message: 'No products available - emergency sync attempted'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get categories efficiently
    const { data: categories } = await supabase.rpc('get_categories_with_counts')

    // Transform products efficiently
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category || 'other',
      vendor: product.vendor,
      ...(lightweight ? {} : {
        description: product.description,
        variants: product.variants || [],
        collection_handles: product.collection_handles || []
      })
    }))

    // Group by category efficiently
    const collections = categories?.map(cat => ({
      id: cat.category,
      title: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      handle: cat.category,
      products: transformedProducts.filter(p => p.category === cat.category)
    })) || []

    const result = {
      products: transformedProducts,
      collections,
      categories: categories || [],
      cached: false,
      lightweight
    }

    // Cache the result for 5 minutes
    supabase.functions.invoke('cache-manager', {
      body: {
        action: 'set',
        key: cacheKey,
        data: result,
        ttl_minutes: 5
      }
    }).catch(console.error)

    console.log(`✅ Loaded ${transformedProducts.length} products in ${collections.length} collections`)

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in optimized product loader:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products: [],
        collections: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})