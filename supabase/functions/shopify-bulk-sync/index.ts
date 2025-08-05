import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkSyncRequest {
  operations: Array<{
    type: 'add' | 'remove'
    collection_handle: string
    product_ids: string[]
  }>
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

    const { operations }: BulkSyncRequest = await req.json()
    console.log(`🚀 Processing ${operations.length} bulk operations`)

    // Process operations in parallel for speed
    const results = await Promise.allSettled(
      operations.map(async (op) => {
        const { type, collection_handle, product_ids } = op
        
        // First, get the collection ID from handle
        const collectionQuery = await fetch(
          `${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2024-01/collections.json?handle=${collection_handle}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN') ?? '',
            }
          }
        )

        if (!collectionQuery.ok) {
          throw new Error(`Failed to find collection: ${collectionQuery.status}`)
        }

        const collectionData = await collectionQuery.json()
        if (!collectionData.collections?.length) {
          throw new Error(`Collection not found: ${collection_handle}`)
        }

        const collectionId = collectionData.collections[0].id

        // Use REST API for immediate updates - faster and more reliable
        if (type === 'add') {
          // Add products to collection
          const addPromises = product_ids.map(productId => 
            fetch(
              `${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2024-01/collects.json`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN') ?? '',
                },
                body: JSON.stringify({
                  collect: {
                    collection_id: collectionId,
                    product_id: productId
                  }
                })
              }
            )
          )
          
          const results = await Promise.allSettled(addPromises)
          const successful = results.filter(r => r.status === 'fulfilled').length
          console.log(`✅ Added ${successful}/${product_ids.length} products to ${collection_handle}`)
          
        } else {
          // Remove products from collection
          // First get existing collects
          const collectsResponse = await fetch(
            `${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2024-01/collects.json?collection_id=${collectionId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN') ?? '',
              }
            }
          )

          if (collectsResponse.ok) {
            const collectsData = await collectsResponse.json()
            const collectsToDelete = collectsData.collects.filter((collect: any) => 
              product_ids.includes(collect.product_id.toString())
            )

            const deletePromises = collectsToDelete.map((collect: any) => 
              fetch(
                `${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2024-01/collects/${collect.id}.json`,
                {
                  method: 'DELETE',
                  headers: {
                    'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN') ?? '',
                  }
                }
              )
            )

            const results = await Promise.allSettled(deletePromises)
            const successful = results.filter(r => r.status === 'fulfilled').length
            console.log(`✅ Removed ${successful}/${collectsToDelete.length} products from ${collection_handle}`)
          }
        }

        console.log(`✅ ${type} operation completed for ${collection_handle}`)
        
        return { collection_handle, type, success: true }
      })
    )

    // Update database with results
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Clear cache for updated collections
    const collection_handles = operations.map(op => op.collection_handle)
    await supabase
      .from('cache')
      .delete()
      .in('key', collection_handles.map(h => `shopify_collection_${h}`))

    console.log(`📊 Bulk sync completed: ${successful} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: operations.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Bulk sync error:', error)
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