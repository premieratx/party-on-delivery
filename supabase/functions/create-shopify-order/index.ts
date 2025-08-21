import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}][SHOPIFY-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== CREATE SHOPIFY ORDER STARTED ===");

    const body = await req.json();
    logStep("Request received", { 
      method: req.method,
      bodyKeys: Object.keys(body),
      hasPaymentIntentId: !!body.paymentIntentId,
      hasSessionId: !!body.sessionId
    });
    
    const { paymentIntentId, sessionId } = body;
    if (!paymentIntentId && !sessionId) {
      logStep("ERROR: Missing payment identifier");
      throw new Error("Payment Intent ID or Session ID is required");
    }

    // Validate environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL") || "premier-concierge.myshopify.com";
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    if (!shopifyToken) {
      logStep("ERROR: SHOPIFY_ADMIN_API_ACCESS_TOKEN not configured");
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not set");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Supabase credentials not configured");
      throw new Error("Supabase credentials are not set");
    }

    logStep("Environment variables validated");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get payment details from Stripe
    let metadata;
    let paymentAmount = 0;
    
    try {
      if (paymentIntentId) {
        logStep("Retrieving PaymentIntent", { paymentIntentId });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          logStep("ERROR: Payment not completed", { status: paymentIntent.status });
          throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
        }
        metadata = paymentIntent.metadata;
        paymentAmount = paymentIntent.amount / 100; // Convert cents to dollars
        logStep("PaymentIntent retrieved successfully", { 
          status: paymentIntent.status,
          amount: paymentAmount,
          metadataKeys: Object.keys(metadata || {})
        });
      } else if (sessionId) {
        logStep("Retrieving Checkout Session", { sessionId });
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
          logStep("ERROR: Payment not completed", { status: session.payment_status });
          throw new Error(`Payment not completed. Status: ${session.payment_status}`);
        }
        metadata = session.metadata;
        paymentAmount = (session.amount_total || 0) / 100; // Convert cents to dollars
        logStep("Checkout Session retrieved successfully", { 
          status: session.payment_status,
          amount: paymentAmount,
          metadataKeys: Object.keys(metadata || {})
        });
      }
    } catch (stripeError) {
      logStep("ERROR: Stripe API call failed", { 
        error: stripeError.message,
        stack: stripeError.stack 
      });
      throw new Error(`Stripe API error: ${stripeError.message}`);
    }

    if (!metadata) {
      logStep("ERROR: No metadata received from Stripe");
      throw new Error("No payment metadata found");
    }

    // Parse cart items and order details
    let cartItems = [];
    let orderAmounts = {};

    // Try to get from order_drafts first
    if (metadata.order_draft_id) {
      try {
        logStep("Loading order data from database", { orderDraftId: metadata.order_draft_id });
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        const { data: orderDraft, error } = await supabaseClient
          .from('order_drafts')
          .select('draft_data, total_amount')
          .eq('id', metadata.order_draft_id)
          .single();
          
        if (!error && orderDraft?.draft_data) {
          cartItems = orderDraft.draft_data.cart_items || [];
          orderAmounts = {
            subtotal: (orderDraft.draft_data.subtotal || 0) / 100,
            delivery_fee: (orderDraft.draft_data.delivery_fee || 0) / 100,
            sales_tax: (orderDraft.draft_data.sales_tax || 0) / 100,
            tip_amount: (orderDraft.draft_data.tip_amount || 0) / 100,
            total_amount: orderDraft.total_amount || 0
          };
          logStep("Order data loaded from database", { 
            itemCount: cartItems.length,
            totalAmount: orderAmounts.total_amount
          });
        }
      } catch (dbError) {
        logStep("WARNING: Failed to load from order_drafts", { error: dbError.message });
      }
    }
    
    // Fallback to metadata
    if (cartItems.length === 0) {
      try {
        if (metadata.cart_items) {
          cartItems = JSON.parse(metadata.cart_items);
          logStep("Cart items parsed from metadata", { itemCount: cartItems.length });
        }
      } catch (parseError) {
        logStep("ERROR: Failed to parse cart_items from metadata", { error: parseError.message });
      }
    }

    if (cartItems.length === 0) {
      logStep("CRITICAL ERROR: No cart items found", { 
        metadataKeys: Object.keys(metadata),
        hasOrderDraftId: !!metadata.order_draft_id
      });
      throw new Error("No cart items found in order");
    }

    // Get order amounts (fallback to metadata if not from database)
    if (!orderAmounts.total_amount) {
      orderAmounts = {
        // Convert from cents to dollars (metadata stores amounts in cents)
        subtotal: parseFloat(metadata.subtotal || '0') / 100,
        delivery_fee: parseFloat(metadata.delivery_fee || '0') / 100,
        sales_tax: parseFloat(metadata.sales_tax || '0') / 100,
        tip_amount: parseFloat(metadata.tip_amount || '0') / 100,
        total_amount: parseFloat(metadata.total_amount || '0') // Total is already in dollars
      };
      logStep("Using amounts from metadata (converted from cents)", orderAmounts);
    }

    // FIX: Don't recalculate total - use the stored total_amount directly
    // The individual breakdown amounts are often corrupted/wrong, but total_amount is correct
    const calculatedTotal = orderAmounts.total_amount;
    const totalDifference = Math.abs(paymentAmount - calculatedTotal);
    
    logStep("Using stored total_amount directly", {
      paymentAmount,
      storedTotalAmount: calculatedTotal,
      difference: totalDifference,
      breakdown: orderAmounts
    });
    
    if (totalDifference > 0.02) {
      logStep("ERROR: Amount mismatch", {
        paymentAmount,
        calculatedTotal,
        difference: totalDifference,
        breakdown: orderAmounts
      });
      throw new Error(`Payment amount mismatch: Payment $${paymentAmount} vs Order $${calculatedTotal}`);
    }

    logStep("Amount validation passed", { 
      paymentAmount,
      calculatedTotal,
      difference: totalDifference
    });

    // Extract customer and delivery info
    const customerName = metadata.customer_name || '';
    const customerEmail = metadata.customer_email || '';
    const customerPhone = metadata.customer_phone || '';
    const deliveryDate = metadata.delivery_date || '';
    const deliveryTime = metadata.delivery_time || '';
    const deliveryAddress = metadata.delivery_address || '';
    const deliveryInstructions = metadata.delivery_instructions || '';

    logStep("Order details extracted", {
      customerName,
      customerEmail,
      deliveryDate,
      deliveryTime,
      itemCount: cartItems.length
    });

    // Create customer in Shopify
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Parse delivery address
    const addressParts = deliveryAddress.split(',').map(p => p.trim());
    const street = addressParts[0] || '';
    const city = addressParts[1] || '';
    const stateZip = addressParts[2] || '';
    const state = stateZip.split(' ')[0] || '';
    const zip = stateZip.split(' ')[1] || '';

    logStep("Creating Shopify customer", { firstName, lastName, email: customerEmail });

    let shopifyCustomerId = null;
    try {
      const customerData = {
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: customerEmail,
          phone: customerPhone,
          note: `Delivery order - ${deliveryDate} at ${deliveryTime}${deliveryInstructions ? `. Instructions: ${deliveryInstructions}` : ''}`,
          addresses: [{
            address1: street,
            city: city,
            province: state,
            country: "US",
            zip: zip,
            phone: customerPhone
          }]
        }
      };

      const customerResponse = await fetch(
        `https://${shopifyStore}/admin/api/2024-10/customers.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        }
      );

      if (customerResponse.ok) {
        const customerResult = await customerResponse.json();
        shopifyCustomerId = customerResult.customer.id;
        logStep("Shopify customer created", { customerId: shopifyCustomerId });
      } else {
        const errorText = await customerResponse.text();
        logStep("Customer creation failed, continuing", { 
          status: customerResponse.status,
          error: errorText
        });
      }
    } catch (customerError) {
      logStep("Customer creation error", { error: customerError.message });
    }

    // Prepare line items for Shopify
    const lineItems = [];
    
    for (const item of cartItems) {
      const lineItem: any = {
        title: item.title || item.name || 'Unknown Item',
        price: item.price.toString(),
        quantity: item.quantity || 1,
        requires_shipping: true
      };

      // Handle Shopify product/variant IDs (clean up GIDs)
      if (item.id && typeof item.id === 'string') {
        if (item.id.includes('gid://shopify/Product/')) {
          const productId = item.id.replace('gid://shopify/Product/', '');
          if (!isNaN(parseInt(productId))) {
            lineItem.product_id = parseInt(productId);
          }
        }
      }

      if (item.variant && typeof item.variant === 'string') {
        if (item.variant.includes('gid://shopify/ProductVariant/')) {
          const variantId = item.variant.replace('gid://shopify/ProductVariant/', '');
          if (!isNaN(parseInt(variantId))) {
            lineItem.variant_id = parseInt(variantId);
            delete lineItem.product_id; // Use variant_id instead
          }
        }
      }

      lineItems.push(lineItem);
    }

    // Add shipping fee as line item
    if (orderAmounts.delivery_fee > 0) {
      lineItems.push({
        title: "Delivery Fee",
        price: orderAmounts.delivery_fee.toString(),
        quantity: 1,
        requires_shipping: false,
        taxable: false
      });
    }

    // Add tip as line item
    if (orderAmounts.tip_amount > 0) {
      lineItems.push({
        title: "Tip",
        price: orderAmounts.tip_amount.toString(),
        quantity: 1,
        requires_shipping: false,
        taxable: false
      });
    }

    logStep("Line items prepared", { 
      itemCount: lineItems.length,
      totalLineItemValue: lineItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
    });

    // Generate unique order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create Shopify order
    const orderData = {
      order: {
        line_items: lineItems,
        customer: shopifyCustomerId ? { id: shopifyCustomerId } : undefined,
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1: street,
          city: city,
          province: state,
          country: "US",
          zip: zip,
          phone: customerPhone
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1: street,
          city: city,
          province: state,
          country: "US",
          zip: zip,
          phone: customerPhone
        },
        email: customerEmail,
        phone: customerPhone,
        note: `Delivery: ${deliveryDate} at ${deliveryTime}${deliveryInstructions ? `. Instructions: ${deliveryInstructions}` : ''}`,
        tags: "delivery-order,paid",
        name: orderNumber,
        financial_status: "paid",
        fulfillment_status: "unfulfilled",
        total_tax: orderAmounts.sales_tax.toString(),
        currency: "USD",
        source_name: "delivery-app"
      }
    };

    logStep("Creating Shopify order", { 
      orderNumber,
      totalAmount: orderAmounts.total_amount,
      lineItemCount: lineItems.length
    });

    try {
      const orderResponse = await fetch(
        `https://${shopifyStore}/admin/api/2024-10/orders.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        logStep("ERROR: Shopify order creation failed", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          error: errorText
        });
        throw new Error(`Shopify API error (${orderResponse.status}): ${errorText}`);
      }

      const orderResult = await orderResponse.json();
      const shopifyOrder = orderResult.order;

      logStep("✅ Shopify order created successfully", {
        shopifyOrderId: shopifyOrder.id,
        orderNumber: shopifyOrder.name,
        totalPrice: shopifyOrder.total_price,
        status: shopifyOrder.financial_status
      });

      // Store order in our database
      try {
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const orderRecord = {
          order_number: orderNumber,
          session_id: paymentIntentId || sessionId,
          shopify_order_id: shopifyOrder.id.toString(),
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: {
            street,
            city,
            state,
            zip,
            full_address: deliveryAddress,
            email: customerEmail,
            phone: customerPhone
          },
          line_items: cartItems,
          subtotal: orderAmounts.subtotal,
          delivery_fee: orderAmounts.delivery_fee,
          total_amount: orderAmounts.total_amount,
          special_instructions: deliveryInstructions,
          status: 'paid'
        };

        const { error: dbError } = await supabaseClient
          .from('customer_orders')
          .insert(orderRecord);

        if (dbError) {
          logStep("WARNING: Failed to store order in database", { error: dbError.message });
        } else {
          logStep("Order stored in database successfully");
        }
      } catch (dbError) {
        logStep("WARNING: Database storage error", { error: dbError.message });
      }

      logStep("=== CREATE SHOPIFY ORDER COMPLETED SUCCESSFULLY ===");

      return new Response(
        JSON.stringify({
          success: true,
          shopify_order_id: shopifyOrder.id,
          order_number: orderNumber,
          shopify_order_name: shopifyOrder.name,
          total_amount: orderAmounts.total_amount,
          message: "Order created successfully in Shopify"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } catch (shopifyError) {
      logStep("ERROR: Shopify order creation failed", {
        error: shopifyError.message,
        stack: shopifyError.stack
      });
      throw shopifyError;
    }

  } catch (error) {
    logStep("=== CRITICAL ERROR ===", {
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Check edge function logs for detailed error information"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});