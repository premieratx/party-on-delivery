import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔥 EXECUTING IMMEDIATE SYNC NOW...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear existing caches
    console.log('🧹 Clearing caches...')
    await supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Call the existing fetch-shopify-products function
    console.log('📞 Calling fetch-shopify-products...')
    const { data: products, error } = await supabase.functions.invoke('fetch-shopify-products')

    if (error) {
      console.error('❌ Fetch failed:', error)
      throw error
    } 
    
    if (!products?.products || products.products.length === 0) {
      console.log('❌ No products returned from fetch-shopify-products')
      throw new Error('No products returned from Shopify sync')
    }

    console.log(`✅ Got ${products.products.length} products from Shopify`)
    
    // Insert into cache
    const batchSize = 100
    let insertedCount = 0
    
    for (let i = 0; i < products.products.length; i += batchSize) {
      const batch = products.products.slice(i, i + batchSize)
      
      const insertData = batch.map((product, index) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor || '',
        product_type: product.productType || product.product_type || '',
        price: parseFloat(product.price || '0'),
        image: product.image || '',
        category: product.category || 'Uncategorized',
        collection_handles: Array.isArray(product.collections) ? product.collections.map(c => c.handle) : [],
        variants: product.variants || [],
        description: product.description || '',
        sort_order: i + index,
        data: product
      }))
      
      const { error: insertError } = await supabase
        .from('shopify_products_cache')
        .insert(insertData)
      
      if (insertError) {
        console.error(`❌ Insert error:`, insertError)
        throw insertError
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted: ${insertedCount}/${products.products.length}`)
    }
    
    // Verify insertion
    const { data: verification } = await supabase
      .from('shopify_products_cache')
      .select('count(*)')
      .single()

    console.log(`🎉 SYNC COMPLETE: ${insertedCount} products inserted, verified: ${verification?.count || 0}`)

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: insertedCount,
        verified_count: verification?.count || 0,
        message: 'Products synced successfully in correct order'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Sync failed:', error)
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