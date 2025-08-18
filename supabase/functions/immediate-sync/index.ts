import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * IMMEDIATE SYNC - No auth required, directly populates cache
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🚀 IMMEDIATE SYNC - Starting direct population...')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Check current product count
    const { count: currentCount } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current products in cache: ${currentCount || 0}`)

    if ((currentCount || 0) > 100) {
      console.log('✅ Cache already populated, returning success')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cache already populated',
          products_count: currentCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Clear cache and fetch fresh data
    console.log('🗑️ Clearing cache...')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('🔄 Fetching from Shopify...')
    const products = await fetchFromShopify()

    if (products.length === 0) {
      throw new Error('No products returned from Shopify')
    }

    console.log(`📦 Processing ${products.length} products...`)
    await insertProducts(supabase, products)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Immediate sync complete',
        products_synced: products.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Immediate sync failed:', error)
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

async function fetchFromShopify() {
  const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL')?.replace(/https?:\/\//, '') || ''
  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
    throw new Error('Missing Shopify credentials')
  }

  const query = `
    query {
      products(first: 250, query: "status:active") {
        edges {
          node {
            id
            title
            handle
            description
            productType
            vendor
            tags
            featuredImage {
              url
            }
            collections(first: 10) {
              edges {
                node {
                  handle
                  title
                }
              }
            }
            variants(first: 5) {
              edges {
                node {
                  id
                  price
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
  }

  return data.data?.products?.edges?.map(({ node }) => node) || []
}

async function insertProducts(supabase: any, products: any[]) {
  const batchSize = 20
  let totalInserted = 0
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    const cacheItems = batch.map(product => {
      const price = parseFloat(product.variants?.edges?.[0]?.node?.price || '0')
      const collectionHandles = product.collections?.edges?.map(edge => edge.node.handle) || []
      
      // Simple category mapping
      let category = 'other'
      let searchCategory = 'other'
      
      const productType = (product.productType || '').toLowerCase()
      const hasCollections = collectionHandles.join(' ').toLowerCase()
      
      if (productType.includes('beer') || hasCollections.includes('beer')) {
        category = 'beer'
        searchCategory = 'beer'
      } else if (productType.includes('wine') || hasCollections.includes('wine')) {
        category = 'wine'
        searchCategory = 'wine'
      } else if (productType.includes('spirit') || productType.includes('whiskey') || productType.includes('vodka') || hasCollections.includes('spirit')) {
        category = 'spirits'
        searchCategory = 'spirits'
      } else if (productType.includes('cocktail') || hasCollections.includes('cocktail')) {
        category = 'cocktails'
        searchCategory = 'cocktails'
      } else if (productType.includes('mixer') || hasCollections.includes('mixer')) {
        category = 'mixers'
        searchCategory = 'mixers'
      }

      return {
        shopify_id: product.id,
        title: product.title,
        handle: product.handle,
        price: price,
        image: product.featuredImage?.url || '/placeholder.svg',
        category: category,
        category_title: category.charAt(0).toUpperCase() + category.slice(1),
        vendor: product.vendor || '',
        description: product.description || '',
        product_type: product.productType || '',
        search_category: searchCategory,
        tags: product.tags || [],
        variants: product.variants?.edges?.map(edge => edge.node) || [],
        collection_handles: collectionHandles,
        data: product,
        updated_at: new Date().toISOString()
      }
    })

    const { error } = await supabase
      .from('shopify_products_cache')
      .insert(cacheItems)

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error)
    } else {
      totalInserted += cacheItems.length
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${cacheItems.length} products`)
    }
  }

  console.log(`💾 Total inserted: ${totalInserted} products`)
}