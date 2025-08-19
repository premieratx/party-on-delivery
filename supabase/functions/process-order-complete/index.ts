import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      payment_intent_id, 
      order_draft_id, 
      customer_email, 
      affiliate_code 
    } = await req.json();

    console.log('📦 Processing order completion:', {
      payment_intent_id,
      order_draft_id,
      customer_email,
      affiliate_code
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the order draft
    const { data: orderDraft, error: draftError } = await supabase
      .from('order_drafts')
      .select('*')
      .eq('id', order_draft_id)
      .single();

    if (draftError || !orderDraft) {
      console.error('Order draft not found:', draftError);
      throw new Error('Order draft not found');
    }

    // Create the final order record
    const orderData = {
      order_number: `ORD-${Date.now()}`,
      customer_id: null, // Will be set if user is authenticated
      session_id: orderDraft.session_id || payment_intent_id,
      subtotal: orderDraft.subtotal,
      delivery_fee: orderDraft.delivery_fee || 0,
      total_amount: orderDraft.amount / 100, // Convert from cents
      delivery_date: orderDraft.delivery_info?.date,
      delivery_time: orderDraft.delivery_info?.timeSlot,
      delivery_address: orderDraft.customer_info,
      line_items: orderDraft.cart_items,
      affiliate_code: orderDraft.affiliate_code,
      status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the order
    const { data: newOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('✅ Order created successfully:', newOrder.id);

    // Optionally invoke Shopify order creation
    try {
      await supabase.functions.invoke('create-shopify-order', {
        body: {
          order_id: newOrder.id,
          customer_info: orderDraft.customer_info,
          line_items: orderDraft.cart_items,
          delivery_info: orderDraft.delivery_info,
          payment_intent_id: payment_intent_id
        }
      });
    } catch (shopifyError) {
      console.log('Shopify order creation failed (non-critical):', shopifyError);
    }

    // Clean up order draft
    await supabase
      .from('order_drafts')
      .delete()
      .eq('id', order_draft_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: newOrder.id,
        order_number: newOrder.order_number
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Order processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});