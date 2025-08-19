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

    // Validate amount
    if (!amount || amount < 50 || amount > 1000000) {
      throw new Error(`Invalid amount: ${amount}. Must be between 50 and 1000000 cents.`);
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase for order storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store order draft
    const orderDraft = {
      amount: amount,
      currency: currency,
      cart_items: cartItems,
      customer_info: customerInfo,
      delivery_info: deliveryInfo,
      applied_discount: appliedDiscount,
      tip_amount: tipAmount,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      sales_tax: salesTax,
      affiliate_code: affiliateCode,
      created_at: new Date().toISOString(),
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
        affiliate_code: affiliateCode || '',
        customer_email: customerInfo?.email || '',
        delivery_date: deliveryInfo?.date || '',
        delivery_time: deliveryInfo?.timeSlot || '',
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
    console.error('Payment intent creation failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});