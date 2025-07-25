import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone: string;
  message: string;
  contactId?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[GHL SMS] ${step}:`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting GHL SMS send');
    
    const { phone, message, contactId }: SMSRequest = await req.json();
    
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    if (!ghlApiKey) {
      logStep('Missing GHL API key');
      return new Response(
        JSON.stringify({ error: 'GHL API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep('Sending SMS via GHL', { phone, messageLength: message.length });

    // Send SMS using GHL LeadConnector API - Updated endpoint and format
    const ghlResponse = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId || undefined,
        message: message,
        ...(contactId ? { contactId } : { phone })
      })
    });

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      logStep('GHL API error', { status: ghlResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS via GHL',
          details: errorText 
        }),
        { 
          status: ghlResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await ghlResponse.json();
    logStep('SMS sent successfully', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        data: result 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    logStep('Error in send-ghl-sms function', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});