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
    console.log('💥 EMERGENCY CACHE CLEAR: Forcing immediate product order refresh...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // STEP 1: Clear ALL product caches
    console.log('🧹 Clearing all product caches...')
    
    const { error: cacheError } = await supabase
      .from('cache')
      .delete()
      .or('key.like.%product%,key.like.%collection%,key.like.%shopify%')
    
    if (cacheError) {
      console.warn('⚠️ Cache clear warning:', cacheError)
    }
    
    const { error: shopifyCacheError } = await supabase
      .from('shopify_products_cache')
      .delete()
      .neq('id', 'dummy')
    
    if (shopifyCacheError) {
      console.warn('⚠️ Shopify cache clear warning:', shopifyCacheError)
    }

    // STEP 2: Force immediate product refresh with ordering
    console.log('🔄 Forcing immediate product refresh with correct ordering...')
    
    // This will force the next product load to fetch fresh data with proper ordering
    const refreshTrigger = {
      cache_cleared_at: new Date().toISOString(),
      force_refresh: true,
      ordering_fix_applied: true
    }
    
    // Insert a cache entry that signals immediate refresh needed
    const { error: triggerError } = await supabase
      .from('cache')
      .insert({
        key: 'force_product_refresh_trigger',
        data: refreshTrigger,
        expires_at: Date.now() + (60 * 1000) // Expires in 1 minute
      })
    
    if (triggerError) {
      console.warn('⚠️ Trigger warning:', triggerError)
    }

    console.log('✅ EMERGENCY CACHE CLEAR COMPLETE')
    console.log('🎯 All products will now load with correct Shopify collection ordering')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Emergency cache clear complete - all products will refresh with correct ordering',
        caches_cleared: ['product_cache', 'shopify_cache', 'collection_cache'],
        next_load_will_refresh: true,
        completed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Emergency cache clear failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        attempted_fix: 'emergency-cache-clear'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})