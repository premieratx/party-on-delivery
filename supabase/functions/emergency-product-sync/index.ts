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
    console.log('🚨 EMERGENCY PRODUCT SYNC: Starting rate-limit-safe reload...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { forceRefresh = true, clearCache = true } = await req.json().catch(() => ({ forceRefresh: true, clearCache: true }))

    // Clear existing cache to force fresh data
    if (clearCache) {
      console.log('🗑️ Clearing all product caches...')
      await Promise.all([
        supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('cache').delete().like('key', 'products%'),
        supabase.from('cache').delete().like('key', 'shopify%')
      ])
    }

    // Use the working fetch-shopify-products which has proven to work with rate limiting
    console.log('🔄 Calling proven fetch-shopify-products function...')
    
    const { data: syncData, error: syncError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { force: true }
    })
    
    if (syncError) {
      console.error('❌ Fetch failed:', syncError)
      // Don't throw immediately, try to recover
    } else {
      console.log('✅ Fetch completed:', syncData)
      
      // NOW STORE THE PRODUCTS IN THE CACHE!
      if (syncData?.products && syncData.products.length > 0) {
        console.log(`💾 Storing ${syncData.products.length} products in cache...`)
        
        // Transform products to cache format
        const cacheProducts = syncData.products.map((product: any) => ({
          shopify_product_id: product.id,
          title: product.title,
          handle: product.handle,
          price: parseFloat(product.price || '0'),
          image: product.image || '/placeholder.svg',
          vendor: product.vendor || '',
          description: product.description || '',
          product_type: product.productType || '',
          category: product.category || 'other',
          category_title: product.category || 'Other',
          search_category: product.productType || 'other',
          tags: product.tags || [],
          collection_handles: product.collections?.map((c: any) => c.handle) || [],
          variants: product.variants || [],
          data: product,
          updated_at: new Date().toISOString()
        }))
        
        // Insert in batches to avoid timeout
        const batchSize = 50
        let inserted = 0
        
        for (let i = 0; i < cacheProducts.length; i += batchSize) {
          const batch = cacheProducts.slice(i, i + batchSize)
          
          const { error: insertError } = await supabase
            .from('shopify_products_cache')
            .insert(batch)
          
          if (insertError) {
            console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
          } else {
            inserted += batch.length
            console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products`)
          }
        }
        
        console.log(`💾 Successfully stored ${inserted}/${cacheProducts.length} products`)
      }
    }

    // Wait a moment for data to settle
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if we now have products
    const { data: productCheck, error: checkError } = await supabase
      .from('shopify_products_cache')
      .select('id, title')
      .limit(10)
    
    if (checkError) {
      console.error('❌ Error checking products:', checkError)
    }
    
    const productCount = productCheck?.length || 0
    console.log(`📊 Products in cache after sync: ${productCount}`)

    // If still no products, the cache tables might need to be rebuilt
    if (productCount === 0) {
      console.log('⚠️ No products found. Cache may be corrupted or API rate limited.')
      
      // Return partial success to avoid infinite loops
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No products loaded - possible rate limiting or cache issues',
          products_synced: 0,
          suggestion: 'Wait 5 minutes and try again'
        }),
        { 
          status: 200, // Return 200 to avoid cascading errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Success - we have products
    console.log('✅ EMERGENCY PRODUCT SYNC COMPLETE')

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_synced: productCount,
        message: `Emergency sync completed - ${productCount} products loaded`,
        sync_type: 'emergency',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Emergency sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Emergency product sync failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})