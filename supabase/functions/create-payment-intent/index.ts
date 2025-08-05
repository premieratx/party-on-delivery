import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    
    // Support both 'items' and 'cartItems' for backward compatibility
    const cartItems = body.cartItems || body.items;
    const { amount, currency, customerInfo, deliveryInfo, appliedDiscount, tipAmount, groupOrderNumber, subtotal, deliveryFee, salesTax, groupOrderToken } = body;
    
    logStep("Extracted data", {
      amount,
      currency,
      cartItemsLength: cartItems?.length,
      customerInfoKeys: customerInfo ? Object.keys(customerInfo) : null,
      deliveryInfoKeys: deliveryInfo ? Object.keys(deliveryInfo) : null,
      subtotal,
      deliveryFee,
      salesTax,
      tipAmount,
      groupOrderToken
    });
    
    // Validate required fields with detailed error messages
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      logStep("ERROR: Cart items validation failed", { cartItems });
      throw new Error("Cart items are required and must be a non-empty array");
    }
    
    if (!customerInfo || !customerInfo.email) {
      logStep("ERROR: Customer info validation failed", { customerInfo });
      throw new Error("Customer information with email is required");
    }
    
    if (!deliveryInfo || !deliveryInfo.address) {
      logStep("ERROR: Delivery info validation failed", { deliveryInfo });
      throw new Error("Delivery information with address is required");
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      logStep("ERROR: Amount validation failed", { amount, type: typeof amount });
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
      logStep("ERROR: STRIPE_SECRET_KEY missing from environment");
      throw new Error("STRIPE_SECRET_KEY not found in environment variables. Please check Supabase secrets configuration.");
    }
    if (!stripeSecretKey.startsWith('sk_')) {
      logStep("ERROR: Invalid STRIPE_SECRET_KEY format", { keyPrefix: stripeSecretKey.substring(0, 8) });
      throw new Error("Invalid STRIPE_SECRET_KEY format. Must start with 'sk_'");
    }
    logStep("✅ STRIPE_SECRET_KEY validated", { 
      keyPrefix: stripeSecretKey.substring(0, 12) + "...",
      environment: stripeSecretKey.includes('test') ? 'test' : 'live'
    });

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
    
    logStep("Cart items data prepared", { 
      cartItemsLength: JSON.stringify(cartItems).length,
      itemCount 
    });

    // Extract customer and delivery information safely
    const customerName = `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim();
    const customerPhone = customerInfo?.phone || '';
    const customerEmail = customerInfo?.email || '';
    
    const deliveryDate = deliveryInfo.date || '';
    const deliveryTime = deliveryInfo.timeSlot || '';
    const deliveryAddress = deliveryInfo.address || '';
    const deliveryInstructions = deliveryInfo.instructions || '';
    
    // CRITICAL: Store cart items in a separate database record due to Stripe metadata limits
    // Then reference it in the payment intent
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    let cartDataId = null;
    try {
      const { data: cartRecord, error } = await supabase
        .from('order_drafts')
        .insert({
          draft_data: {
            cartItems,
            customerInfo,
            deliveryInfo,
            appliedDiscount,
            groupOrderToken,
            groupOrderNumber
          },
          total_amount: validSubtotal + validDeliveryFee + validSalesTax + validTipAmount,
          customer_email: customerEmail,
          checkout_step: 'payment'
        })
        .select('id')
        .single();
        
      if (!error && cartRecord) {
        cartDataId = cartRecord.id;
        logStep("Cart data stored in order_drafts", { cartDataId });
      }
    } catch (dbError) {
      logStep("Warning: Could not store cart data", dbError);
    }
    
    logStep("Preparing metadata for payment intent", { 
      customerName, 
      customerPhone, 
      deliveryDate, 
      deliveryTime,
      cartDataId
    });

    // Create payment intent with compact metadata (full data stored in order_drafts)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validAmount,
      currency,
      metadata: {
        customer_name: customerName.substring(0, 100),
        customer_email: customerEmail.substring(0, 100),
        customer_phone: customerPhone.substring(0, 50),
        delivery_date: deliveryDate.substring(0, 50),
        delivery_time: deliveryTime.substring(0, 50),
        delivery_address: deliveryAddress.substring(0, 200),
        delivery_instructions: deliveryInstructions.substring(0, 200),
        cart_summary: cartSummary,
        cart_data_id: cartDataId || '', // Reference to full cart data
        item_count: itemCount.toString(),
        subtotal: validSubtotal.toFixed(2),
        shipping_fee: validDeliveryFee.toFixed(2),
        sales_tax: validSalesTax.toFixed(2),
        tip_amount: validTipAmount.toFixed(2),
        total_amount: (validSubtotal + validDeliveryFee + validSalesTax + validTipAmount).toFixed(2),
        discount_code: (appliedDiscount?.code || '').substring(0, 50),
        discount_type: (appliedDiscount?.type || '').substring(0, 20),
        discount_value: (appliedDiscount?.value?.toString() || '0').substring(0, 10),
        discount_amount: (appliedDiscount?.type === 'percentage' ? (validSubtotal * (appliedDiscount.value / 100)).toFixed(2) : '0'),
        group_order_number: (groupOrderNumber || '').substring(0, 50),
        group_order_token: (groupOrderToken || '').substring(0, 50),
        is_adding_to_order: groupOrderToken ? 'true' : 'false'
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
    logStep("ERROR in create-payment-intent", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});