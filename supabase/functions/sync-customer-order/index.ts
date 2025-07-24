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

    const { sessionId, orderData } = await req.json()

    console.log('Syncing customer order for session:', sessionId)

    // Get session data from Stripe (this would typically be done in create-shopify-order)
    // For now, we'll work with the provided order data

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
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: orderData.customerEmail,
          first_name: orderData.customerName?.split(' ')[0] || null,
          last_name: orderData.customerName?.split(' ').slice(1).join(' ') || null,
          phone: orderData.customerPhone,
          total_orders: 1,
          total_spent: orderData.totalAmount,
          referred_by_code: orderData.affiliateCode,
          referred_by_affiliate_id: orderData.affiliateId
        })
        .select()
        .single()

      if (customerError) throw customerError
      customer = newCustomer
    }

    // Create customer order record
    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_id: customer.id,
        order_number: orderData.orderNumber,
        shopify_order_id: orderData.shopifyOrderId,
        session_id: sessionId,
        status: 'confirmed',
        subtotal: orderData.subtotal,
        delivery_fee: orderData.deliveryFee || 0,
        total_amount: orderData.totalAmount,
        delivery_date: orderData.deliveryDate,
        delivery_time: orderData.deliveryTime,
        delivery_address: {
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          instructions: orderData.deliveryAddress.instructions
        },
        special_instructions: orderData.specialInstructions,
        line_items: orderData.lineItems,
        affiliate_code: orderData.affiliateCode,
        affiliate_id: orderData.affiliateId
      })
      .select()
      .single()

    if (orderError) throw orderError

    console.log('Customer order synced successfully:', customerOrder.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: customer.id,
        orderId: customerOrder.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error syncing customer order:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})