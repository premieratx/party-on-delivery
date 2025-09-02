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
    console.log('🍺 Fetching Tailgate Beer collection with exact Shopify ordering...')
    
    const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL')?.replace(/https?:\/\//, '') || ''
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

    if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
      throw new Error('Missing Shopify credentials')
    }

    // First, get the collection ID for tailgate-beer
    const collectionQuery = `
      query getCollection($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          title
          handle
          description
          products(first: 50, sortKey: COLLECTION_DEFAULT) {
            edges {
              node {
                id
                title
                handle
                productType
                vendor
                tags
                variants(first: 1) {
                  edges {
                    node {
                      price
                      availableForSale
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    console.log('📡 Querying Shopify for tailgate-beer collection...')
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ 
        query: collectionQuery, 
        variables: { handle: 'tailgate-beer' }
      }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    const collection = data.data?.collectionByHandle
    if (!collection) {
      throw new Error('Tailgate Beer collection not found')
    }

    const products = collection.products.edges.map(({ node }: any, index: number) => ({
      position: index + 1,
      id: node.id,
      title: node.title,
      handle: node.handle,
      productType: node.productType,
      vendor: node.vendor,
      price: node.variants.edges[0]?.node.price || '0.00',
      availableForSale: node.variants.edges[0]?.node.availableForSale || false
    }))

    console.log(`✅ Found ${products.length} products in Tailgate Beer collection`)
    console.log('📋 Product order:')
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`)
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        collection: {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          totalProducts: products.length
        },
        products: products
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Error fetching Tailgate Beer collection:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})