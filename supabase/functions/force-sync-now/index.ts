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
    console.log('🔥 FORCE SYNC NOW - Starting immediate product sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear all existing cache immediately
    console.log('🧹 Clearing ALL existing caches...')
    await supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Get Shopify credentials
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN') || 'premier-concierge.myshopify.com'
    const shopifyToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    console.log('🔑 Shopify domain:', shopifyDomain)
    console.log('🔑 Shopify token exists:', !!shopifyToken)

    let allProducts = []

    if (shopifyToken) {
      // Direct Shopify API call with collection order preservation
      console.log('🚀 Fetching directly from Shopify API...')
      
      const query = `
        query GetProducts($first: Int!, $after: String) {
          products(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
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

      let hasNextPage = true
      let cursor = null
      let pageCount = 0

      while (hasNextPage && pageCount < 15) {
        pageCount++
        console.log(`📄 Fetching Shopify page ${pageCount}...`)

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

        const products = data.data.products.edges.map((edge, index) => {
          const product = edge.node
          return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description || '',
            price: parseFloat(product.variants.edges[0]?.node.price || '0'),
            image: product.images.edges[0]?.node.url || '',
            images: product.images.edges.map(img => img.node.url),
            vendor: product.vendor,
            category: product.productType || 'Uncategorized',
            product_type: product.productType || '',
            tags: product.tags,
            collection_handles: product.collections.edges.map(col => col.node.handle),
            variants: product.variants.edges.map(variant => ({
              id: variant.node.id,
              title: variant.node.title,
              price: parseFloat(variant.node.price),
              available: variant.node.availableForSale
            })),
            sort_order: (pageCount - 1) * 250 + index, // Preserve exact Shopify order
            data: product
          }
        })

        allProducts = allProducts.concat(products)
        hasNextPage = data.data.products.pageInfo.hasNextPage
        cursor = data.data.products.pageInfo.endCursor

        console.log(`✅ Page ${pageCount}: ${products.length} products, total: ${allProducts.length}`)
      }
    } else {
      // Fallback: try calling fetch-shopify-products
      console.log('⚠️ No Shopify token, trying fetch-shopify-products fallback...')
      
      const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('fetch-shopify-products')
      
      if (fetchError) {
        console.error('❌ Fetch products failed:', fetchError)
        throw fetchError
      }
      
      if (fetchResult?.products) {
        allProducts = fetchResult.products.map((product, index) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description || '',
          price: parseFloat(product.price || '0'),
          image: product.image || '',
          images: product.images || [],
          vendor: product.vendor || '',
          category: product.category || 'Uncategorized',
          product_type: product.productType || product.product_type || '',
          tags: product.tags || [],
          collection_handles: product.collections?.map(c => c.handle) || [],
          variants: product.variants || [],
          sort_order: index, // Preserve order
          data: product
        }))
        console.log(`📦 Got ${allProducts.length} products from fallback`)
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found from either Shopify API or fallback')
    }

    console.log(`🎯 Total products to insert: ${allProducts.length}`)

    // Insert products in batches with proper ordering
    console.log('💾 Inserting products with preserved order...')
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
          product_type: product.product_type,
          price: product.price,
          image: product.image,
          category: product.category,
          collection_handles: product.collection_handles,
          variants: product.variants,
          description: product.description,
          sort_order: product.sort_order,
          data: product
        })))

      if (error) {
        console.error(`❌ Batch insert error:`, error)
        throw error
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch: ${insertedCount}/${allProducts.length}`)
    }

    // Verify the insert worked
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('shopify_products_cache')
      .select('count(*)')
      .single()

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else {
      console.log(`🔍 Verification: ${verifyProducts?.count || 0} products in cache`)
    }

    console.log('🎉 FORCE SYNC COMPLETE!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_synced: insertedCount,
        products_count: allProducts.length,
        message: `Successfully force-synced ${insertedCount} products in correct order`,
        verified_count: verifyProducts?.count || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Force sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Force sync failed - check logs for details'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})