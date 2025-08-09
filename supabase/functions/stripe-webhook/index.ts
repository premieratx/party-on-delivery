import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  if (!stripeSecret || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

  // Supabase client (service role) for downstream calls
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const sig = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");
    if (!sig) throw new Error("Missing Stripe-Signature header");

    const bodyText = await req.text();
    const event = await stripe.webhooks.constructEventAsync(bodyText, sig, webhookSecret);

    log("Event received", { id: event.id, type: event.type });

    // Handle only the success events for order creation
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = (session.payment_intent as string) || undefined;

      // Fire-and-forget: let existing function create Shopify order + DB records
      // Use background task to avoid blocking the webhook response
      // Passing both session id and payment intent id for idempotency
      EdgeRuntime.waitUntil(
        (async () => {
          try {
            log("Invoking create-shopify-order", { sessionId: session.id, paymentIntentId });
            const { data, error } = await supabase.functions.invoke("create-shopify-order", {
              body: { sessionId: session.id, paymentIntentId, trigger: "checkout.session.completed" },
            });
            if (error) log("create-shopify-order error", { error });
            else log("create-shopify-order result", data);
          } catch (err) {
            log("invoke error", { message: err instanceof Error ? err.message : String(err) });
          }
        })()
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const sessionId = (pi.latest_charge as any)?.metadata?.checkout_session_id || undefined;

      EdgeRuntime.waitUntil(
        (async () => {
          try {
            log("Invoking create-shopify-order (from PI)", { sessionId, paymentIntentId: pi.id });
            const { data, error } = await supabase.functions.invoke("create-shopify-order", {
              body: { paymentIntentId: pi.id, sessionId, trigger: "payment_intent.succeeded" },
            });
            if (error) log("create-shopify-order error", { error });
            else log("create-shopify-order result", data);
          } catch (err) {
            log("invoke error", { message: err instanceof Error ? err.message : String(err) });
          }
        })()
      );
    }
    
    if (event.type === "charge.succeeded") {
      // Ignore charge.succeeded to prevent duplicate order creation
      // We handle order creation on payment_intent.succeeded and checkout.session.completed only
      const charge = event.data.object as any;
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : undefined;
      log("Skipping create-shopify-order for charge.succeeded to avoid duplicates", { paymentIntentId: piId });
    }

    // Acknowledge immediately
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
