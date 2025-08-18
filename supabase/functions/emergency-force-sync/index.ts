import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * EMERGENCY FORCE SYNC - Bypasses all caches and forces fresh data from Shopify
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚨 EMERGENCY FORCE SYNC - Starting immediate Shopify sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Clear ALL existing caches immediately
    console.log('🗑️ Clearing all caches...')
    await Promise.all([
      supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('shopify_collections_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('cache').delete().like('key', '%shopify%'),
      supabase.from('cache').delete().like('key', '%product%'),
      supabase.from('cache').delete().like('key', '%collection%')
    ])
    console.log('✅ All caches cleared')

    // Step 2: Force fresh fetch from Shopify API
    const products = await fetchAllProductsFromShopify()
    console.log(`📦 Fetched ${products.length} products directly from Shopify`)

    if (products.length === 0) {
      throw new Error('❌ NO PRODUCTS RETURNED FROM SHOPIFY - Check API credentials!')
    }

    // Step 3: Process and cache products immediately
    await processAndCacheProducts(supabase, products)

    console.log(`✅ EMERGENCY SYNC COMPLETE: ${products.length} products synced`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'EMERGENCY SYNC COMPLETE',
        products_synced: products.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ EMERGENCY SYNC FAILED:', error)
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

async function fetchAllProductsFromShopify() {
  const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL')?.replace(/https?:\/\//, '') || ''
  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

  console.log(`🔗 Shopify Store: ${SHOPIFY_STORE}`)
  console.log(`🔑 Token available: ${!!SHOPIFY_ACCESS_TOKEN}`)

  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
    throw new Error('❌ Missing Shopify credentials - check SHOPIFY_STORE_URL and SHOPIFY_ADMIN_API_ACCESS_TOKEN')
  }

  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, query: "status:active") {
        pageInfo {
          hasNextPage
          endCursor
        }
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
              altText
            }
            collections(first: 20) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `

  let allProducts = []
  let hasNextPage = true
  let cursor = null
  let pageCount = 0
  const maxPages = 50 // Increased limit

  while (hasNextPage && pageCount < maxPages) {
    const variables = { first: 50, ...(cursor && { after: cursor }) }
    
    console.log(`📄 Fetching page ${pageCount + 1}...`)
    
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      console.error(`❌ Shopify API error: ${response.status} ${response.statusText}`)
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    const products = data.data?.products?.edges?.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description || '',
      productType: node.productType || '',
      vendor: node.vendor || '',
      tags: node.tags || [],
      featuredImage: node.featuredImage,
      images: node.images.edges.map(({ node: img }) => ({
        url: img.url,
        altText: img.altText
      })),
      variants: node.variants.edges.map(({ node: variant }) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        availableForSale: variant.availableForSale
      })),
      collections: node.collections.edges.map(({ node: col }) => ({
        id: col.id,
        title: col.title,
        handle: col.handle,
        description: col.description
      }))
    })) || []

    allProducts = allProducts.concat(products)
    
    hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false
    cursor = data.data?.products?.pageInfo?.endCursor
    pageCount++
    
    console.log(`✅ Page ${pageCount}: ${products.length} products (total: ${allProducts.length})`)
  }

  return allProducts
}

async function processAndCacheProducts(supabase, products) {
  console.log('💾 Processing and caching products...')
  
  const batchSize = 25
  let totalInserted = 0
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    const cacheItems = batch.map(product => {
      const primaryPrice = parseFloat(product.variants[0]?.price || '0')
      const collectionHandles = product.collections.map(c => c.handle.toLowerCase())
      
      // Determine category based on collections
      let category = 'other'
      let categoryTitle = 'Other'
      
      if (collectionHandles.some(h => h.includes('beer'))) {
        category = 'beer'
        categoryTitle = 'Beer'
      } else if (collectionHandles.some(h => h.includes('wine') || h.includes('champagne'))) {
        category = 'wine'
        categoryTitle = 'Wine & Champagne'
      } else if (collectionHandles.some(h => h.includes('spirit') || h.includes('whiskey') || h.includes('vodka') || h.includes('tequila') || h.includes('rum') || h.includes('gin'))) {
        category = 'spirits'
        categoryTitle = 'Spirits'
      } else if (collectionHandles.some(h => h.includes('cocktail'))) {
        category = 'cocktails'
        categoryTitle = 'Cocktails'
      } else if (collectionHandles.some(h => h.includes('mixer') || h.includes('soda') || h.includes('juice'))) {
        category = 'mixers'
        categoryTitle = 'Mixers & N/A'
      } else if (collectionHandles.some(h => h.includes('party') || h.includes('supply'))) {
        category = 'party-supplies'
        categoryTitle = 'Party Supplies'
      }

      // Normalize product type for search
      let searchCategory = 'other'
      const productType = product.productType.toLowerCase()
      if (productType.includes('beer')) searchCategory = 'beer'
      else if (productType.includes('wine')) searchCategory = 'wine'
      else if (productType.includes('spirit') || productType.includes('whiskey') || productType.includes('vodka') || productType.includes('tequila') || productType.includes('rum') || productType.includes('gin')) searchCategory = 'spirits'
      else if (productType.includes('cocktail')) searchCategory = 'cocktails'
      else if (productType.includes('mixer') || productType.includes('soda') || productType.includes('juice')) searchCategory = 'mixers'
      else if (productType.includes('party') || productType.includes('supply')) searchCategory = 'party-supplies'

      return {
        shopify_id: product.id,
        title: product.title,
        handle: product.handle,
        price: primaryPrice,
        image: product.featuredImage?.url || product.images[0]?.url || '/placeholder.svg',
        category: category,
        category_title: categoryTitle,
        vendor: product.vendor,
        description: product.description,
        product_type: product.productType,
        search_category: searchCategory,
        tags: product.tags,
        variants: product.variants,
        collection_handles: collectionHandles,
        data: product,
        updated_at: new Date().toISOString()
      }
    })

    const { error: insertError } = await supabase
      .from('shopify_products_cache')
      .insert(cacheItems)

    if (insertError) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
    } else {
      totalInserted += cacheItems.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${cacheItems.length} products (total: ${totalInserted})`)
    }
  }

  console.log(`💾 Caching complete: ${totalInserted} products inserted`)
}