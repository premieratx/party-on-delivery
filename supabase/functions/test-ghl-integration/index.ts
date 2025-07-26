import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[TEST-GHL-INTEGRATION] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting GHL integration test');

    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    if (!ghlApiKey) {
      throw new Error("GHL_API_KEY not configured");
    }

    // Test phone number (replace with actual test number)
    const testPhone = "+15125767975";
    const testMessage = `🎉 GHL Integration Test - ${new Date().toLocaleString()}

This is a test message to verify the GHL/Leadconnector SMS integration is working properly.

Test Details:
- Function: test-ghl-integration
- Time: ${new Date().toISOString()}
- Status: Integration Active ✅

If you received this message, the SMS integration is functioning correctly!`;

    logStep('Attempting to send test SMS via GHL API');

    // Send SMS via GHL API
    const smsResponse = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        type: "SMS",
        contactId: null, // Will be auto-created if not exists
        phone: testPhone,
        message: testMessage
      })
    });

    const smsResult = await smsResponse.json();
    
    if (!smsResponse.ok) {
      logStep('GHL SMS API error', { status: smsResponse.status, error: smsResult });
      throw new Error(`GHL SMS API error: ${smsResult.message || 'Unknown error'}`);
    }

    logStep('GHL SMS sent successfully', smsResult);

    // Test contact search/creation
    logStep('Testing contact search functionality');
    
    const searchResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?phone=${encodeURIComponent(testPhone)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Version": "2021-07-28"
      }
    });

    const searchResult = await searchResponse.json();
    logStep('Contact search result', { status: searchResponse.status, result: searchResult });

    return new Response(
      JSON.stringify({
        success: true,
        message: "GHL integration test completed successfully",
        tests: {
          sms: {
            status: "success",
            phone: testPhone,
            messageId: smsResult.messageId || smsResult.id,
            response: smsResult
          },
          contactSearch: {
            status: searchResponse.ok ? "success" : "error",
            response: searchResult
          }
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error in GHL integration test', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "GHL integration test failed",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});