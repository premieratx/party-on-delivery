import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  vendor: string
  product_type: string
  tags: string
  variants: any[]
  images: any[]
  collections: any[]
  price: number
  compare_at_price?: number
  available: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting bulk product sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Shopify credentials
    const shopifyUrl = Deno.env.get('SHOPIFY_STORE_URL')
    const accessToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

    if (!shopifyUrl || !accessToken) {
      throw new Error('Missing Shopify credentials')
    }

    console.log('📡 Fetching ALL products from Shopify...')

    // Fetch all products in one GraphQL call
    const query = `
      query getAllProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
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
              vendor
              productType
              tags
              availableForSale
              collections(first: 10) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `

    let allProducts: ShopifyProduct[] = []
    let hasNextPage = true
    let cursor = null
    let pageCount = 0

    while (hasNextPage && pageCount < 10) { // Limit to prevent infinite loops
      pageCount++
      console.log(`📄 Fetching page ${pageCount}...`)

      const variables = {
        first: 250, // Maximum allowed by Shopify
        after: cursor
      }

      const response = await fetch(`https://${shopifyUrl}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
      }

      const products = result.data?.products
      if (!products) {
        break
      }

      // Transform products
      const transformedProducts = products.edges.map((edge: any) => {
        const node = edge.node
        const variants = node.variants.edges.map((v: any) => v.node)
        const images = node.images.edges.map((img: any) => img.node)
        const collections = node.collections.edges.map((c: any) => c.node)
        
        // Get price from first variant
        const price = variants.length > 0 ? parseFloat(variants[0].price) : 0
        
        return {
          id: node.id.replace('gid://shopify/Product/', ''),
          title: node.title,
          handle: node.handle,
          description: node.description || '',
          vendor: node.vendor || '',
          product_type: node.productType || '',
          tags: node.tags || [],
          variants,
          images,
          collections,
          price,
          compare_at_price: variants[0]?.compareAtPrice ? parseFloat(variants[0].compareAtPrice) : null,
          available: node.availableForSale
        }
      })

      allProducts.push(...transformedProducts)
      hasNextPage = products.pageInfo.hasNextPage
      cursor = products.pageInfo.endCursor

      console.log(`✅ Page ${pageCount}: ${transformedProducts.length} products (Total: ${allProducts.length})`)
    }

    console.log(`🎉 Fetched ${allProducts.length} total products from Shopify`)

    // Clear existing cache
    console.log('🗑️ Clearing existing product cache...')
    await supabase
      .from('shopify_products_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert products in batches
    const batchSize = 100
    let successCount = 0

    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize)
      
      const cacheItems = batch.map(product => {
        // Determine category from collections and product type
        const collectionHandles = product.collections.map(c => c.handle.toLowerCase())
        let category = 'other'
        
        if (collectionHandles.some(h => h.includes('beer') || h.includes('lager'))) category = 'beer'
        else if (collectionHandles.some(h => h.includes('wine') || h.includes('champagne'))) category = 'wine'
        else if (collectionHandles.some(h => h.includes('spirit') || h.includes('whiskey') || h.includes('vodka') || h.includes('gin') || h.includes('rum') || h.includes('tequila'))) category = 'spirits'
        else if (collectionHandles.some(h => h.includes('mixer') || h.includes('soda') || h.includes('juice'))) category = 'mixers'
        else if (collectionHandles.some(h => h.includes('seltzer') || h.includes('hard seltzer'))) category = 'seltzer'
        else if (collectionHandles.some(h => h.includes('cocktail'))) category = 'cocktails'
        else if (collectionHandles.some(h => h.includes('snack') || h.includes('food'))) category = 'snacks'

        return {
          shopify_id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description,
          vendor: product.vendor,
          product_type: product.product_type,
          price: product.price,
          compare_at_price: product.compare_at_price,
          available: product.available,
          image: product.images[0]?.url || null,
          variants: product.variants,
          collection_handles: collectionHandles,
          tags: Array.isArray(product.tags) ? product.tags : product.tags.split(',').map((t: string) => t.trim()),
          category,
          data: product,
          updated_at: new Date().toISOString()
        }
      })

      try {
        const { error } = await supabase
          .from('shopify_products_cache')
          .insert(cacheItems)

        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        } else {
          successCount += batch.length
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products cached (${successCount}/${allProducts.length})`)
        }
      } catch (batchError) {
        console.error(`❌ Batch error:`, batchError)
      }
    }

    // Update collections cache
    console.log('📚 Caching collections...')
    const uniqueCollections = new Map()
    
    allProducts.forEach(product => {
      product.collections.forEach(collection => {
        if (!uniqueCollections.has(collection.handle)) {
          uniqueCollections.set(collection.handle, {
            shopify_id: collection.id.replace('gid://shopify/Collection/', ''),
            title: collection.title,
            handle: collection.handle,
            updated_at: new Date().toISOString()
          })
        }
      })
    })

    if (uniqueCollections.size > 0) {
      await supabase
        .from('shopify_collections_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      await supabase
        .from('shopify_collections_cache')
        .insert(Array.from(uniqueCollections.values()))
    }

    // Clear all related caches to force refresh
    await supabase
      .from('cache')
      .delete()
      .or('key.like.%shopify%,key.like.%product%,key.like.%collection%')

    await supabase
      .from('products_cache_simple')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    const finalStats = {
      total_products: allProducts.length,
      cached_products: successCount,
      total_collections: uniqueCollections.size,
      categories_found: [...new Set(allProducts.map(p => {
        const collectionHandles = p.collections.map(c => c.handle.toLowerCase())
        if (collectionHandles.some(h => h.includes('beer'))) return 'beer'
        if (collectionHandles.some(h => h.includes('wine'))) return 'wine'
        if (collectionHandles.some(h => h.includes('spirit'))) return 'spirits'
        if (collectionHandles.some(h => h.includes('mixer'))) return 'mixers'
        if (collectionHandles.some(h => h.includes('seltzer'))) return 'seltzer'
        return 'other'
      }))],
      timestamp: new Date().toISOString()
    }

    console.log('🎯 BULK SYNC COMPLETE:', finalStats)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk product sync completed successfully',
        stats: finalStats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Bulk sync error:', error)
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