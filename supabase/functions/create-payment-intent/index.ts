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

    const body = await req.json();
    logStep("Raw request body received", { bodyKeys: Object.keys(body) });
    
    const { amount, currency, cartItems, customerInfo, deliveryInfo, appliedDiscount, tipAmount, groupOrderNumber, subtotal, deliveryFee, salesTax, groupOrderToken } = body;
    
    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Cart items are required and must be a non-empty array");
    }
    
    if (!customerInfo || !customerInfo.email) {
      throw new Error("Customer information with email is required");
    }
    
    if (!deliveryInfo || !deliveryInfo.address) {
      throw new Error("Delivery information with address is required");
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Must be a positive number in cents.`);
    }
    
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
    
    // CRITICAL FIX: Create a compact cart summary for metadata (Stripe limit: 500 chars per field)
    // Store full cart data in a separate field that we'll pass to create-shopify-order
    const cartItemsJson = JSON.stringify(cartItems);
    logStep("Cart items data prepared", { cartItemsLength: cartItemsJson.length, itemCount });
    
    // Safely handle metadata to prevent errors
    const customerName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
    const customerPhone = customerInfo.phone || '';
    const deliveryDate = deliveryInfo.date || '';
    const deliveryTime = deliveryInfo.timeSlot || '';
    const deliveryAddress = deliveryInfo.address || '';
    const deliveryInstructions = deliveryInfo.instructions || '';
    
    // Create a very compact cart items string that fits in 500 chars
    const compactCartItems = cartItems.map((item: any) => 
      `${item.quantity}x${item.title.substring(0, 15)}`
    ).join(',').substring(0, 450); // Keep well under 500 char limit
    
    logStep("Preparing metadata for payment intent", { 
      customerName, 
      customerPhone, 
      deliveryDate, 
      deliveryTime,
      compactCartItemsLength: compactCartItems.length
    });

    // Create payment intent with essential metadata (compact cart items only)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validAmount,
      currency,
      metadata: {
        customer_name: customerName.substring(0, 100),
        customer_email: (customerInfo?.email || '').substring(0, 100),
        customer_phone: customerPhone.substring(0, 50),
        delivery_date: deliveryDate.substring(0, 50),
        delivery_time: deliveryTime.substring(0, 50),
        delivery_address: deliveryAddress.substring(0, 200),
        delivery_instructions: deliveryInstructions.substring(0, 200),
        cart_summary: cartSummary,
        cart_items_compact: compactCartItems, // Compact version for metadata
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
        group_order_token: (groupOrderToken || '').substring(0, 50),
        // Store full cart data separately for create-shopify-order function
        full_cart_data: JSON.stringify({
          cartItems,
          customerInfo,
          deliveryInfo,
          appliedDiscount,
          tipAmount,
          groupOrderNumber,
          groupOrderToken
        }).substring(0, 500) // Emergency backup truncation
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