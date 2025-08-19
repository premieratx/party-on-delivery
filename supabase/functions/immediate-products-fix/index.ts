import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('🚀 IMMEDIATE PRODUCTS FIX: Starting...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const shopifyStore = Deno.env.get('SHOPIFY_STORE_URL')
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

    if (!shopifyStore || !shopifyToken) {
      throw new Error('Missing Shopify credentials')
    }

    console.log('🧹 Clearing broken cache entries...')
    
    // Clear any broken products
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('📦 Fetching fresh products from Shopify...')
    
    const shopifyUrl = shopifyStore.startsWith('http') ? shopifyStore : `https://${shopifyStore}`
    
    const response = await fetch(`${shopifyUrl}/admin/api/2023-10/products.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const shopifyData = await response.json()
    const products = shopifyData.products || []

    console.log(`📦 Retrieved ${products.length} products from Shopify`)

    if (products.length === 0) {
      throw new Error('No products found in Shopify')
    }

    // Transform products to match EXACT database schema
    let insertedCount = 0
    const batchSize = 50

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      console.log(`💾 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}...`)
      
      const transformedBatch = batch.map((product: ShopifyProduct) => {
        const price = product.variants?.[0]?.price || '0.00'
        const image = product.image?.src || product.images?.[0]?.src || ''
        
        // Simple category mapping
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

        // Return object matching EXACT database schema
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
          collection_handles: [],
          variants: product.variants || []
        }
      })

      const { error: insertError } = await supabase
        .from('shopify_products_cache')
        .insert(transformedBatch)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        throw insertError
      } else {
        insertedCount += transformedBatch.length
        console.log(`✅ Inserted ${transformedBatch.length} products (total: ${insertedCount})`)
      }
    }

    console.log(`🎉 IMMEDIATE FIX COMPLETE! Successfully inserted ${insertedCount} products`)

    // Update cache timestamp
    await supabase
      .from('cache')
      .upsert({
        key: 'shopify-unified-sync',
        data: { products_count: insertedCount, synced_at: new Date().toISOString() },
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: insertedCount,
        message: 'Products successfully loaded from Shopify'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ Immediate products fix error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products_synced: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})