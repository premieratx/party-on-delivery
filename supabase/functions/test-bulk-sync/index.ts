import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test the shopify-bulk-sync function
    console.log('🔄 Testing Shopify bulk sync functionality...')

    // Example: Move products from one collection to another
    const testOperations = [
      {
        type: 'remove',
        collection_handle: 'beer-collection',
        product_ids: ['test-product-1', 'test-product-2']
      },
      {
        type: 'add', 
        collection_handle: 'spirits-cocktails',
        product_ids: ['test-product-1', 'test-product-2']
      }
    ]

    console.log('📦 Test operations:', testOperations)

    // Call the bulk sync function
    const { data: bulkSyncResult, error: bulkSyncError } = await supabaseClient.functions.invoke('shopify-bulk-sync', {
      body: { operations: testOperations }
    })

    if (bulkSyncError) {
      console.error('❌ Bulk sync error:', bulkSyncError)
      throw bulkSyncError
    }

    console.log('✅ Bulk sync result:', bulkSyncResult)

    // Test sync rules configuration
    const { data: syncRules, error: rulesError } = await supabaseClient
      .from('sync_configuration_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority')

    if (rulesError) {
      console.error('❌ Rules error:', rulesError)
      throw rulesError
    }

    console.log('📋 Active sync rules:', syncRules?.length || 0)

    // Test instant cache
    const { data: cacheResult, error: cacheError } = await supabaseClient.functions.invoke('instant-product-cache')

    if (cacheError) {
      console.error('⚠️ Cache warning:', cacheError)
    } else {
      console.log('⚡ Cache result:', cacheResult ? 'Success' : 'Empty')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk sync test completed successfully',
        results: {
          bulkSync: bulkSyncResult,
          syncRules: syncRules?.length || 0,
          cacheTest: cacheResult ? 'working' : 'empty'
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})