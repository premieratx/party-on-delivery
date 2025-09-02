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
    console.log('🔥 FORCING IMMEDIATE PRODUCT SYNC NOW...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // STEP 1: Clear everything
    console.log('🧹 Clearing ALL caches...')
    await Promise.all([
      supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ])

    // STEP 2: Get Shopify credentials and call API directly
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN') || 'premier-concierge.myshopify.com'
    const shopifyToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    console.log(`🔑 Shopify setup - Domain: ${shopifyDomain}, Token exists: ${!!shopifyToken}`)

    let allProducts = []

    // STEP 3: Try multiple approaches to get products
    if (shopifyToken) {
      console.log('🚀 Method 1: Direct Shopify GraphQL API...')
      
      try {
        const graphQLQuery = `
          query GetAllProducts($first: Int!, $after: String) {
            products(first: $first, after: $after, sortKey: CREATED_AT) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  productType
                  vendor
                  tags
                  createdAt
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

        let hasNextPage = true
        let cursor = null
        let pageCount = 0

        while (hasNextPage && pageCount < 20) {
          pageCount++
          console.log(`📄 Fetching page ${pageCount} from Shopify...`)

          const response = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken,
            },
            body: JSON.stringify({
              query: graphQLQuery,
              variables: { first: 250, after: cursor }
            })
          })

          if (!response.ok) {
            throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          
          if (data.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
          }

          const products = data.data.products.edges.map((edge, index) => {
            const product = edge.node
            return {
              id: product.id,
              title: product.title,
              handle: product.handle,
              description: product.description || '',
              price: parseFloat(product.variants.edges[0]?.node.price || '0'),
              image: product.images.edges[0]?.node.url || '',
              vendor: product.vendor || '',
              category: product.productType || 'Uncategorized',
              product_type: product.productType || '',
              tags: product.tags || [],
              collection_handles: product.collections.edges.map(col => col.node.handle),
              variants: product.variants.edges.map(v => v.node),
              sort_order: (pageCount - 1) * 250 + index,
              data: product,
              created_at: product.createdAt
            }
          })

          allProducts = allProducts.concat(products)
          hasNextPage = data.data.products.pageInfo.hasNextPage
          cursor = data.data.products.pageInfo.endCursor

          console.log(`✅ Page ${pageCount}: ${products.length} products, total: ${allProducts.length}`)
        }

        console.log(`🎯 Direct API: Got ${allProducts.length} products`)
      } catch (apiError) {
        console.error('❌ Direct API failed:', apiError)
        allProducts = []
      }
    }

    // STEP 4: Fallback to existing function if direct API failed
    if (allProducts.length === 0) {
      console.log('🔄 Method 2: Fallback to fetch-shopify-products...')
      
      try {
        const { data: products, error } = await supabase.functions.invoke('fetch-shopify-products')
        
        if (error) {
          console.error('❌ Fallback failed:', error)
          throw error
        }
        
        if (products?.products && products.products.length > 0) {
          allProducts = products.products.map((product, index) => ({
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description || '',
            price: parseFloat(product.price || '0'),
            image: product.image || '',
            vendor: product.vendor || '',
            category: product.category || product.productType || 'Uncategorized',
            product_type: product.productType || product.product_type || '',
            tags: product.tags || [],
            collection_handles: Array.isArray(product.collections) ? product.collections.map(c => c.handle) : [],
            variants: product.variants || [],
            sort_order: index,
            data: product
          }))
          console.log(`🔄 Fallback: Got ${allProducts.length} products`)
        }
      } catch (fallbackError) {
        console.error('❌ Both methods failed:', fallbackError)
        throw new Error('All sync methods failed')
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found from any source')
    }

    // STEP 5: Insert all products with proper ordering
    console.log(`💾 Inserting ${allProducts.length} products...`)
    const batchSize = 50
    let insertedCount = 0

    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize)
      
      const insertData = batch.map(product => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        product_type: product.productType || product.product_type,
        price: parseFloat(product.price) || 0,
        image: product.image,
        category: product.category,
        collection_handles: product.collections?.map(c => c.handle) || [],
        variants: product.variants || [],
        description: product.description,
        sort_order: 0,
        data: product
      }))
      
      const { error: insertError } = await supabase
        .from('shopify_products_cache')
        .insert(insertData)
      
      if (insertError) {
        console.error(`❌ Insert error:`, insertError)
        throw insertError
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch: ${insertedCount}/${allProducts.length}`)
    }

    // STEP 6: Verify the insertion worked
    const { data: verification, error: verifyError } = await supabase
      .from('shopify_products_cache')
      .select('count(*)')
      .single()

    const verifiedCount = verification?.count || 0
    
    console.log(`🎉 SYNC COMPLETE!`)
    console.log(`   - Products fetched: ${allProducts.length}`)
    console.log(`   - Products inserted: ${insertedCount}`) 
    console.log(`   - Database count: ${verifiedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        products_fetched: allProducts.length,
        products_inserted: insertedCount,
        verified_count: verifiedCount,
        message: `Successfully synced ${verifiedCount} products in correct order`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Sync failed:', error)
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