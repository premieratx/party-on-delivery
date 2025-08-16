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
    console.log('🚀 Triggering Shopify product sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, fetch products from Shopify and populate cache
    console.log('📦 Fetching products from Shopify...')
    const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { 
        forceRefresh: true,
        limit: 100
      }
    })

    if (shopifyError) {
      console.error('❌ Error fetching from Shopify:', shopifyError)
      throw shopifyError
    }

    if (!shopifyData?.products || shopifyData.products.length === 0) {
      console.warn('⚠️ No products returned from Shopify')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No products found in Shopify',
          productsCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Got ${shopifyData.products.length} products from Shopify`)

    // Now populate the shopify_products_cache table
    console.log('💾 Populating shopify_products_cache...')
    
    // Clear existing cache first
    const { error: clearError } = await supabase
      .from('shopify_products_cache')
      .delete()
      .neq('id', '')

    if (clearError) {
      console.warn('⚠️ Error clearing existing cache:', clearError)
    }

    // Insert new products
    const productsToInsert = shopifyData.products.map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: parseFloat(product.price) || 0,
      image: product.image || '/placeholder.svg',
      description: product.description || '',
      vendor: product.vendor || '',
      product_type: product.productType || '',
      tags: product.tags || [],
      variants: product.variants || [],
      collection_handles: product.collections?.map((c: any) => c.handle) || [],
      data: product,
      updated_at: new Date().toISOString()
    }))

    const { data: insertData, error: insertError } = await supabase
      .from('shopify_products_cache')
      .insert(productsToInsert)
      .select('id')

    if (insertError) {
      console.error('❌ Error inserting into cache:', insertError)
      throw insertError
    }

    console.log(`✅ Successfully cached ${insertData?.length || 0} products`)

    // Update category mappings if needed
    console.log('🏷️ Updating category mappings...')
    const categories = ['beer', 'wine', 'spirits', 'mixers', 'snacks']
    
    for (const category of categories) {
      const { error: mappingError } = await supabase
        .from('category_mappings_simple')
        .upsert({
          collection_handle: category,
          app_category: category
        })
        .select()

      if (mappingError) {
        console.warn(`⚠️ Error updating mapping for ${category}:`, mappingError)
      }
    }

    // Clear any stale cache entries
    console.log('🗑️ Clearing stale cache entries...')
    const { error: staleCacheError } = await supabase
      .from('cache')
      .delete()
      .like('key', 'shopify_%')

    if (staleCacheError) {
      console.warn('⚠️ Error clearing stale cache:', staleCacheError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify sync completed successfully',
        productsCount: insertData?.length || 0,
        categoriesMapped: categories.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in trigger-shopify-sync:', error)
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