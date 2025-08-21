import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 KEEP-ALIVE SCHEDULER: Starting aggressive cache warming...');
    const startTime = performance.now();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Keep all critical functions warm by calling them
    const warmingPromises = [
      // 1. Cache warmer itself
      supabaseClient.functions.invoke('cache-warmer'),
      
      // 2. Product functions
      supabaseClient.functions.invoke('get-unified-products', {
        body: { use_type: 'delivery', lightweight: true }
      }),
      
      // 3. Search function
      supabaseClient.functions.invoke('ultra-fast-search', {
        body: { action: 'preload' }
      }),
      
      // 4. Shopify integration
      supabaseClient.functions.invoke('fetch-shopify-products', {
        body: { category: 'beer', limit: 50 }
      }),
    ];

    // Execute all warming calls in parallel
    const results = await Promise.allSettled(warmingPromises);
    
    // Log results
    results.forEach((result, index) => {
      const funcNames = ['cache-warmer', 'get-unified-products', 'ultra-fast-search', 'fetch-shopify-products'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${funcNames[index]}: Warmed successfully`);
      } else {
        console.log(`❌ ${funcNames[index]}: Failed - ${result.reason}`);
      }
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`🔥 KEEP-ALIVE completed in ${duration.toFixed(2)}ms`);

    // Schedule the next run in 5 minutes
    setTimeout(async () => {
      try {
        await supabaseClient.functions.invoke('keep-alive-scheduler');
      } catch (error) {
        console.error('❌ Failed to schedule next keep-alive:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        functions_warmed: results.filter(r => r.status === 'fulfilled').length,
        next_run_in_minutes: 5,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Keep-alive scheduler error:', error);
    
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
    );
  }
});
