import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { cartItems, deliveryInfo, customerInfo, appliedDiscount, tipAmount } = await req.json();
    logStep("Request data received", { cartItems: cartItems?.length, deliveryInfo, customerInfo, appliedDiscount, tipAmount });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Calculate pricing components
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Apply discount to subtotal if applicable
    const discountedSubtotal = appliedDiscount?.type === 'percentage' 
      ? subtotal * (1 - appliedDiscount.value / 100)
      : subtotal;
    
    // Calculate delivery fee (based on original subtotal, not discounted)
    const originalDeliveryFee = subtotal >= 200 ? subtotal * 0.1 : 20;
    const deliveryFee = appliedDiscount?.type === 'free_shipping' ? 0 : originalDeliveryFee;
    
    const salesTax = subtotal * 0.0825; // 8.25% sales tax
    const finalTipAmount = tipAmount || 0;
    const totalAmount = Math.round((discountedSubtotal + deliveryFee + salesTax + finalTipAmount) * 100); // Convert to cents

    logStep("Amount calculated", { subtotal, deliveryFee, salesTax, totalAmount });

    // Check for existing customer
    const customers = await stripe.customers.list({ 
      email: customerInfo.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add discount as negative line item if applicable
    if (appliedDiscount?.type === 'percentage') {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Discount (${appliedDiscount.code} - ${appliedDiscount.value}% off)`,
            description: `${appliedDiscount.value}% discount applied`,
          },
          unit_amount: -Math.round((subtotal * appliedDiscount.value / 100) * 100),
        },
        quantity: 1,
      });
    }

    // Add delivery fee as a line item (only if not free shipping)
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: subtotal >= 200 ? "Delivery Fee (10%)" : "Delivery Fee",
            description: `Delivery to ${deliveryInfo.address}`,
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    } else if (appliedDiscount?.type === 'free_shipping') {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Free Shipping (${appliedDiscount.code})`,
            description: "Delivery fee waived with discount code",
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

    // Add sales tax as a line item
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Sales Tax (8.25%)",
          description: "TX State Sales Tax",
        },
        unit_amount: Math.round(salesTax * 100),
      },
      quantity: 1,
    });

    // Add tip as a line item if provided
    if (finalTipAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Driver Tip",
            description: "Tip for delivery driver",
          },
          unit_amount: Math.round(finalTipAmount * 100),
        },
        quantity: 1,
      });
    }

    logStep("Line items prepared", { itemCount: lineItems.length });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      billing_address_collection: "auto", // Stripe will collect billing if needed
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        delivery_date: deliveryInfo.date,
        delivery_time: deliveryInfo.time,
        delivery_address: deliveryInfo.address,
        delivery_instructions: deliveryInfo?.instructions || '',
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        cart_items: JSON.stringify(cartItems),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});