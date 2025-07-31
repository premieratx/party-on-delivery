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
    const { shareToken } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the original group order by share token
    const { data: originalOrder, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (orderError || !originalOrder) {
      throw new Error('Group order not found');
    }

    // Get the customer who created the original order
    const { data: originalCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', originalOrder.customer_id)
      .single();

    if (customerError || !originalCustomer) {
      throw new Error('Original customer not found');
    }

    return new Response(JSON.stringify({
      success: true,
      originalOrder: {
        id: originalOrder.id,
        order_number: originalOrder.order_number,
        delivery_date: originalOrder.delivery_date,
        delivery_time: originalOrder.delivery_time,
        delivery_address: originalOrder.delivery_address,
        share_token: originalOrder.share_token,
        customer_name: `${originalCustomer.first_name} ${originalCustomer.last_name}`,
        customer_email: originalCustomer.email,
        total_amount: originalOrder.total_amount,
        subtotal: originalOrder.subtotal,
        line_items: originalOrder.line_items
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-group-order:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to get group order' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});