import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Triggering discount codes sync...');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Call the fetch-shopify-discounts function
    const { data, error } = await supabase.functions.invoke('fetch-shopify-discounts', {
      body: { activeOnly: true, includeExpired: false }
    });

    if (error) {
      console.error('❌ Error syncing discount codes:', error);
      throw error;
    }

    console.log('✅ Discount codes synced successfully:', data);

    // Return the synced codes
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Discount codes synced successfully',
        data: data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('🚨 Error in sync process:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});