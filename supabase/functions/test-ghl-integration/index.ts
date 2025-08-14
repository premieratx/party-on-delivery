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

    // Try to read optional phone/email/message from request body
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      // no body provided
    }

    const inputPhone: string | undefined = body?.phone;
    const inputEmail: string | undefined = body?.email;
    const inputMessage: string | undefined = body?.message;

    // Helper: format phone to E.164 (default to +1 if 10 digits provided)
    const formatPhone = (p?: string | null) => {
      if (!p) return null;
      const digits = p.replace(/\D/g, '');
      if (p.startsWith('+')) return p;
      if (digits.length === 10) return `+1${digits}`;
      return `+${digits}`; // fallback
    };

    // Test phone number (fallback to default if none provided)
    const testPhone = formatPhone(inputPhone) || "+15125767975";

    const testMessage = (inputMessage || `🎉 GHL Integration Test - ${new Date().toLocaleString()}

This is a test message to verify the GHL/Leadconnector SMS integration is working properly.

Test Details:
- Function: test-ghl-integration
- Time: ${new Date().toISOString()}
- Status: Integration Active ✅
${inputEmail ? `- Email: ${inputEmail}` : ''}

If you received this message, the SMS integration is functioning correctly!`).toString();

    logStep('Creating/finding contact first');

    // First, try to find or create a contact
    let contactId = null;
    
    // Try to find existing contact by phone
    const searchResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?phone=${encodeURIComponent(testPhone)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Version": "2021-07-28"
      }
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.contact) {
        contactId = searchResult.contact.id;
        logStep('Found existing contact', { contactId });
      }
    }

    // If no contact found, create one
    if (!contactId) {
      logStep('Creating new contact');
      const createContactResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ghlApiKey}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify({
          phone: testPhone,
          email: inputEmail || "test@partyondelivery.com",
          firstName: "Test",
          lastName: "User"
        })
      });

      if (createContactResponse.ok) {
        const newContact = await createContactResponse.json();
        contactId = newContact.contact?.id;
        logStep('Created new contact', { contactId });
      }
    }

    logStep('Attempting to send test SMS via GHL API', { contactId });

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
        contactId: contactId,
        message: testMessage
      })
    });

    const smsResult = await smsResponse.json();
    
    if (!smsResponse.ok) {
      logStep('GHL SMS API error', { status: smsResponse.status, error: smsResult });
      throw new Error(`GHL SMS API error: ${smsResult.message || 'Unknown error'}`);
    }

    logStep('GHL SMS sent successfully', smsResult);

    logStep('GHL integration test completed successfully');

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
          contactManagement: {
            status: "success",
            contactId: contactId
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