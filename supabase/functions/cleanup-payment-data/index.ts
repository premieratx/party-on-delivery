import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-PAYMENT-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment data cleanup");

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Run the cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_sensitive_payment_data');
    
    if (cleanupError) {
      logStep("Error during cleanup", cleanupError);
      throw new Error(`Cleanup failed: ${cleanupError.message}`);
    }

    logStep("Payment data cleanup completed successfully");

    // Get cleanup statistics
    const { data: stats } = await supabase
      .from('security_audit_log')
      .select('created_at, details')
      .eq('event_type', 'payment_data_cleanup')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment data cleanup completed successfully',
      lastCleanup: stats?.created_at,
      details: stats?.details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});