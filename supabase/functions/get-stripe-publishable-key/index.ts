import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [GET-STRIPE-KEY] Function called, checking environment...');
    
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    console.log('🔑 [GET-STRIPE-KEY] Key found:', publishableKey ? 'YES (length: ' + publishableKey.length + ')' : 'NO');
    
    if (!publishableKey) {
      console.error('❌ [GET-STRIPE-KEY] No Stripe publishable key configured in environment');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured', debug: 'STRIPE_PUBLISHABLE_KEY environment variable not found' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log('✅ [GET-STRIPE-KEY] Successfully returning publishable key');

    return new Response(
      JSON.stringify({ key: publishableKey }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get Stripe key' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});