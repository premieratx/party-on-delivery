import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('[ENHANCED-ABANDONED] Processing abandoned order logic');

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { sessionId, customerEmail, cartItems, action = 'track_abandoned' } = body;

    if (action === 'track_abandoned') {
      // Check if this session already has a completed order
      const { data: existingOrder } = await supabase
        .from('customer_orders')
        .select('id, status')
        .eq('session_id', sessionId)
        .in('status', ['completed', 'confirmed', 'delivered'])
        .single();

      if (existingOrder) {
        console.log('[ENHANCED-ABANDONED] Session already has completed order, skipping abandoned tracking');
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: 'Order already completed'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Create or update abandoned order entry
      const abandonedOrderData = {
        session_id: sessionId,
        customer_email: customerEmail,
        customer_name: body.customerName || '',
        customer_phone: body.customerPhone || '',
        delivery_address: body.deliveryAddress || '',
        cart_items: cartItems,
        subtotal: body.subtotal || 0,
        total_amount: body.totalAmount || 0,
        affiliate_code: body.affiliateCode || null,
        abandoned_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        contains_payment_info: body.containsPaymentInfo || false
      };

      const { data, error } = await supabase
        .from('abandoned_orders')
        .upsert(abandonedOrderData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('[ENHANCED-ABANDONED] Error creating abandoned order:', error);
        throw error;
      }

      console.log('[ENHANCED-ABANDONED] Abandoned order tracked successfully');

      return new Response(JSON.stringify({ 
        success: true, 
        abandonedOrderId: data.id,
        message: 'Abandoned order tracked'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'convert_to_completed') {
      // This action removes abandoned order when converting to completed
      const { orderId } = body;

      // First, get the order details
      const { data: order } = await supabase
        .from('customer_orders')
        .select('session_id')
        .eq('id', orderId)
        .single();

      if (order) {
        // Remove any abandoned order with the same session_id
        const { error: deleteError } = await supabase
          .from('abandoned_orders')
          .delete()
          .eq('session_id', order.session_id);

        if (deleteError) {
          console.error('[ENHANCED-ABANDONED] Error removing abandoned order:', deleteError);
        } else {
          console.log('[ENHANCED-ABANDONED] Removed abandoned order for completed session:', order.session_id);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Converted abandoned to completed'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('[ENHANCED-ABANDONED] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});