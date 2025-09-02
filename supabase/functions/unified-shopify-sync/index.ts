import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  images: Array<{ url: string; altText?: string }>;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    availableForSale: boolean;
  }>;
  collections: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
}

interface UnifiedCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  app_category: string;
  product_count: number;
  products: ShopifyProduct[];
  shopify_collection_id: string;
  priority: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting unified Shopify sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { forceRefresh = false } = await req.json().catch(() => ({}))

    // Step 1: Fetch all products with collections using Admin API (most complete data)
    const products = await fetchAllProductsWithCollections()
    console.log(`📦 Fetched ${products.length} products from Shopify`)

    if (products.length === 0) {
      throw new Error('No products returned from Shopify - check API credentials')
    }

    // Step 2: Build collections from all product collections
    const allCollections = await buildAllCollections(products)
    console.log(`🏷️ Found ${allCollections.length} total collections`)

    // Step 3: Clear and update all caches atomically
    await updateCaches(supabase, products, allCollections, forceRefresh)

    const totalProducts = products.length
    const totalCollections = allCollections.length

    console.log(`✅ Unified sync completed: ${totalProducts} products, ${totalCollections} collections`)

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: totalProducts,
        collections_synced: totalCollections,
        sync_type: 'unified',
        cached_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        last_sync: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Unified sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sync_type: 'unified'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchAllProductsWithCollections(): Promise<ShopifyProduct[]> {
  const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL')?.replace(/https?:\/\//, '') || ''
  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
    throw new Error('Missing Shopify credentials')
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
            collections(first: 20, sortKey: TITLE) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  products(first: 250, sortKey: COLLECTION_DEFAULT) {
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
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
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
          }
        }
      }
    }
  `

  let allProducts: ShopifyProduct[] = []
  let hasNextPage = true
  let cursor = null
  let pageCount = 0
  const maxPages = 20 // Safety limit

  while (hasNextPage && pageCount < maxPages) {
    const variables = { first: 50, ...(cursor && { after: cursor }) } // Reduce batch size
    
    // Add delay between requests to avoid rate limiting
    if (pageCount > 0) {
      console.log('⏳ Waiting 2 seconds to avoid rate limits...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      // Check for throttling specifically
      const isThrottled = data.errors.some((error: any) => 
        error.extensions?.code === 'THROTTLED'
      )
      
      if (isThrottled) {
        console.log('⚠️ Rate limited by Shopify. Waiting 10 seconds...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        // Retry the same request
        continue
      }
      
      console.error('GraphQL errors:', data.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    const products = data.data?.products?.edges?.map(({ node }: any) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description || '',
      productType: node.productType || '',
      vendor: node.vendor || '',
      tags: node.tags || [],
      images: node.images.edges.map(({ node: img }: any) => ({
        url: img.url,
        altText: img.altText
      })),
      variants: node.variants.edges.map(({ node: variant }: any) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        availableForSale: variant.availableForSale
      })),
      collections: node.collections.edges.map(({ node: col }: any) => ({
        id: col.id,
        title: col.title,
        handle: col.handle
      }))
    })) || []

    allProducts = allProducts.concat(products)
    
    hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false
    cursor = data.data?.products?.pageInfo?.endCursor
    pageCount++
    
    console.log(`📄 Page ${pageCount}: ${products.length} products (total: ${allProducts.length})`)
  }

  return allProducts
}

async function buildAllCollections(products: ShopifyProduct[]) {
  const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL')?.replace(/https?:\/\//, '') || ''
  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')
  
  const collectionsMap = new Map()
  
  // Build all collections that have products
  for (const product of products) {
    for (const collection of product.collections) {
      if (!collectionsMap.has(collection.handle)) {
        collectionsMap.set(collection.handle, {
          handle: collection.handle,
          title: collection.title,
          id: collection.id,
          products: []
        })
      }
      collectionsMap.get(collection.handle).products.push(product)
    }
  }
  
  // Fetch proper ordering from Shopify collections with sortKey: COLLECTION_DEFAULT
  const collectionsWithOrder = []
  let collectionIndex = 0
  
  for (const [handle, collectionData] of collectionsMap) {
    try {
      console.log(`🔄 Fetching ordered products for collection: ${handle} (${collectionIndex + 1}/${collectionsMap.size})`)
      
      // Add delay between collection fetches to avoid rate limiting
      if (collectionIndex > 0) {
        console.log('⏳ Waiting 1.5 seconds between collections...')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      const orderQuery = `
        query getCollectionByHandle($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            handle
            title
            description
            products(first: 250, sortKey: COLLECTION_DEFAULT) {
              edges {
                node {
                  id
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        price
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
      
      const orderResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ 
          query: orderQuery, 
          variables: { handle } 
        }),
      })
      
      collectionIndex++
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        
        // Check for throttling in collection response
        if (orderData.errors) {
          const isThrottled = orderData.errors.some((error: any) => 
            error.extensions?.code === 'THROTTLED'
          )
          
          if (isThrottled) {
            console.log(`⚠️ Rate limited on collection ${handle}. Waiting 10 seconds...`)
            await new Promise(resolve => setTimeout(resolve, 10000))
            // Skip this collection for now to avoid further throttling
            console.log(`⏭️ Skipping collection ${handle} due to rate limiting`)
            continue
          }
        }
        
        const orderedCollection = orderData.data?.collectionByHandle
        
        if (orderedCollection) {
          // Map products with their Shopify collection order (sort_order)
          const orderedProducts = orderedCollection.products.edges.map((edge: any, index: number) => {
            const productId = edge.node.id
            const shopifyProduct = products.find(p => p.id === productId)
            
            return {
              ...edge.node,
              sort_order: index + 1, // 1-based ordering from Shopify
              price: parseFloat(edge.node.variants.edges[0]?.node?.price || '0'),
              image: edge.node.images.edges[0]?.node?.url || '/placeholder.svg',
              shopify_product: shopifyProduct // Keep full product data
            }
          })
          
          collectionsWithOrder.push({
            shopify_collection_id: orderedCollection.id,
            handle: orderedCollection.handle,
            title: orderedCollection.title,
            description: orderedCollection.description || '',
            products_count: orderedProducts.length,
            data: {
              handle: orderedCollection.handle,
              title: orderedCollection.title,
              products: orderedProducts
            },
            updated_at: new Date().toISOString()
          })
          
          console.log(`✅ Collection ${handle}: ${orderedProducts.length} products ordered`)
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching order for collection ${handle}:`, error)
      // Fallback to unordered collection
      collectionsWithOrder.push({
        shopify_collection_id: collectionData.id,
        handle: collectionData.handle,
        title: collectionData.title,
        description: '',
        products_count: collectionData.products.length,
        data: {
          handle: collectionData.handle,
          title: collectionData.title,
          products: collectionData.products.map((p: any, index: number) => ({
            id: p.id,
            title: p.title,
            price: parseFloat(p.variants[0]?.price || '0'),
            image: p.images[0]?.url || '/placeholder.svg',
            sort_order: index + 1 // Fallback ordering
          }))
        },
        updated_at: new Date().toISOString()
      })
    }
  }
  
  console.log(`📦 Built ${collectionsWithOrder.length} collections with proper ordering`)
  
  return collectionsWithOrder
}

async function updateCaches(
  supabase: any, 
  products: ShopifyProduct[], 
  collections: any[],
  forceRefresh: boolean
) {
  console.log('🗑️ Clearing existing caches...')
  
  // Clear all related caches
  await Promise.all([
    supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('shopify_collections_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('cache').delete().like('key', 'shopify%'),
    supabase.from('cache').delete().like('key', 'products%'),
    supabase.from('cache').delete().like('key', 'collections%')
  ])

  console.log('💾 Inserting fresh product cache...')
  
  // Insert products in batches
  const batchSize = 50
  let totalInserted = 0
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    const cacheItems = batch.map(product => {
      // Find sort_order for this product across all collections
      let sort_order = 0
      for (const collection of collections) {
        const collectionProducts = collection.data.products || []
        const productInCollection = collectionProducts.find((p: any) => p.id === product.id)
        if (productInCollection && productInCollection.sort_order) {
          sort_order = productInCollection.sort_order
          break // Use the first found sort order
        }
      }
      
      return {
        shopify_product_id: product.id,
        title: product.title,
        handle: product.handle,
        price: parseFloat(product.variants[0]?.price || '0'),
        image: product.images[0]?.url || '/placeholder.svg',
        category: getProductCategory(product),
        category_title: formatCategoryTitle(getProductCategory(product)),
        vendor: product.vendor,
        description: product.description,
        product_type: product.productType,
        search_category: normalizeProductType(product.productType),
        tags: product.tags,
        variants: product.variants,
        collection_handles: product.collections?.map(c => c.handle) || [],
        sort_order: sort_order, // CRITICAL: Preserve Shopify collection order
        data: product,
        updated_at: new Date().toISOString()
      }
    })

    const { error: insertError } = await supabase
      .from('shopify_products_cache')
      .insert(cacheItems)

    if (insertError) {
      console.error(`Error inserting product batch ${Math.floor(i / batchSize) + 1}:`, insertError)
    } else {
      totalInserted += cacheItems.length
      console.log(`✅ Inserted product batch ${Math.floor(i / batchSize) + 1} (${cacheItems.length} products)`)
    }
  }

  console.log('💾 Inserting collections cache...')
  
  // Insert collections in smaller batches to avoid timeouts
  const collectionBatchSize = 25
  let totalCollectionsInserted = 0
  
  for (let i = 0; i < collections.length; i += collectionBatchSize) {
    const batch = collections.slice(i, i + collectionBatchSize)
    
    const { error: collectionsError } = await supabase
      .from('shopify_collections_cache')
      .insert(batch)

    if (collectionsError) {
      console.error(`Error inserting collection batch ${Math.floor(i / collectionBatchSize) + 1}:`, collectionsError)
    } else {
      totalCollectionsInserted += batch.length
      console.log(`✅ Inserted collection batch ${Math.floor(i / collectionBatchSize) + 1} (${batch.length} collections)`)
    }
  }

  console.log(`💾 Collections cache complete: ${totalCollectionsInserted}/${collections.length} collections inserted`)

  // Create unified cache entry
  const unifiedCacheData = {
    products: products.length,
    collections: collections.length,
    last_sync: new Date().toISOString(),
    sync_type: 'unified',
    collection_list: collections.map(c => ({
      handle: c.handle,
      title: c.title,
      product_count: c.products_count
    }))
  }

  await supabase.from('cache').upsert({
    key: 'shopify-unified-sync',
    data: unifiedCacheData,
    expires_at: Date.now() + (30 * 60 * 1000), // 30 minutes
    updated_at: new Date().toISOString()
  })

  console.log(`💾 Cache updated: ${totalInserted} products, ${collections.length} collections`)
}

function getProductCategory(product: ShopifyProduct): string {
  // Check collections first
  for (const collection of product.collections) {
    const handle = collection.handle.toLowerCase()
    if (handle.includes('beer')) return 'beer'
    if (handle.includes('wine') || handle.includes('champagne')) return 'wine'
    if (handle.includes('spirit') || handle.includes('whiskey') || handle.includes('vodka') || handle.includes('gin') || handle.includes('rum') || handle.includes('tequila')) return 'spirits'
    if (handle.includes('cocktail')) return 'cocktails'
    if (handle.includes('mixer') || handle.includes('soda') || handle.includes('juice')) return 'mixers'
    if (handle.includes('party') || handle.includes('supplies')) return 'party-supplies'
  }
  
  // Check product type
  const productType = product.productType.toLowerCase()
  if (productType.includes('beer')) return 'beer'
  if (productType.includes('wine')) return 'wine'
  if (productType.includes('spirit') || productType.includes('whiskey') || productType.includes('vodka')) return 'spirits'
  if (productType.includes('cocktail')) return 'cocktails'
  if (productType.includes('mixer')) return 'mixers'
  
  return 'other'
}

function formatCategoryTitle(category: string): string {
  const titleMap: Record<string, string> = {
    'beer': 'Beer',
    'wine': 'Wine & Champagne',
    'spirits': 'Spirits',
    'cocktails': 'Cocktails',
    'mixers': 'Mixers & N/A',
    'party-supplies': 'Party Supplies',
    'other': 'Other'
  }
  
  return titleMap[category] || category.charAt(0).toUpperCase() + category.slice(1)
}

function normalizeProductType(productType: string): string {
  if (!productType) return 'other'
  
  const normalized = productType.toLowerCase().trim()
  
  // Map Shopify productTypes to search categories
  const typeMapping: Record<string, string> = {
    'beer': 'beer',
    'wine': 'wine',
    'spirits': 'spirits',
    'whiskey': 'spirits',
    'vodka': 'spirits',
    'rum': 'spirits',
    'gin': 'spirits',
    'tequila': 'spirits',
    'cocktail': 'cocktails',
    'mixer': 'mixers',
    'soda': 'mixers',
    'juice': 'mixers',
    'water': 'mixers',
    'party supplies': 'party-supplies',
    'ice': 'party-supplies',
    'cups': 'party-supplies',
    'snacks': 'snacks',
    'food': 'snacks'
  }
  
  // Find exact match first
  if (typeMapping[normalized]) {
    return typeMapping[normalized]
  }
  
  // Find partial match
  for (const [key, value] of Object.entries(typeMapping)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  
  return 'other'
}