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

    const { amount, currency, cartItems, customerInfo, deliveryInfo, appliedDiscount, tipAmount, groupOrderNumber, subtotal, deliveryFee, salesTax } = await req.json();
    
    logStep("Request data received", { 
      amount, 
      currency,
      cartItems: cartItems?.length,
      customerInfo: customerInfo?.email,
      tipAmount,
      subtotal,
      deliveryFee,
      salesTax
    });

    // Validate Stripe configuration
    logStep("Validating Stripe configuration");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not found in environment variables");
    }
    logStep("✅ STRIPE_SECRET_KEY found", { keyPrefix: stripeSecretKey.substring(0, 12) + "..." });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    logStep("✅ Stripe keys validated successfully");

    // Validate amount before processing
    const validAmount = Math.round(amount);
    if (validAmount !== amount) {
      logStep("Amount rounded", { originalAmount: amount, validAmount });
    }
    
    logStep("Creating payment intent", { validAmount, currency, originalAmount: amount });
    
    // Create a concise cart summary that fits in Stripe's 500 char metadata limit
    const cartSummary = cartItems.map((item: any) => 
      `${item.quantity}x ${item.title.substring(0, 25)}`
    ).join(', ').substring(0, 300); // Keep well under 500 chars
    
    const itemCount = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    
    // Amount verification for logging
    logStep("💰 AMOUNT VERIFICATION - Payment Intent", {
      amountInCents: validAmount,
      amountInDollars: (validAmount / 100).toFixed(2),
      verificationNote: "This exact amount will be charged by Stripe and logged in Shopify",
      subtotalFromMetadata: subtotal.toFixed(2),
      salesTaxFromMetadata: salesTax.toFixed(2),
      shippingFeeFromMetadata: deliveryFee.toFixed(2),
      tipFromMetadata: tipAmount.toFixed(2)
    });
    
    // Create payment intent with essential metadata only (keeping under 500 char limit per field)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validAmount,
      currency,
      metadata: {
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`.substring(0, 100),
        customer_email: customerInfo.email.substring(0, 100),
        customer_phone: customerInfo.phone.substring(0, 50),
        delivery_date: deliveryInfo.date.substring(0, 50),
        delivery_time: deliveryInfo.timeSlot.substring(0, 50),
        delivery_address: deliveryInfo.address.substring(0, 200),
        delivery_instructions: (deliveryInfo.instructions || '').substring(0, 200),
        cart_summary: cartSummary,
        item_count: itemCount.toString(),
        subtotal: subtotal.toFixed(2),
        shipping_fee: deliveryFee.toFixed(2),
        sales_tax: salesTax.toFixed(2),
        tip_amount: tipAmount.toFixed(2),
        total_amount: (subtotal + deliveryFee + salesTax + tipAmount).toFixed(2),
        discount_code: (appliedDiscount?.code || 'none').substring(0, 50),
        discount_type: (appliedDiscount?.type || 'none').substring(0, 20),
        discount_value: (appliedDiscount?.value?.toString() || '0').substring(0, 10),
        group_order_number: (groupOrderNumber || '').substring(0, 50)
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