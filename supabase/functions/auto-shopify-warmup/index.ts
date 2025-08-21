import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Auto Shopify warmup started...')

    // Check products count first
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, handle, collection_handle')
      .eq('is_active', true)
      .limit(100)

    const productCount = products?.length || 0
    console.log(`📦 Found ${productCount} active products`)

    // Check collections count
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, title, handle')
      .eq('is_active', true)
      .limit(50)

    const collectionCount = collections?.length || 0
    console.log(`📚 Found ${collectionCount} active collections`)

    // If product count is low, trigger immediate sync
    let syncTriggered = false
    if (productCount < 500) {
      console.log('⚠️ Low product count detected, triggering sync...')
      
      try {
        // Use background task to prevent timeout
        EdgeRuntime.waitUntil(
          (async () => {
            console.log('🔄 Background sync starting...')
            await supabase.functions.invoke('shopify-sync-optimizer', {
              body: { background: true, warmup: true }
            })
            console.log('✅ Background sync completed')
          })()
        )
        
        syncTriggered = true
        console.log('🚀 Background sync initiated')
      } catch (error) {
        console.error('❌ Failed to trigger background sync:', error)
      }
    }

    // Ensure critical collections have products
    const criticalCollections = ['tailgate-beer', 'spirits', 'seltzer-collection']
    const collectionStatus = []

    for (const collectionHandle of criticalCollections) {
      const collectionProducts = products?.filter(p => p.collection_handle === collectionHandle) || []
      const hasProducts = collectionProducts.length > 0
      
      collectionStatus.push({
        collection: collectionHandle,
        product_count: collectionProducts.length,
        has_products: hasProducts
      })
      
      if (!hasProducts) {
        console.log(`⚠️ Collection ${collectionHandle} has no products`)
      }
    }

    // Warm up ultra-fast search to ensure it's ready
    try {
      console.log('🔍 Warming up search cache...')
      await supabase.functions.invoke('ultra-fast-search', {
        body: { 
          warmup: true,
          preload: true,
          query: '',
          category: '',
          limit: 50
        }
      })
      console.log('✅ Search cache warmed')
    } catch (error) {
      console.warn('⚠️ Search warmup failed:', error.message)
    }

    // Update warmup log
    await supabase
      .from('warmup_log')
      .insert({
        type: 'auto_shopify_warmup',
        products_count: productCount,
        collections_count: collectionCount,
        sync_triggered: syncTriggered,
        status: 'completed'
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto Shopify warmup completed',
        timestamp: new Date().toISOString(),
        stats: {
          products_count: productCount,
          collections_count: collectionCount,
          sync_triggered: syncTriggered,
          critical_collections: collectionStatus
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Auto warmup error:', error)
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      await supabase
        .from('warmup_log')
        .insert({
          type: 'auto_shopify_warmup',
          status: 'error',
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Handle shutdown gracefully
addEventListener('beforeunload', (ev) => {
  console.log('Auto warmup function shutdown:', ev.detail?.reason)
})