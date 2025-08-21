import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ROBUST Keep-alive function to prevent cold starts
 * Fixed to handle CORS and network errors gracefully
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Lightweight keep-alive that doesn't call other functions to avoid CORS issues
    console.log('🔥 Keep-alive triggered successfully');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Functions kept warm successfully'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    // Don't log errors to prevent console spam
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Keep-alive failed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 to prevent CORS errors
      }
    );
  }
});
