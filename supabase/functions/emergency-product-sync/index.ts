import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: any[];
  options: any[];
  images: any[];
  image: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚨 EMERGENCY: Starting product sync to fix empty cache...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const shopifyStore = Deno.env.get('SHOPIFY_STORE_URL')
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')

    if (!shopifyStore || !shopifyToken) {
      throw new Error('Missing Shopify credentials')
    }

    console.log('📦 Fetching products from Shopify...')
    
    // Ensure proper URL format
    const shopifyUrl = shopifyStore.startsWith('http') ? shopifyStore : `https://${shopifyStore}`
    
    // Fetch products from Shopify
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No products found in Shopify',
          products_synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear existing cache
    console.log('🗑️ Clearing old cache...')
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Transform and insert products
    let insertedCount = 0
    const batchSize = 50

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      console.log(`💾 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}...`)
      
      const transformedBatch = batch.map((product: ShopifyProduct) => {
        const price = product.variants?.[0]?.price || '0.00'
        const image = product.image?.src || product.images?.[0]?.src || ''
        
        // Determine category from product type and tags
        let category = 'other'
        const productType = product.product_type?.toLowerCase() || ''
        const tags = product.tags?.toLowerCase() || ''
        
        if (productType.includes('beer') || tags.includes('beer')) {
          category = 'beer'
        } else if (productType.includes('wine') || tags.includes('wine')) {
          category = 'wine'
        } else if (productType.includes('spirit') || tags.includes('spirit') || productType.includes('liquor')) {
          category = 'spirits'
        } else if (productType.includes('mixer') || tags.includes('mixer') || productType.includes('soda')) {
          category = 'mixers'
        } else if (productType.includes('snack') || tags.includes('snack')) {
          category = 'snacks'
        } else if (productType.includes('ice') || tags.includes('ice')) {
          category = 'ice'
        }

        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          price: parseFloat(price),
          image: image,
          category: category,
          product_type: product.product_type,
          tags: product.tags,
          status: product.status,
          data: product,
          collection_handles: [], // Will be populated later if needed
          variants: product.variants || [],
          updated_at: new Date().toISOString()
        }
      })

      const { error: insertError } = await supabase
        .from('shopify_products_cache')
        .insert(transformedBatch)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        // Continue with next batch
      } else {
        insertedCount += transformedBatch.length
        console.log(`✅ Inserted ${transformedBatch.length} products (total: ${insertedCount})`)
      }
    }

    // Update category mappings
    console.log('🗂️ Updating category mappings...')
    const categories = ['beer', 'wine', 'spirits', 'mixers', 'snacks', 'ice', 'other']
    
    for (const cat of categories) {
      await supabase
        .from('category_mappings_simple')
        .upsert({ 
          collection_handle: cat, 
          app_category: cat 
        }, { 
          onConflict: 'collection_handle' 
        })
    }

    console.log(`🎉 Emergency sync complete! Synced ${insertedCount} products`)

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: insertedCount,
        categories_updated: categories.length,
        message: 'Emergency product sync completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Emergency sync error:', error)
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