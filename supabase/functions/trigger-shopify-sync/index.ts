import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 FORCE TRIGGERING SHOPIFY SYNC');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear all caches first
    console.log('🧹 Clearing all caches...');
    await Promise.all([
      supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ]);
    
    console.log('✅ Caches cleared');

    // Trigger fetch-shopify-products first
    console.log('📦 Triggering fetch-shopify-products...');
    const fetchResult = await supabase.functions.invoke('fetch-shopify-products', {
      body: { force: true }
    });
    
    console.log('📦 Fetch result:', fetchResult);

    // Wait a bit then trigger execute-sync
    console.log('⏳ Waiting 2 seconds then triggering execute-sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const syncResult = await supabase.functions.invoke('execute-sync', {
      body: { force: true }
    });
    
    console.log('🔄 Sync result:', syncResult);

    // Check products count
    const { count } = await supabase
      .from('shopify_products_cache')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ SYNC COMPLETE - ${count} products in cache`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Shopify sync complete - ${count} products loaded`,
        fetchResult,
        syncResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});