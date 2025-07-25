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

    const { amount, currency, cartItems, customerInfo, deliveryInfo, appliedDiscount, tipAmount, groupOrderNumber, subtotal, deliveryFee, salesTax, groupOrderToken } = await req.json();
    
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

    // CRITICAL: Amount validation - frontend sends amount in CENTS
    const validAmount = Math.round(amount);
    if (validAmount !== amount) {
      logStep("Amount rounded", { originalAmount: amount, validAmount });
    }
    
    // CRITICAL: Cross-verify with breakdown to prevent 100x errors
    const validSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0;
    const validDeliveryFee = typeof deliveryFee === 'number' && !isNaN(deliveryFee) ? deliveryFee : 0;
    const validSalesTax = typeof salesTax === 'number' && !isNaN(salesTax) ? salesTax : 0;
    const validTipAmount = typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : 0;
    
    // Calculate expected amount in cents from breakdown
    const expectedAmountInCents = Math.round((validSubtotal + validDeliveryFee + validSalesTax + validTipAmount) * 100);
    
    // Verify amount matches breakdown (allow 1 cent variance for rounding)
    if (Math.abs(validAmount - expectedAmountInCents) > 1) {
      throw new Error(`CRITICAL AMOUNT MISMATCH: Received ${validAmount} cents but breakdown totals ${expectedAmountInCents} cents. Subtotal: $${validSubtotal}, Delivery: $${validDeliveryFee}, Tax: $${validSalesTax}, Tip: $${validTipAmount}`);
    }
    
    // Prevent unreasonable amounts (between $0.50 and $10,000)
    if (validAmount < 50 || validAmount > 1000000) {
      throw new Error(`Invalid amount: ${validAmount} cents ($${(validAmount/100).toFixed(2)}). Amount must be between $0.50 and $10,000.`);
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
      subtotalFromMetadata: validSubtotal.toFixed(2),
      salesTaxFromMetadata: validSalesTax.toFixed(2),
      shippingFeeFromMetadata: validDeliveryFee.toFixed(2),
      tipFromMetadata: validTipAmount.toFixed(2)
    });
    
    // CRITICAL FIX: Store the full cart items as JSON string in metadata
    // This is essential for create-shopify-order to access the complete cart data
    const cartItemsJson = JSON.stringify(cartItems);
    logStep("Cart items being stored in metadata", { cartItemsLength: cartItemsJson.length, itemCount });
    
    // Create payment intent with essential metadata (including full cart items)
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
        cart_items: cartItemsJson, // CRITICAL: Full cart items for Shopify order creation
        item_count: itemCount.toString(),
        subtotal: validSubtotal.toFixed(2),
        shipping_fee: validDeliveryFee.toFixed(2),
        sales_tax: validSalesTax.toFixed(2),
        tip_amount: validTipAmount.toFixed(2),
        total_amount: (validSubtotal + validDeliveryFee + validSalesTax + validTipAmount).toFixed(2),
        discount_code: (appliedDiscount?.code || 'none').substring(0, 50),
        discount_type: (appliedDiscount?.type || 'none').substring(0, 20),
        discount_value: (appliedDiscount?.value?.toString() || '0').substring(0, 10),
        discount_amount: (appliedDiscount?.type === 'percentage' ? (validSubtotal * (appliedDiscount.value / 100)).toFixed(2) : '0'),
        group_order_number: (groupOrderNumber || '').substring(0, 50),
        group_order_token: (groupOrderToken || '').substring(0, 50)
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