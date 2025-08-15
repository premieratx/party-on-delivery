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
    console.log('🚀 Instant cache: Loading products from cache')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get cached products
    const { data: products, error: productsError } = await supabase
      .from('shopify_products_cache')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    // Get categories with counts using the function
    const { data: categories, error: categoriesError } = await supabase
      .rpc('get_categories_with_counts')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    // Transform products to match expected format
    const transformedProducts = products?.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      variants: product.variants || [],
      collection_handles: product.collection_handles || [],
      description: product.description,
      vendor: product.vendor
    })) || []

    // Group products by category
    const collections = categories?.map(cat => ({
      id: cat.category,
      title: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      handle: cat.category,
      products: transformedProducts.filter(product => 
        product.collection_handles?.some(handle => 
          handle.includes(cat.category) || cat.category.includes(handle)
        )
      )
    })) || []

    console.log(`📦 Loaded ${transformedProducts.length} products in ${collections.length} collections`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          products: transformedProducts,
          collections: collections
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
        data: { products: [], collections: [] }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})