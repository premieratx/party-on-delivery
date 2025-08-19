import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  products: any[];
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: any[];
  images: any[];
  image: any;
  tags: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🏪 SHOPIFY COLLECTION SYNC: Starting complete sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const shopifyStore = Deno.env.get('SHOPIFY_STORE_URL')
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

    if (!shopifyStore || !shopifyToken) {
      throw new Error('Missing Shopify credentials')
    }

    const shopifyUrl = shopifyStore.startsWith('http') ? shopifyStore : `https://${shopifyStore}`

    console.log('📦 Step 1: Fetching ALL collections from Shopify...')
    
    // Fetch all collections with their products
    const collectionsResponse = await fetch(`${shopifyUrl}/admin/api/2023-10/collections.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json'
      }
    })

    if (!collectionsResponse.ok) {
      throw new Error(`Shopify Collections API error: ${collectionsResponse.status}`)
    }

    const collectionsData = await collectionsResponse.json()
    const collections = collectionsData.custom_collections || []

    console.log(`📂 Found ${collections.length} collections in Shopify`)

    // Clear existing cache
    console.log('🧹 Clearing old cache...')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shopify_collections_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('📦 Step 2: Fetching products for each collection...')
    
    let totalProductsInserted = 0
    let collectionsInserted = 0

    for (const collection of collections) {
      try {
        console.log(`🔍 Processing collection: ${collection.handle} (${collection.title})`)
        
        // Fetch products for this specific collection
        const productsResponse = await fetch(`${shopifyUrl}/admin/api/2023-10/collections/${collection.id}/products.json?limit=250`, {
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json'
          }
        })

        if (!productsResponse.ok) {
          console.log(`⚠️ Could not fetch products for collection ${collection.handle}`)
          continue
        }

        const productsData = await productsResponse.json()
        const products = productsData.products || []

        console.log(`📦 Collection ${collection.handle} has ${products.length} products`)

        if (products.length > 0) {
          // Insert collection record
          const { error: collectionError } = await supabase
            .from('shopify_collections_cache')
            .insert({
              shopify_id: collection.id,
              handle: collection.handle,
              title: collection.title,
              description: collection.body_html || '',
              image: collection.image?.src || null,
              product_count: products.length,
              data: collection
            })

          if (collectionError) {
            console.error(`Error inserting collection ${collection.handle}:`, collectionError)
          } else {
            collectionsInserted++
          }

          // Transform and insert products with collection mapping
          const transformedProducts = products.map((product: ShopifyProduct) => {
            const price = product.variants?.[0]?.price || '0.00'
            const image = product.image?.src || product.images?.[0]?.src || ''
            
            // Simple category detection
            let category = 'other'
            const productType = product.product_type?.toLowerCase() || ''
            const tags = product.tags?.toLowerCase() || ''
            
            if (productType.includes('beer') || tags.includes('beer')) {
              category = 'beer'
            } else if (productType.includes('wine') || tags.includes('wine')) {
              category = 'wine'
            } else if (productType.includes('spirit') || tags.includes('spirit') || productType.includes('liquor')) {
              category = 'spirits'
            } else if (productType.includes('mixer') || tags.includes('mixer')) {
              category = 'mixers'
            } else if (productType.includes('party') || tags.includes('party')) {
              category = 'party-supplies'
            } else if (productType.includes('snack') || tags.includes('snack')) {
              category = 'snacks'
            }

            return {
              shopify_id: product.id,
              title: product.title,
              handle: product.handle,
              vendor: product.vendor,
              price: parseFloat(price),
              image: image,
              category: category,
              category_title: category.charAt(0).toUpperCase() + category.slice(1),
              product_type: product.product_type,
              search_category: category,
              tags: product.tags?.split(',') || [],
              data: product,
              collection_handles: [collection.handle], // CRITICAL: Map to this specific collection
              variants: product.variants || []
            }
          })

          // Insert products in batches
          const batchSize = 25
          for (let i = 0; i < transformedProducts.length; i += batchSize) {
            const batch = transformedProducts.slice(i, i + batchSize)
            
            const { error: productError } = await supabase
              .from('shopify_products_cache')
              .insert(batch)

            if (productError) {
              console.error(`Error inserting products for ${collection.handle}:`, productError)
            } else {
              totalProductsInserted += batch.length
            }
          }
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing collection ${collection.handle}:`, error)
        continue
      }
    }

    console.log(`🎉 SYNC COMPLETE! Inserted ${collectionsInserted} collections and ${totalProductsInserted} products`)

    // Update sync cache
    await supabase
      .from('cache')
      .upsert({
        key: 'shopify-collection-sync',
        data: { 
          collections_synced: collectionsInserted, 
          products_synced: totalProductsInserted,
          synced_at: new Date().toISOString() 
        },
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })

    return new Response(
      JSON.stringify({
        success: true,
        collections_synced: collectionsInserted,
        products_synced: totalProductsInserted,
        message: 'Collections and products synced with proper mapping'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ Collection sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        collections_synced: 0,
        products_synced: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})