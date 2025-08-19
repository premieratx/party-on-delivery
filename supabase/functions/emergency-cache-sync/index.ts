import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Emergency sync to populate product cache when it's empty
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚨 EMERGENCY: Starting immediate product sync...')

    // Check current product count
    const { count: currentProducts, error: countError } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current products in cache: ${currentProducts || 0}`)

    if (!currentProducts || currentProducts < 50) {
      console.log('🔄 Cache is empty or insufficient, triggering unified sync...')
      
      // Force refresh the unified sync
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      })

      if (syncError) {
        console.error('Sync error:', syncError)
        throw new Error(`Sync failed: ${syncError.message}`)
      }

      console.log('✅ Sync completed:', syncResult)

      // Check product count again
      const { count: newProducts, error: newCountError } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true })

      console.log(`📊 New products in cache: ${newProducts || 0}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Emergency sync completed',
          products_before: currentProducts || 0,
          products_after: newProducts || 0,
          sync_result: syncResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cache is sufficient, no sync needed',
          products_count: currentProducts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Emergency sync error:', error)
    
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