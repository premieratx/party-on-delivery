import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}][STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== STRIPE WEBHOOK RECEIVED ===");

    // Validate environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !webhookSecret) {
      logStep("ERROR: Stripe credentials not configured");
      throw new Error("Stripe credentials not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: Missing Stripe signature");
      throw new Error("Missing Stripe signature");
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified successfully", { eventType: event.type });
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      logStep("Processing payment_intent.succeeded", {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
        metadataKeys: Object.keys(paymentIntent.metadata || {})
      });

      // Trigger Shopify order creation
      await createShopifyOrderFromPayment(paymentIntent, supabaseUrl, supabaseServiceKey);
      
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        paymentStatus: session.payment_status,
        metadataKeys: Object.keys(session.metadata || {})
      });

      // Only create order if payment was successful
      if (session.payment_status === 'paid') {
        await createShopifyOrderFromSession(session, supabaseUrl, supabaseServiceKey);
      } else {
        logStep("Checkout session not paid, skipping order creation", { 
          paymentStatus: session.payment_status 
        });
      }
      
    } else {
      logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("=== WEBHOOK ERROR ===", {
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        received: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Create Shopify order from PaymentIntent
async function createShopifyOrderFromPayment(paymentIntent: Stripe.PaymentIntent, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    logStep("Calling create-shopify-order function", { paymentIntentId: paymentIntent.id });
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabaseClient.functions.invoke('create-shopify-order', {
      body: {
        paymentIntentId: paymentIntent.id,
        source: 'stripe_webhook'
      }
    });

    if (error) {
      logStep("ERROR: Shopify order creation failed", { error: error.message });
      throw error;
    }

    logStep("Shopify order created successfully from webhook", { 
      result: data,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    logStep("ERROR: Failed to create Shopify order from PaymentIntent", {
      paymentIntentId: paymentIntent.id,
      error: error.message
    });
    throw error;
  }
}

// Create Shopify order from Checkout Session
async function createShopifyOrderFromSession(session: Stripe.Checkout.Session, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    logStep("Calling create-shopify-order function", { sessionId: session.id });
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabaseClient.functions.invoke('create-shopify-order', {
      body: {
        sessionId: session.id,
        source: 'stripe_webhook'
      }
    });

    if (error) {
      logStep("ERROR: Shopify order creation failed", { error: error.message });
      throw error;
    }

    logStep("Shopify order created successfully from webhook", { 
      result: data,
      sessionId: session.id
    });

  } catch (error) {
    logStep("ERROR: Failed to create Shopify order from Checkout Session", {
      sessionId: session.id,
      error: error.message
    });
    throw error;
  }
}