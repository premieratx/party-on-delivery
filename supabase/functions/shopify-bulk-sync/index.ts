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
        
        // Use Shopify's GraphQL API for bulk operations (faster than REST)
        const mutation = type === 'add' ? `
          mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) {
              collection {
                id
                handle
              }
              userErrors {
                field
                message
              }
            }
          }
        ` : `
          mutation collectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
            collectionRemoveProducts(id: $id, productIds: $productIds) {
              job {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `

        const shopifyResponse = await fetch(
          `${Deno.env.get('SHOPIFY_STORE_URL')}/admin/api/2024-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN') ?? '',
            },
            body: JSON.stringify({
              query: mutation,
              variables: {
                id: `gid://shopify/Collection/${collection_handle}`,
                productIds: product_ids.map(id => `gid://shopify/Product/${id}`)
              }
            })
          }
        )

        if (!shopifyResponse.ok) {
          throw new Error(`Shopify API error: ${shopifyResponse.status}`)
        }

        const result = await shopifyResponse.json()
        console.log(`✅ ${type} operation completed for ${collection_handle}`)
        
        return { collection_handle, type, success: true, result }
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