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

    // Start background task to sync products
    const syncTask = async () => {
      try {
        console.log('📦 Fetching fresh products from Shopify...')
        
        // Invoke the fetch function to get latest products
        const { data: shopifyData, error: shopifyError } = await supabase.functions.invoke('fetch-shopify-products', {
          body: { forceRefresh: true }
        })

        if (shopifyError) {
          console.error('Error fetching from Shopify:', shopifyError)
          return
        }

        const products = shopifyData?.products || []
        console.log(`✅ Fetched ${products.length} products from Shopify`)

        if (products.length === 0) {
          console.warn('No products to sync')
          return
        }

        // Clear existing cache
        console.log('🗑️ Clearing existing product cache...')
        await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // Batch insert products
        const batchSize = 100
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize)
          
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

          const { error: insertError } = await supabase
            .from('shopify_products_cache')
            .insert(cacheItems)

          if (insertError) {
            console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
          } else {
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
          await supabase
            .from('category_mappings_simple')
            .upsert(mapping)
        }

        console.log('🎉 Bulk sync completed successfully!')
        
      } catch (error) {
        console.error('❌ Error in background sync task:', error)
      }
    }

    // Use background task for long-running sync
    EdgeRuntime.waitUntil(syncTask())

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product sync started in background',
        status: 'processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in shopify-bulk-sync:', error)
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