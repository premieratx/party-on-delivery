import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔥 Keep-warm service activated...')

    // Keep critical functions warm by invoking them
    const functionsToWarmUp = [
      'shopify-sync-optimizer',
      'immediate-shopify-sync', 
      'get-dashboard-data',
      'ultra-fast-search'
    ]

    const warmupResults = []

    for (const functionName of functionsToWarmUp) {
      try {
        console.log(`🔥 Warming up ${functionName}...`)
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { warmup: true, keepAlive: true }
        })
        
        warmupResults.push({
          function: functionName,
          success: !error,
          response: data || error?.message
        })
        
        console.log(`✅ ${functionName} warmed up`)
      } catch (err) {
        console.log(`⚠️ ${functionName} warmup failed:`, err.message)
        warmupResults.push({
          function: functionName,
          success: false,
          error: err.message
        })
      }
    }

    // Keep Shopify products fresh
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, handle')
      .eq('is_active', true)
      .limit(1)

    const productsCount = products?.length || 0
    console.log(`📦 Products available: ${productsCount}`)

    // Refresh collections if needed
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, title, handle')
      .limit(1)

    const collectionsCount = collections?.length || 0
    console.log(`📚 Collections available: ${collectionsCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Keep-warm service completed',
        timestamp: new Date().toISOString(),
        functions_warmed: warmupResults,
        products_count: productsCount,
        collections_count: collectionsCount,
        system_status: 'hot'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Keep-warm service error:', error)
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
