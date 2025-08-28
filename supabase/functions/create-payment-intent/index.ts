import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced logging function
async function logEvent(supabase: any, eventType: string, operation: string, data: any, error?: any, executionTime?: number) {
  try {
    await supabase.rpc('log_system_event', {
      p_event_type: eventType,
      p_service_name: 'stripe_payment_intent',
      p_operation: operation,
      p_request_data: data,
      p_error_details: error,
      p_execution_time_ms: executionTime,
      p_severity: error ? 'error' : 'info'
    });
  } catch (logError) {
    console.error('Failed to log event:', logError);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { 
      amount, 
      currency = 'usd', 
      cartItems, 
      customerInfo, 
      deliveryInfo, 
      appliedDiscount, 
      tipAmount,
      subtotal,
      deliveryFee,
      salesTax,
      affiliateCode
    } = await req.json();

    console.log('💰 Creating payment intent for amount:', amount, 'cents');
    
    // Initialize Supabase and Stripe
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Log payment intent initiation
    await logEvent(supabase, 'payment_intent_initiated', 'create_intent', {
      amount,
      currency,
      cart_items_count: cartItems?.length || 0,
      customer_email: customerInfo?.email,
      affiliate_code: affiliateCode
    });

    // Enhanced amount validation with detailed logging
    console.log('💰 Payment Intent Amount Details:', {
      received_amount: amount,
      amount_in_cents: amount,
      amount_in_dollars: (amount / 100).toFixed(2),
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      sales_tax: salesTax,
      tip_amount: tipAmount,
      calculated_total: subtotal + deliveryFee + salesTax + tipAmount,
      calculated_total_cents: Math.round((subtotal + deliveryFee + salesTax + tipAmount) * 100)
    });

    // Verify amount matches expected calculation
    const expectedAmountCents = Math.round((subtotal + deliveryFee + salesTax + tipAmount) * 100);
    if (Math.abs(amount - expectedAmountCents) > 1) {
      throw new Error(`Amount mismatch: Received ${amount} cents but expected ${expectedAmountCents} cents based on breakdown`);
    }

    if (!amount || amount < 50 || amount > 1000000) {
      throw new Error(`Invalid amount: ${amount}. Must be between 50 and 1000000 cents.`);
    }

    // Store order draft with correct column structure
    const orderDraft = {
      draft_data: {
        currency: currency,
        cart_items: cartItems,
        customer_info: customerInfo,
        delivery_info: deliveryInfo,
        applied_discount: appliedDiscount,
        tip_amount: tipAmount,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        sales_tax: salesTax,
        affiliate_code: affiliateCode
      },
      total_amount: amount / 100, // Convert cents to dollars for storage
      customer_email: customerInfo?.email || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: draftData, error: draftError } = await supabase
      .from('order_drafts')
      .insert(orderDraft)
      .select()
      .single();

    if (draftError) {
      console.error('Failed to store order draft:', draftError);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_draft_id: draftData?.id || 'unknown',
        affiliate_code: (affiliateCode || '').substring(0, 100),
        customer_email: (customerInfo?.email || '').substring(0, 100),
        customer_name: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim().substring(0, 100),
        customer_phone: (customerInfo?.phone || '').substring(0, 20),
        
        // Delivery info with proper CST formatting
        delivery_date: (deliveryInfo?.date || '').substring(0, 50),
        delivery_time: (deliveryInfo?.timeSlot || '').substring(0, 50),
        delivery_timezone: 'America/Chicago', // Ensure CST timezone is documented
        delivery_address: (deliveryInfo?.address || '').substring(0, 250),
        delivery_instructions: (deliveryInfo?.instructions || '').substring(0, 250),
        
        // Order breakdown
        items_count: (cartItems?.length || 0).toString(),
        item_summary: cartItems?.slice(0, 2).map(item => item.title || 'Item').join(', ').substring(0, 200) + (cartItems?.length > 2 ? '...' : ''),
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        sales_tax: salesTax.toFixed(2),
        tip_amount: tipAmount.toFixed(2),
        total_amount: (amount / 100).toFixed(2)
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Payment intent creation failed:', error);
    
    // Log the error for debugging
    const executionTime = Date.now() - startTime;
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await logEvent(supabase, 'payment_intent_failed', 'create_intent', {}, { 
        error: error.message,
        stack: error.stack 
      }, executionTime);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});