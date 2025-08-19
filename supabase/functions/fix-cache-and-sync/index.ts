import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Simple cache cleaner and sync trigger
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

    console.log('🧹 Clearing broken cache data...')
    
    // Clear the products cache to remove any broken entries
    const { error: clearError } = await supabase
      .from('shopify_products_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (clearError) {
      console.log('Clear error (might be empty):', clearError)
    }

    console.log('🔄 Triggering fresh unified sync...')
    
    // Trigger the unified sync which has the correct schema
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('unified-shopify-sync', {
      body: { forceRefresh: true }
    })

    if (syncError) {
      console.error('Sync error:', syncError)
      throw new Error(`Sync failed: ${syncError.message}`)
    }

    console.log('✅ Fresh sync triggered:', syncResult)

    // Check product count after sync
    const { count: productCount, error: countError } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Products after sync: ${productCount || 0}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cache cleared and fresh sync triggered',
        products_count: productCount || 0,
        sync_result: syncResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Cache fix error:', error)
    
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