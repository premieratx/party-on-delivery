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

    console.log('🚀 Starting Shopify sync optimization...')

    // Clear any stale product modifications that might be causing sync loops
    const { data: oldMods, error: deleteError } = await supabase
      .from('product_modifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Delete modifications older than 30 minutes

    if (deleteError) {
      console.error('Error clearing old modifications:', deleteError)
    } else {
      console.log(`🧹 Cleared ${oldMods?.length || 0} stale product modifications`)
    }

    // Trigger immediate sync
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('immediate-shopify-sync')
    
    if (syncError) {
      console.error('Error in immediate sync:', syncError)
      throw syncError
    }

    console.log('✅ Immediate sync completed:', syncResult)

    // Trigger instant product cache refresh
    const { data: cacheResult, error: cacheError } = await supabase.functions.invoke('instant-product-cache')
    
    if (cacheError) {
      console.error('Error refreshing instant cache:', cacheError)
    } else {
      console.log('⚡ Instant cache refreshed:', cacheResult)
    }

    // Clear collections cache to force fresh data
    await supabase
      .from('cache')
      .delete()
      .like('key', '%collection%')

    console.log('🔄 Collections cache cleared')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify sync optimization completed',
        sync_result: syncResult,
        cache_result: cacheResult,
        cleared_modifications: oldMods?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Shopify sync optimization error:', error)
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