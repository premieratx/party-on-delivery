import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting product category sync to Shopify...')

    // This function will sync product categories from our database back to Shopify
    // by updating product tags or collections
    
    const { categories } = await req.json()
    console.log('Categories to sync:', categories?.length || 'all')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all product categories
    const { data: productCategories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .order('updated_at', { ascending: false })

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`)
    }

    console.log(`Found ${productCategories.length} categorized products`)

    // Shopify configuration
    const shopifyUrl = Deno.env.get('SHOPIFY_STORE_URL')!
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')!
    
    let syncedCount = 0
    let errorCount = 0

    // Process categories in batches
    for (const category of productCategories) {
      try {
        // Update product tags in Shopify to include category
        const tags = [
          category.assigned_category,
          category.subcategory && `subcategory:${category.subcategory}`
        ].filter(Boolean).join(',')

        const updateResponse = await fetch(
          `${shopifyUrl}/admin/api/2023-10/products/${category.shopify_product_id}.json`,
          {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': shopifyToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product: {
                id: category.shopify_product_id,
                tags: tags
              }
            })
          }
        )

        if (updateResponse.ok) {
          syncedCount++
          console.log(`✅ Updated product ${category.product_title} with category tags`)
        } else {
          errorCount++
          console.error(`❌ Failed to update product ${category.product_title}:`, await updateResponse.text())
        }

      } catch (error) {
        errorCount++
        console.error(`❌ Error updating product ${category.product_title}:`, error)
      }
    }

    console.log(`🎉 Sync completed: ${syncedCount} synced, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: syncedCount,
        error_count: errorCount,
        total_categories: productCategories.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})