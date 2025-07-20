import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { amount, currency, cartItems, customerInfo, deliveryInfo, appliedDiscount, tipAmount, groupOrderNumber } = await req.json();
    
    logStep("Request data received", { 
      amount, 
      currency,
      cartItems: cartItems?.length,
      customerInfo: customerInfo?.email,
      tipAmount 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    logStep("Stripe initialized");

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_date: deliveryInfo.date,
        delivery_time: deliveryInfo.timeSlot,
        delivery_address: deliveryInfo.address,
        delivery_instructions: deliveryInfo.instructions || '',
        cart_items: JSON.stringify(cartItems.map((item: any) => ({
          name: item.title,
          quantity: item.quantity,
          price: item.price
        }))),
        tip_amount: tipAmount.toString(),
        discount_code: appliedDiscount?.code || 'none',
        group_order_number: groupOrderNumber || ''
      }
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount 
    });

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-intent", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});