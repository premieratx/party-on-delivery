import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('get-group-order function called');
    
    // Handle both POST and GET requests
    let shareToken;
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Request body:', body);
      shareToken = body.shareToken;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      shareToken = url.searchParams.get('shareToken');
      console.log('Query param shareToken:', shareToken);
    }
    
    if (!shareToken) {
      console.error('No shareToken provided');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Share token is required' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('Looking for order with share token:', shareToken);

    // Find the original group order by share token - use maybeSingle to avoid errors
    const { data: originalOrder, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('share_token', shareToken)
      .maybeSingle();

    console.log('Order query result:', { originalOrder: !!originalOrder, orderError });

    if (orderError) {
      console.error('Database error finding order:', orderError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database error: ' + orderError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!originalOrder) {
      console.log('No order found with share token:', shareToken);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Group order not found' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log('Found order, getting customer for ID:', originalOrder.customer_id);

    // Get the customer who created the original order - use maybeSingle to avoid errors
    const { data: originalCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', originalOrder.customer_id)
      .maybeSingle();

    console.log('Customer query result:', { originalCustomer: !!originalCustomer, customerError });

    if (customerError) {
      console.error('Database error finding customer:', customerError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database error: ' + customerError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!originalCustomer) {
      console.log('No customer found with ID:', originalOrder.customer_id);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Original customer not found' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const response = {
      success: true,
      originalOrder: {
        id: originalOrder.id,
        order_number: originalOrder.order_number,
        delivery_date: originalOrder.delivery_date,
        delivery_time: originalOrder.delivery_time,
        delivery_address: originalOrder.delivery_address,
        share_token: originalOrder.share_token,
        customer_name: `${originalCustomer.first_name || ''} ${originalCustomer.last_name || ''}`.trim(),
        customer_email: originalCustomer.email,
        total_amount: originalOrder.total_amount,
        subtotal: originalOrder.subtotal,
        line_items: originalOrder.line_items
      }
    };

    console.log('Returning successful response');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error in get-group-order:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to get group order' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});