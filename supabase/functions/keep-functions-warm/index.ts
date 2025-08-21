import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Keep-alive function to prevent cold starts
 * This function will be called every 5 minutes to keep edge functions warm
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 Keep-alive function triggered at:', new Date().toISOString());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Warm up critical functions by calling them
    const warmupTasks = [
      // Warm up get-all-collections
      supabase.functions.invoke('get-all-collections', {
        body: { source: 'keep-alive' }
      }),
      
      // Warm up validate-promo-code
      supabase.functions.invoke('validate-promo-code', {
        body: { code: 'KEEPALIVE', source: 'keep-alive' }
      }),
      
      // Warm up get-dashboard-data
      supabase.functions.invoke('get-dashboard-data', {
        body: { type: 'admin', source: 'keep-alive' }
      }),
      
      // Warm up verify-admin-google
      supabase.functions.invoke('verify-admin-google', {
        body: { email: 'keepalive@test.com', source: 'keep-alive' }
      })
    ];

    // Execute warmup tasks with proper error handling
    const results = await Promise.allSettled(warmupTasks);
    
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`✅ Function ${index + 1} warmed successfully`);
      } else {
        errorCount++;
        console.log(`⚠️ Function ${index + 1} warmup failed:`, result.reason);
      }
    });

    // Update keep-alive trigger in database
    const { error: triggerError } = await supabase.rpc('trigger_keep_alive');
    if (triggerError) {
      console.warn('Failed to update keep-alive trigger:', triggerError);
    }

    console.log(`🎯 Keep-alive complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        warmed_functions: successCount,
        failed_functions: errorCount,
        message: 'Functions kept warm successfully'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Keep-alive function failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Don't fail the keep-alive itself
      }
    );
  }
});
