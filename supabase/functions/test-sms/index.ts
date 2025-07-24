import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing SMS functionality...');
    
    const testMessage = `Thank you for ordering from Party On Delivery, we've got your order! Add more items with FREE shipping using code PREMIER2025: https://party-on-delivery.lovable.app`;
    
    const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ghl-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        phone: '5125767975',
        message: testMessage
      })
    });

    const result = await smsResponse.json();
    
    return new Response(
      JSON.stringify({ 
        success: smsResponse.ok,
        status: smsResponse.status,
        result: result,
        message: 'Test SMS sent'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Test SMS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});