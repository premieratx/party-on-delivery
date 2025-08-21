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

    console.log('🔥 Warming Shopify sync pipeline...')

    // Keep Shopify API warm by checking product count
    const { data: productCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (countError) {
      console.error('Error checking products:', countError)
    } else {
      console.log(`📦 Products in database: ${productCount}`)
    }

    // Check last sync time to determine if sync is needed
    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastSyncTime = lastSync?.created_at ? new Date(lastSync.created_at).getTime() : 0
    const now = Date.now()
    const timeSinceLastSync = now - lastSyncTime
    const syncNeeded = timeSinceLastSync > (30 * 60 * 1000) // 30 minutes

    console.log(`⏰ Last sync: ${timeSinceLastSync / 1000 / 60} minutes ago`)

    // Warm up critical sync functions
    const syncFunctions = ['shopify-sync-optimizer', 'immediate-shopify-sync']
    const results = []

    for (const funcName of syncFunctions) {
      try {
        console.log(`🔥 Warming ${funcName}...`)
        const { data, error } = await supabase.functions.invoke(funcName, {
          body: { warmup: true }
        })
        
        results.push({
          function: funcName,
          success: !error,
          warmed: true
        })
        
        console.log(`✅ ${funcName} warmed successfully`)
      } catch (err) {
        console.log(`⚠️ ${funcName} warmup failed:`, err.message)
        results.push({
          function: funcName,
          success: false,
          error: err.message
        })
      }
    }

    // If sync is needed, trigger it
    let syncTriggered = false
    if (syncNeeded && (productCount || 0) < 500) {
      console.log('🚀 Triggering sync due to low product count or stale data...')
      try {
        await supabase.functions.invoke('shopify-sync-optimizer')
        syncTriggered = true
        console.log('✅ Sync triggered successfully')
      } catch (error) {
        console.error('❌ Failed to trigger sync:', error)
      }
    }

    // Keep collections cache fresh
    const { data: collections } = await supabase
      .from('collections')
      .select('id, title, handle')
      .eq('is_active', true)
      .limit(5)

    console.log(`📚 Collections available: ${collections?.length || 0}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shopify sync pipeline warmed',
        timestamp: new Date().toISOString(),
        stats: {
          product_count: productCount,
          collections_count: collections?.length || 0,
          last_sync_minutes_ago: Math.round(timeSinceLastSync / 1000 / 60),
          sync_needed: syncNeeded,
          sync_triggered: syncTriggered
        },
        functions_warmed: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Shopify warm-up error:', error)
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
