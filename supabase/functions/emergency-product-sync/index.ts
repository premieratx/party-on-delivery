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
    console.log('🚨 EMERGENCY PRODUCT SYNC: Starting immediate product reload...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Skip unified sync - go straight to direct product fetch
    console.log('🔄 Calling fetch-shopify-products directly...')
    
    const { data: syncData, error: syncError } = await supabase.functions.invoke('fetch-shopify-products')
    
    if (syncError) {
      console.error('❌ Direct fetch failed:', syncError)
      throw syncError
    } else {
      console.log('✅ Direct fetch completed:', syncData)
    }

    // Check if we now have products
    const { data: productCheck, error: checkError } = await supabase
      .from('shopify_products_cache')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Error checking products:', checkError)
    }
    
    const productCount = productCheck?.length || 0
    console.log(`📊 Products in cache after sync: ${productCount}`)
    
    if (productCount === 0) {
      console.log('🔄 No products found, trying bulk sync...')
      
      // Try calling bulk-product-sync directly
      const { data: fetchData, error: fetchError } = await supabase.functions.invoke('bulk-product-sync')
      
      if (fetchError) {
        console.error('❌ Bulk sync failed:', fetchError)
      } else {
        console.log('✅ Bulk sync completed:', fetchData)
      }
    }

    // Final check
    const { data: finalCheck, error: finalError } = await supabase
      .from('shopify_products_cache')
      .select('id')
      .limit(10)
    
    const finalCount = finalCheck?.length || 0
    console.log(`📊 Final product count: ${finalCount}`)

    // Clear any problematic cache entries that might be blocking
    await supabase
      .from('cache')
      .delete()
      .like('key', '%emergency%')

    console.log('✅ EMERGENCY PRODUCT SYNC COMPLETE')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Emergency product sync completed',
        productsFound: finalCount,
        syncAttempted: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Emergency sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Emergency product sync failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})