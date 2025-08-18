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

    // Step 2: Build unified collections that represent both categories and collections
    const unifiedCollections = await buildUnifiedCollections(products)
    console.log(`🏷️ Created ${unifiedCollections.size} unified collections`)

    // Step 3: Clear and update all caches atomically
    await updateCaches(supabase, products, unifiedCollections, forceRefresh)

    // Step 4: Update category mappings for consistency
    await updateCategoryMappings(supabase, unifiedCollections)

    const totalProducts = products.length
    const totalCollections = unifiedCollections.size

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
    const variables = { first: 100, ...(cursor && { after: cursor }) }
    
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

async function buildUnifiedCollections(products: ShopifyProduct[]): Promise<Map<string, UnifiedCollection>> {
  const collections = new Map<string, UnifiedCollection>()
  
  // Define priority categories (these map to both collections and categories)
  const priorityMappings = [
    { handle: 'spirits', title: 'Spirits', app_category: 'spirits', priority: 1 },
    { handle: 'beer', title: 'Beer', app_category: 'beer', priority: 2 },
    { handle: 'wine', title: 'Wine & Champagne', app_category: 'wine', priority: 3 },
    { handle: 'cocktails', title: 'Cocktails', app_category: 'cocktails', priority: 4 },
    { handle: 'mixers', title: 'Mixers & N/A', app_category: 'mixers', priority: 5 },
    { handle: 'party-supplies', title: 'Party Supplies', app_category: 'party-supplies', priority: 6 }
  ]

  // Initialize priority collections
  for (const mapping of priorityMappings) {
    collections.set(mapping.handle, {
      id: `unified-${mapping.handle}`,
      title: mapping.title,
      handle: mapping.handle,
      description: `${mapping.title} products`,
      app_category: mapping.app_category,
      product_count: 0,
      products: [],
      shopify_collection_id: '',
      priority: mapping.priority
    })
  }

  // Process all products and assign to unified collections
  for (const product of products) {
    const assignedCollections = new Set<string>()

    // First, try to match by Shopify collections
    for (const collection of product.collections) {
      const collectionHandle = collection.handle.toLowerCase()
      
      // Find matching priority mapping
      const mapping = priorityMappings.find(m => 
        collectionHandle.includes(m.handle) || 
        m.handle.includes(collectionHandle) ||
        collectionHandle.includes(m.app_category)
      )
      
      if (mapping && !assignedCollections.has(mapping.handle)) {
        const unifiedCollection = collections.get(mapping.handle)!
        unifiedCollection.products.push(product)
        unifiedCollection.product_count++
        unifiedCollection.shopify_collection_id = collection.id
        assignedCollections.add(mapping.handle)
      }
    }

    // If not assigned by collection, try by product type and tags
    if (assignedCollections.size === 0) {
      const productInfo = `${product.productType} ${product.tags.join(' ')}`.toLowerCase()
      
      for (const mapping of priorityMappings) {
        if (productInfo.includes(mapping.app_category) || 
            productInfo.includes(mapping.handle)) {
          const unifiedCollection = collections.get(mapping.handle)!
          unifiedCollection.products.push(product)
          unifiedCollection.product_count++
          assignedCollections.add(mapping.handle)
          break // Only assign to one category
        }
      }
    }

    // Fallback: assign to 'other' category
    if (assignedCollections.size === 0) {
      if (!collections.has('other')) {
        collections.set('other', {
          id: 'unified-other',
          title: 'Other',
          handle: 'other',
          description: 'Other products',
          app_category: 'other',
          product_count: 0,
          products: [],
          shopify_collection_id: '',
          priority: 99
        })
      }
      const otherCollection = collections.get('other')!
      otherCollection.products.push(product)
      otherCollection.product_count++
    }
  }

  return collections
}

async function updateCaches(
  supabase: any, 
  products: ShopifyProduct[], 
  collections: Map<string, UnifiedCollection>,
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
    
    // Determine primary category for each product
    const cacheItems = batch.map(product => {
      let primaryCategory = 'other'
      let primaryCategoryTitle = 'Other'
      
      // Find which collection this product belongs to
      for (const [handle, collection] of collections) {
        if (collection.products.some(p => p.id === product.id)) {
          primaryCategory = collection.app_category
          primaryCategoryTitle = collection.title
          break
        }
      }

      return {
        shopify_id: product.id,
        title: product.title,
        handle: product.handle,
        price: parseFloat(product.variants[0]?.price || '0'),
        image: product.images[0]?.url || '/placeholder.svg',
        category: primaryCategory,
        category_title: primaryCategoryTitle,
        vendor: product.vendor,
        description: product.description,
        product_type: product.productType, // Used for search categorization
        search_category: normalizeProductType(product.productType), // Normalized for search
        tags: product.tags,
        variants: product.variants,
        collection_handles: product.collections.map(c => c.handle), // Used for delivery app tabs
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
  
  // Insert unified collections
  const collectionItems = Array.from(collections.values()).map(collection => ({
    shopify_collection_id: collection.shopify_collection_id || collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    products_count: collection.product_count,
    data: {
      ...collection,
      products: collection.products.map(p => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.variants[0]?.price || '0'),
        image: p.images[0]?.url || '/placeholder.svg'
      }))
    },
    updated_at: new Date().toISOString()
  }))

  const { error: collectionsError } = await supabase
    .from('shopify_collections_cache')
    .insert(collectionItems)

  if (collectionsError) {
    console.error('Error inserting collections:', collectionsError)
  }

  // Create unified cache entry
  const unifiedCacheData = {
    products: products.length,
    collections: collections.size,
    last_sync: new Date().toISOString(),
    sync_type: 'unified',
    collection_list: Array.from(collections.values()).map(c => ({
      handle: c.handle,
      title: c.title,
      product_count: c.product_count,
      priority: c.priority
    }))
  }

  await supabase.from('cache').upsert({
    key: 'shopify-unified-sync',
    data: unifiedCacheData,
    expires_at: Date.now() + (30 * 60 * 1000), // 30 minutes
    updated_at: new Date().toISOString()
  })

  console.log(`💾 Cache updated: ${totalInserted} products, ${collectionItems.length} collections`)
}

async function updateCategoryMappings(supabase: any, collections: Map<string, UnifiedCollection>) {
  console.log('🏷️ Updating category mappings...')
  
  // Clear existing mappings
  await supabase.from('category_mappings_simple').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  // Insert unified mappings
  const mappings = Array.from(collections.values()).map(collection => ({
    collection_handle: collection.handle,
    app_category: collection.app_category,
    created_at: new Date().toISOString()
  }))

  const { error: mappingError } = await supabase
    .from('category_mappings_simple')
    .insert(mappings)

  if (mappingError) {
    console.error('Error updating category mappings:', mappingError)
  } else {
    console.log(`✅ Updated ${mappings.length} category mappings`)
  }
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