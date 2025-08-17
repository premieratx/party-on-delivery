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
    console.log('🔄 Starting bulk product sync from Shopify...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📦 Fetching fresh products from Shopify...')
    
    // Invoke the fetch function to get latest products
    const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { forceRefresh: true }
    })
    
    console.log('Response from fetch-shopify-products:', { shopifyData, shopifyError })

    if (shopifyError) {
      console.error('Error fetching from Shopify:', shopifyError)
      throw new Error(`Failed to fetch from Shopify: ${shopifyError.message}`)
    }

    const products = shopifyData?.products || []
    console.log(`✅ Fetched ${products.length} products from Shopify`)

    if (products.length === 0) {
      console.warn('No products to sync')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No products returned from Shopify',
          productCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear existing cache
    console.log('🗑️ Clearing existing product cache...')
    const { error: deleteError } = await supabase
      .from('shopify_products_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.error('Error clearing cache:', deleteError)
    }

    // Batch insert products
    const batchSize = 50
    let totalInserted = 0
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      const cacheItems = batch.map((product: any) => ({
        shopify_id: product.id,
        title: product.title,
        handle: product.handle || '',
        data: product,
        collection_id: product.collection_id || null
      }))

      const { data: insertData, error: insertError } = await supabase
        .from('shopify_products_cache')
        .insert(cacheItems)

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
      } else {
        totalInserted += cacheItems.length
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${cacheItems.length} products)`)
      }
    }

    // Update category mappings
    console.log('🏷️ Updating category mappings...')
    const categoryMappings = [
      { collection_handle: 'spirits', app_category: 'spirits' },
      { collection_handle: 'beer', app_category: 'beer' },
      { collection_handle: 'wine', app_category: 'wine' },
      { collection_handle: 'cocktails', app_category: 'cocktails' },
      { collection_handle: 'mixers', app_category: 'mixers' },
      { collection_handle: 'party-supplies', app_category: 'party-supplies' }
    ]

    for (const mapping of categoryMappings) {
      const { error: mappingError } = await supabase
        .from('category_mappings_simple')
        .upsert(mapping)
      
      if (mappingError) {
        console.error('Error updating category mapping:', mappingError)
      }
    }

    console.log(`🎉 Bulk sync completed! Inserted ${totalInserted} products`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk sync completed successfully',
        productCount: totalInserted,
        originalProductCount: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in shopify-bulk-sync:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})