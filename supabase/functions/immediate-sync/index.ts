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
    console.log('🚨 IMMEDIATE SYNC - Starting...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Shopify credentials
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN') || 'premier-concierge.myshopify.com'
    const shopifyToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    console.log('🔑 Shopify domain:', shopifyDomain)
    console.log('🔑 Shopify token exists:', !!shopifyToken)

    if (!shopifyToken) {
      console.log('❌ Missing Shopify access token, trying to use fallback sync...')
      
      // Try to call the fetch-shopify-products function instead
      try {
        const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('fetch-shopify-products')
        
        if (fetchError) {
          console.error('❌ Fetch products failed:', fetchError)
          throw fetchError
        }
        
        if (fetchResult?.products && fetchResult.products.length > 0) {
          console.log(`✅ Got ${fetchResult.products.length} products from fetch-shopify-products`)
          
          // Clear and insert products
          console.log('🧹 Clearing existing product cache...')
          await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          
          // Insert products in batches
          console.log('💾 Inserting products into cache...')
          const batchSize = 100
          let insertedCount = 0
          
          for (let i = 0; i < fetchResult.products.length; i += batchSize) {
            const batch = fetchResult.products.slice(i, i + batchSize)
            
            const { error } = await supabase
              .from('shopify_products_cache')
              .insert(batch.map(product => ({
                id: product.id,
                title: product.title,
                handle: product.handle,
                vendor: product.vendor,
                product_type: product.productType || product.product_type,
                data: product
              })))
            
            if (error) {
              console.error(`❌ Batch insert error:`, error)
            } else {
              insertedCount += batch.length
              console.log(`✅ Inserted batch: ${insertedCount}/${fetchResult.products.length}`)
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              products_synced: insertedCount,
              products_count: fetchResult.products.length,
              message: `Successfully synced ${insertedCount} products via fallback` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (fallbackError) {
        console.error('❌ Fallback sync also failed:', fallbackError)
      }
      
      throw new Error('Missing Shopify access token and fallback failed')
    }

    console.log('🔄 Fetching products directly from Shopify...')

    // Fetch products directly from Shopify GraphQL API
    const query = `
      query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              handle
              description
              productType
              vendor
              tags
              images(first: 5) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    availableForSale
                  }
                }
              }
              collections(first: 10) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

    let allProducts = []
    let hasNextPage = true
    let cursor = null
    let pageCount = 0

    while (hasNextPage && pageCount < 10) {
      pageCount++
      console.log(`📄 Fetching page ${pageCount}...`)

      const response = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken,
        },
        body: JSON.stringify({
          query,
          variables: {
            first: 250,
            after: cursor
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      const products = data.data.products.edges.map(edge => {
        const product = edge.node
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description || '',
          price: product.variants.edges[0]?.node.price || '0',
          image: product.images.edges[0]?.node.url || '',
          images: product.images.edges.map(img => img.node.url),
          vendor: product.vendor,
          category: product.productType || 'Uncategorized',
          productType: product.productType || '',
          tags: product.tags,
          collections: product.collections.edges.map(col => ({
            id: col.node.id,
            title: col.node.title,
            handle: col.node.handle
          })),
          variants: product.variants.edges.map(variant => ({
            id: variant.node.id,
            title: variant.node.title,
            price: parseFloat(variant.node.price),
            available: variant.node.availableForSale
          })),
          data: product
        }
      })

      allProducts = allProducts.concat(products)
      hasNextPage = data.data.products.pageInfo.hasNextPage
      cursor = data.data.products.pageInfo.endCursor

      console.log(`✅ Page ${pageCount}: ${products.length} products, total: ${allProducts.length}`)
    }

    console.log(`🎯 Total products fetched: ${allProducts.length}`)

    // Clear existing cache
    console.log('🧹 Clearing existing product cache...')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert products in batches
    console.log('💾 Inserting products into cache...')
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('shopify_products_cache')
        .insert(batch.map(product => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          product_type: product.productType,
          data: product
        })))

      if (error) {
        console.error(`❌ Batch insert error:`, error)
      } else {
        insertedCount += batch.length
        console.log(`✅ Inserted batch: ${insertedCount}/${allProducts.length}`)
      }
    }

    // Clear other caches to force refresh
    await supabase.from('cache').delete().like('key', '%products%')
    await supabase.from('cache').delete().like('key', '%collection%')
    
    console.log('🎉 IMMEDIATE SYNC COMPLETE!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_synced: insertedCount,
        products_count: allProducts.length,
        message: `Successfully synced ${insertedCount} products` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Immediate sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Immediate sync failed - check logs for details'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})