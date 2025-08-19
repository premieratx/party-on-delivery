import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge function to update product ordering based on Shopify collection order
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

    const { collection_handle } = await req.json().catch(() => ({}))
    
    console.log(`📋 Updating Shopify collection order for: ${collection_handle}`)

    // Fetch collection from Shopify to get correct product order
    const shopifyUrl = Deno.env.get('SHOPIFY_STORE_URL')
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')
    
    if (!shopifyUrl || !shopifyToken) {
      throw new Error('Missing Shopify configuration')
    }

    // Use GraphQL to find collection by handle
    const graphqlQuery = {
      query: `
        query getCollectionByHandle($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            handle
            title
            products(first: 250, sortKey: COLLECTION_DEFAULT) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      `,
      variables: {
        handle: collection_handle
      }
    };

    const collectionsResponse = await fetch(
      `https://${shopifyUrl}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      }
    )

    if (!collectionsResponse.ok) {
      throw new Error(`Failed to fetch collections from Shopify: ${collectionsResponse.statusText}`)
    }

    const collectionsData = await collectionsResponse.json()
    const collection = collectionsData.data?.collectionByHandle
    
    if (!collection) {
      console.log(`❌ Collection not found in Shopify: ${collection_handle}`)
      return new Response(
        JSON.stringify({ success: false, error: 'Collection not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract products from GraphQL response
    const orderedProducts = collection.products.edges.map((edge: any, index: number) => ({
      id: edge.node.id.replace('gid://shopify/Product/', ''),
      title: edge.node.title,
      position: index + 1
    }))
    
    console.log(`📋 Found ${orderedProducts.length} products in Shopify collection ${collection_handle}`)

    // Update our cached products to include sort_order based on Shopify position
    for (let i = 0; i < orderedProducts.length; i++) {
      const shopifyProduct = orderedProducts[i]
      const sortOrder = i + 1 // 1-based ordering
      
      // Update product in our cache with correct sort order
      const { error: updateError } = await supabase
        .from('shopify_products_cache')
        .update({ 
          sort_order: sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('shopify_id', shopifyProduct.id.toString())
      
      if (updateError) {
        console.error(`❌ Failed to update sort order for product ${shopifyProduct.id}:`, updateError)
      } else {
        console.log(`✅ Updated sort order for "${shopifyProduct.title}": ${sortOrder}`)
      }
    }

    console.log(`✅ Successfully updated Shopify collection order for ${collection_handle}`)

    return new Response(
      JSON.stringify({
        success: true,
        collection_handle,
        products_updated: orderedProducts.length,
        message: `Updated sort order for ${orderedProducts.length} products`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error updating collection order:', error)
    
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