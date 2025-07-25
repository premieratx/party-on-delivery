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
    
    // First, let's try to find or create a contact for this phone number
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    
    // Try to find existing contact by phone
    let contactId;
    try {
      const searchResponse = await fetch('https://services.leadconnectorhq.com/contacts/search/duplicate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          phone: '5125767975'
        })
      });
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.contact) {
          contactId = searchResult.contact.id;
          console.log('Found existing contact:', contactId);
        }
      }
    } catch (e) {
      console.log('Contact search failed, will create new contact');
    }
    
    // If no contact found, create one
    if (!contactId) {
      try {
        const createResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'Contact',
            phone: '5125767975',
            email: 'test@partyondelivery.com'
          })
        });
        
        if (createResponse.ok) {
          const createResult = await createResponse.json();
          contactId = createResult.contact.id;
          console.log('Created new contact:', contactId);
        }
      } catch (e) {
        console.log('Contact creation failed');
      }
    }

    const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ghl-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        phone: '5125767975',
        message: testMessage,
        contactId: contactId
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