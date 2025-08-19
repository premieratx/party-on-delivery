import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Unified Collection Manager - Fast, reliable collection and product loading
 * Handles both real-time collection filtering and background sync
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

    const { 
      action = 'get_products',
      delivery_app_id,
      tab_index,
      collection_handle,
      force_refresh = false,
      lightweight = true 
    } = await req.json().catch(() => ({}))

    console.log(`🎯 Unified Collection Manager - Action: ${action}, Collection: ${collection_handle}, Tab: ${tab_index}`)

    if (action === 'get_products') {
      // Fast product retrieval for specific collection
      let targetCollectionHandle = collection_handle

      // If no direct collection handle, look up from delivery app mappings
      if (!targetCollectionHandle && delivery_app_id && tab_index !== undefined) {
        console.log(`🔍 Looking up collection for delivery_app_id: ${delivery_app_id}, tab: ${tab_index}`)
        
        const { data: mapping, error: mappingError } = await supabase
          .from('delivery_app_collection_mappings')
          .select('shopify_collection_handle')
          .eq('delivery_app_id', delivery_app_id)
          .eq('tab_index', tab_index)
          .single()

        if (!mappingError && mapping) {
          targetCollectionHandle = mapping.shopify_collection_handle
          console.log(`📋 Found mapped collection: ${targetCollectionHandle}`)
        }
      }

      if (!targetCollectionHandle) {
        throw new Error('No collection handle specified or found in mappings')
      }

      // Query products for specific collection with optimized filtering
      console.log(`🎯 Querying products for collection: ${targetCollectionHandle}`)
      
      const { data: products, error: productsError } = await supabase
        .from('shopify_products_cache')
        .select(lightweight ? 
          'id, title, price, image, category, category_title, vendor, handle, product_type, search_category, collection_handles' : 
          '*'
        )
        .or(`collection_handles.cs.{${targetCollectionHandle}},collection_handles.cs."${targetCollectionHandle}",collection_handles.cs.'${targetCollectionHandle}'`)
        .order('updated_at', { ascending: false })

      if (productsError) {
        console.error('Error querying products:', productsError)
        throw productsError
      }

      console.log(`✅ Found ${products?.length || 0} products for collection: ${targetCollectionHandle}`)

      const result = {
        success: true,
        products: products || [],
        collection_handle: targetCollectionHandle,
        total_products: products?.length || 0,
        cached: true,
        lightweight
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync_collections') {
      // Background sync of Shopify collections
      console.log('🔄 Starting collection sync...')
      
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: force_refresh }
      })

      if (syncError) {
        console.error('Sync error:', syncError)
        throw syncError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Collection sync completed',
          sync_result: syncResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('❌ Error in unified-collection-manager:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products: [],
        total_products: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})