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
    console.log('🔄 Auto-triggering Shopify product order sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the unified Shopify sync function to fix product ordering
    const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
      body: { forceRefresh: true, reason: 'auto-fix-product-ordering' }
    })

    if (error) {
      console.error('❌ Failed to trigger Shopify sync:', error)
      throw error
    }

    console.log('✅ Shopify product ordering sync completed:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product ordering automatically fixed',
        syncResult: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Auto-sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})