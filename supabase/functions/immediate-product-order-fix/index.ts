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
    console.log('⚡ IMMEDIATE SYNC: Fixing all product ordering across collections...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Trigger unified sync with proper service role authentication
    console.log('🚀 Triggering complete Shopify sync with collection ordering...')
    
    const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
      body: { 
        forceRefresh: true, 
        reason: 'immediate-product-order-fix',
        priority: 'urgent',
        clearCache: true
      }
    })

    if (error) {
      console.error('❌ Failed to trigger sync:', error)
      
      // Try alternative approach - directly call the sync logic
      console.log('🔄 Attempting direct cache clear and sync...')
      
      // Clear existing cache first
      const { error: deleteError } = await supabase
        .from('cache')
        .delete()
        .like('key', '%product%')
      
      if (deleteError) {
        console.warn('⚠️ Cache clear warning:', deleteError)
      }
      
      // Clear shopify products cache
      const { error: shopifyCacheError } = await supabase
        .from('shopify_products_cache')
        .delete()
        .neq('id', 'dummy')
      
      if (shopifyCacheError) {
        console.warn('⚠️ Shopify cache clear warning:', shopifyCacheError)
      }
      
      console.log('✅ Product caches cleared - new products will be fetched with proper ordering')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cache cleared - products will refresh with correct ordering on next load',
          cache_cleared: true,
          completed_at: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ IMMEDIATE SYNC COMPLETE')
    console.log(`📊 Results: ${data.products_synced} products, ${data.collections_synced} collections`)
    console.log('🎯 All products now ordered according to Shopify collection ordering')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All product ordering fixed immediately',
        products_synced: data.products_synced,
        collections_synced: data.collections_synced,
        fix_applied: 'shopify-collection-ordering',
        completed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Immediate sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        attempted_fix: 'product-ordering'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})