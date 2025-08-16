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
    console.log('⚡ Starting instant product cache optimization...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const forceRefresh = body.forceRefresh || false

    // Check if we have fresh cache (less than 5 minutes old)
    if (!forceRefresh) {
      const { data: cacheCheck } = await supabase
        .from('shopify_products_cache')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (cacheCheck && new Date(cacheCheck.updated_at) > fiveMinutesAgo) {
        console.log('✅ Using existing fresh cache')
        
        // Get cached products
        const { data: products } = await supabase
          .from('shopify_products_cache')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(200)

        // Get categories with counts
        const { data: categories } = await supabase.rpc('get_categories_with_counts')

        // Transform and group products
        const transformedProducts = products?.map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          variants: product.variants || [],
          collection_handles: product.collection_handles || [],
          description: product.description,
          vendor: product.vendor,
          category: product.category || 'other'
        })) || []

        const collections = categories?.map(cat => ({
          id: cat.category,
          title: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
          handle: cat.category,
          products: transformedProducts.filter(product => 
            product.collection_handles?.some(handle => 
              handle.includes(cat.category) || cat.category.includes(handle)
            ) || product.category === cat.category
          )
        })) || []

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              products: transformedProducts,
              collections: collections,
              categories: categories || []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fetch fresh products from Shopify
    console.log('📦 Fetching fresh products...')
    const { data: shopifyResponse, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { forceRefresh: true }
    })

    if (shopifyError) {
      console.error('Error fetching from Shopify:', shopifyError)
      throw shopifyError
    }

    const shopifyProducts = shopifyResponse?.products || []
    console.log(`✅ Successfully fetched ${shopifyProducts.length} products`)

    if (shopifyProducts.length === 0) {
      console.warn('No products returned from Shopify')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No products available',
          data: { products: [], collections: [], categories: [] }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear existing cache
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Cache products in batches
    const batchSize = 50
    for (let i = 0; i < shopifyProducts.length; i += batchSize) {
      const batch = shopifyProducts.slice(i, i + batchSize)
      
      const cacheItems = batch.map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        description: product.description || '',
        vendor: product.vendor || '',
        category: product.category || 'other',
        collection_handles: product.collections?.map((c: any) => c.handle) || [],
        variants: product.variants || [],
        data: product
      }))

      const { error: cacheError } = await supabase
        .from('shopify_products_cache')
        .insert(cacheItems)

      if (cacheError) {
        console.error(`Error caching batch ${i / batchSize + 1}:`, cacheError)
      }
    }

    console.log(`✅ Caching ALL ${shopifyProducts.length} products completed`)

    // Get categories with counts using the function
    const { data: categories } = await supabase.rpc('get_categories_with_counts')

    // Transform products to match expected format
    const transformedProducts = shopifyProducts.map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      variants: product.variants || [],
      collection_handles: product.collections?.map((c: any) => c.handle) || [],
      description: product.description,
      vendor: product.vendor,
      category: product.category || 'other'
    }))

    // Group products by category
    const collections = categories?.map((cat: any) => ({
      id: cat.category,
      title: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      handle: cat.category,
      products: transformedProducts.filter((product: any) => 
        product.collection_handles?.some((handle: string) => 
          handle.includes(cat.category) || cat.category.includes(handle)
        ) || product.category === cat.category
      )
    })) || []

    console.log(`📦 Loaded ${transformedProducts.length} products in ${collections.length} collections`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          products: transformedProducts,
          collections: collections,
          categories: categories || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in instant-product-cache:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        data: { products: [], collections: [], categories: [] }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})