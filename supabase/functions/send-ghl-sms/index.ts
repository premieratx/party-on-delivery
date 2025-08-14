import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-GHL-SMS] ${step}:`, details || '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, type = 'customer_notification' } = await req.json();
    
    if (!phone || !message) {
      throw new Error("Phone number and message are required");
    }

    logStep('Sending SMS via GHL', { phone, messageLength: message.length, type });

    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    if (!ghlApiKey) {
      throw new Error("GHL_API_KEY not configured");
    }

    // Format phone number (ensure it has country code)
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    logStep('Finding or creating contact first');

    // First, try to find or create a contact
    let contactId = null;
    
    // Try to find existing contact by phone
    const searchResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?phone=${encodeURIComponent(formattedPhone)}`, {
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
      logStep('Creating new contact for SMS');
      const createContactResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ghlApiKey}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify({
          phone: formattedPhone,
          firstName: "Customer",
          lastName: "SMS"
        })
      });

      if (createContactResponse.ok) {
        const newContact = await createContactResponse.json();
        contactId = newContact.contact?.id;
        logStep('Created new contact', { contactId });
      }
    }

    logStep('Sending SMS to contact', { formattedPhone, contactId });

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
        message: message
      })
    });

    const smsResult = await smsResponse.json();
    
    if (!smsResponse.ok) {
      logStep('GHL SMS API error', { 
        status: smsResponse.status, 
        error: smsResult,
        phone: formattedPhone
      });
      throw new Error(`GHL SMS API error: ${smsResult.message || 'Unknown error'}`);
    }

    logStep('SMS sent successfully via GHL', {
      messageId: smsResult.messageId || smsResult.id,
      phone: formattedPhone,
      type
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: smsResult.messageId || smsResult.id,
        phone: formattedPhone,
        type,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep('Error sending SMS', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to send SMS",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});