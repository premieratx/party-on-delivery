import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔥 Cache Warmer: Starting system cache warming...');
    const startTime = performance.now();

    // 1. Warm homepage delivery app
    const { data: homepageApp } = await supabaseClient
      .from('delivery_app_variations')
      .select('*')
      .eq('is_homepage', true)
      .eq('is_active', true)
      .maybeSingle();

    if (!homepageApp) {
      console.warn('⚠️ No homepage app configured');
    }

    // 2. Warm key product collections
    const { data: products } = await supabaseClient
      .from('shopify_products_cache')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    console.log(`🔥 Warmed ${products?.length || 0} products from cache`);

    // 3. Warm ultra-fast search cache
    const { data: searchData, error: searchError } = await supabaseClient.functions.invoke('ultra-fast-search', {
      body: { action: 'preload' }
    });

    if (searchError) {
      console.error('❌ Failed to warm search cache:', searchError);
    } else {
      console.log('🔥 Ultra-fast search cache warmed');
    }

    // 4. Warm unified products cache  
    const { data: unifiedData, error: unifiedError } = await supabaseClient.functions.invoke('get-unified-products', {
      body: { 
        use_type: 'delivery',
        lightweight: true 
      }
    });

    if (unifiedError) {
      console.error('❌ Failed to warm unified products:', unifiedError);
    } else {
      console.log('🔥 Unified products cache warmed');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const result = {
      success: true,
      warming_duration_ms: duration,
      homepage_app: homepageApp?.app_name || 'None configured',
      products_warmed: products?.length || 0,
      search_warmed: !searchError,
      unified_warmed: !unifiedError,
      cache_warmed_at: new Date().toISOString()
    };

    console.log(`🔥 Cache warming completed in ${duration.toFixed(2)}ms`, result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Cache warmer error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});