import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    // Parse request body
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

    console.log('💰 Creating payment intent:', { 
      amount, 
      currency, 
      itemCount: cartItems?.length,
      customerEmail: customerInfo?.email 
    });

    // Validate amount (critical security check)
    const expectedTotal = (subtotal || 0) + (deliveryFee || 0) + (salesTax || 0) + (tipAmount || 0);
    const amountInDollars = amount / 100;
    
    if (Math.abs(amountInDollars - expectedTotal) > 0.01) {
      throw new Error(`Amount verification failed: Expected $${expectedTotal.toFixed(2)}, got $${amountInDollars.toFixed(2)}`);
    }

    // Sanity check amounts
    if (amount < 50 || amount > 1000000) { // $0.50 to $10,000.00
      throw new Error(`Invalid amount: $${amountInDollars.toFixed(2)}. Must be between $0.50 and $10,000.00`);
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Store order details in Supabase (due to Stripe metadata limitations)
    const orderDraftData = {
      cart_items: cartItems,
      customer_info: customerInfo,
      delivery_info: deliveryInfo,
      applied_discount: appliedDiscount,
      tip_amount: tipAmount,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      sales_tax: salesTax,
      affiliate_code: affiliateCode,
      total_amount: amountInDollars,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    let orderDraftId = null;
    try {
      const { data: orderDraft, error: orderError } = await supabase
        .from('order_drafts')
        .insert(orderDraftData)
        .select()
        .single();

      if (orderError) {
        console.log('Failed to create order draft, continuing without it:', orderError);
      } else {
        orderDraftId = orderDraft.id;
        console.log('✅ Order draft created:', orderDraftId);
      }
    } catch (err) {
      console.log('Order draft creation failed, continuing:', err);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        order_draft_id: orderDraftId || '',
        customer_email: customerInfo?.email || '',
        affiliate_code: affiliateCode || '',
        order_type: 'delivery',
        cart_item_count: cartItems?.length || 0
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});