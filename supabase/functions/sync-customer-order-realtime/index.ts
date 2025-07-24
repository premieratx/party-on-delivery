import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, orderData, paymentIntentId } = await req.json()

    console.log('Syncing customer order for session:', sessionId, 'Payment Intent:', paymentIntentId)

    if (!orderData) {
      throw new Error('Order data is required')
    }

    // Create or get customer
    let customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', orderData.customerEmail)
      .maybeSingle()

    if (existingCustomer) {
      customer = existingCustomer
      // Update customer stats
      await supabase
        .from('customers')
        .update({
          total_orders: existingCustomer.total_orders + 1,
          total_spent: Number(existingCustomer.total_spent) + Number(orderData.totalAmount),
          last_login_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          email: orderData.customerEmail,
          first_name: orderData.customerName.split(' ')[0],
          last_name: orderData.customerName.split(' ').slice(1).join(' '),
          phone: orderData.customerPhone,
          total_orders: 1,
          total_spent: Number(orderData.totalAmount),
          session_tokens: sessionId ? [sessionId] : [],
          last_login_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError
      customer = newCustomer
    }

    // Create order record
    const orderRecord = {
      customer_id: customer.id,
      order_number: orderData.orderNumber || `ORD-${Date.now()}`,
      status: 'confirmed',
      total_amount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      delivery_fee: Number(orderData.shippingFee || 0),
      delivery_date: orderData.deliveryDate,
      delivery_time: orderData.deliveryTime,
      delivery_address: {
        street: orderData.deliveryAddress,
        city: orderData.deliveryCity || '',
        state: orderData.deliveryState || '',
        zipCode: orderData.deliveryZip || '',
        instructions: orderData.deliveryInstructions || ''
      },
      line_items: orderData.lineItems || [],
      session_id: sessionId || paymentIntentId,
      shopify_order_id: orderData.shopifyOrderId,
      affiliate_code: orderData.discountCode || orderData.affiliateCode,
      special_instructions: orderData.deliveryInstructions,
      share_token: crypto.randomUUID(),
      is_shareable: true,
      group_order_id: crypto.randomUUID(),
      is_group_order: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert(orderRecord)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw orderError
    }

    console.log('Order created successfully:', newOrder.id)

    // Link session to customer if provided
    if (sessionId && customer.id) {
      const sessionTokens = customer.session_tokens || []
      if (!sessionTokens.includes(sessionId)) {
        await supabase
          .from('customers')
          .update({
            session_tokens: [...sessionTokens, sessionId]
          })
          .eq('id', customer.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: customer.id,
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
        shareToken: newOrder.share_token
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in sync-customer-order-realtime:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})