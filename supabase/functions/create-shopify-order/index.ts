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
      logStep("ERROR: Supabase configuration missing");
      throw new Error("Supabase configuration is not set");
    }

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
        paymentAmount = paymentIntent.amount / 100;
        logStep("PaymentIntent retrieved successfully", { amount: paymentAmount, status: paymentIntent.status });
      } else if (sessionId) {
        logStep("Retrieving Checkout Session", { sessionId });
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
          logStep("ERROR: Session payment not completed", { payment_status: session.payment_status });
          throw new Error(`Session payment not completed. Status: ${session.payment_status}`);
        }
        metadata = session.metadata;
        paymentAmount = session.amount_total / 100;
        logStep("Checkout Session retrieved successfully", { amount: paymentAmount, status: session.payment_status });
      }
    } catch (stripeError) {
      logStep("ERROR: Failed to retrieve payment from Stripe", { error: stripeError.message });
      throw new Error(`Failed to retrieve payment details: ${stripeError.message}`);
    }

    if (!metadata) {
      logStep("ERROR: No metadata found in payment");
      throw new Error("No metadata found in payment");
    }

    logStep("Payment metadata extracted", {
      keys: Object.keys(metadata),
      hasOrderDraftId: !!metadata.order_draft_id,
      hasCartItems: !!metadata.cart_items,
      hasDeliveryInfo: !!metadata.delivery_date
    });

    // Extract order data from database or metadata
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
          .select('*')
          .eq('id', metadata.order_draft_id)
          .single();

        if (!error && orderDraft) {
          cartItems = orderDraft.cart_items || [];
          orderAmounts = orderDraft.amounts || {};
          logStep("Order data loaded from database", { 
            itemCount: cartItems.length,
            amounts: orderAmounts
          });
        } else {
          logStep("Order draft not found, falling back to metadata", { error: error?.message });
        }
      } catch (dbError) {
        logStep("Database error, falling back to metadata", { error: dbError.message });
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
        logStep("ERROR: Failed to parse cart items from metadata", { error: parseError.message });
        throw new Error("Invalid cart items in payment metadata");
      }
    }

    // Extract order amounts
    if (!orderAmounts.total_amount) {
      orderAmounts = {
        subtotal: parseFloat(metadata.subtotal || '0'),
        sales_tax: parseFloat(metadata.sales_tax || '0'),
        delivery_fee: parseFloat(metadata.delivery_fee || '0'),
        tip_amount: parseFloat(metadata.tip_amount || '0'),
        total_amount: paymentAmount
      };
    }

    // Enhanced tip debugging
    const rawTipAmount = metadata.tip_amount;
    if (rawTipAmount) {
      logStep("ENHANCED TIP DEBUG", {
        rawTipFromMetadata: rawTipAmount,
        parsedTipAmount: orderAmounts.tip_amount,
        tipType: typeof rawTipAmount,
        isZeroTip: orderAmounts.tip_amount === 0,
        paymentAmount: paymentAmount,
        calculatedTotal: orderAmounts.subtotal + orderAmounts.sales_tax + orderAmounts.delivery_fee + orderAmounts.tip_amount
      });
    }

    // CRITICAL FIX: Check for duplicate orders before creating
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      
      const { data: existingOrder } = await supabaseClient
        .from('customer_orders')
        .select('shopify_order_id, order_number')
        .eq('session_id', paymentIntentId || sessionId)
        .single();

      if (existingOrder) {
        logStep("⚠️ DUPLICATE ORDER DETECTED - Returning existing order", {
          existingShopifyId: existingOrder.shopify_order_id,
          existingOrderNumber: existingOrder.order_number
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            shopify_order_id: existingOrder.shopify_order_id,
            order_number: existingOrder.order_number,
            message: "Order already exists - duplicate prevented"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    } catch (duplicateCheckError) {
      logStep("WARNING: Could not check for duplicates", { error: duplicateCheckError.message });
    }

    if (cartItems.length === 0) {
      logStep("ERROR: No cart items found");
      throw new Error("No cart items found in order");
    }

    // Extract customer and delivery information
    const customerEmail = metadata.customer_email || metadata.email || '';
    const customerPhone = metadata.customer_phone || metadata.phone || '';
    const deliveryDate = metadata.delivery_date || '';
    const deliveryTime = metadata.delivery_time || '';
    const deliveryAddress = metadata.delivery_address || '';  // RAW ADDRESS - NO PARSING
    const deliveryInstructions = metadata.delivery_instructions || metadata.special_instructions || '';

    logStep("Customer and delivery info extracted", {
      email: customerEmail,
      phone: customerPhone,
      deliveryDate,
      deliveryTime,
      deliveryAddress,
      hasInstructions: !!deliveryInstructions
    });

    // Extract customer name
    let firstName = metadata.customer_first_name || metadata.first_name || '';
    let lastName = metadata.customer_last_name || metadata.last_name || '';
    
    if (!firstName && !lastName && customerEmail) {
      const emailParts = customerEmail.split('@')[0].split('.');
      firstName = emailParts[0] || 'Customer';
      lastName = emailParts[1] || '';
    }

    if (!firstName) firstName = 'Customer';
    if (!lastName) lastName = 'User';

    logStep("Customer name processed", { firstName, lastName });

    // Simple address handling - no complex parsing needed
    logStep("Raw delivery address from metadata", {
      deliveryAddress,
      deliveryDate,
      deliveryTime
    });

    // orderAmounts already set above - no need to redeclare
    
    logStep("Order amounts extracted", orderAmounts);

    // Create line items for Shopify (ONLY products, no fees or tips)
    const lineItems = cartItems.map(item => ({
      title: item.title || item.name,
      quantity: item.quantity,
      price: parseFloat(item.price).toFixed(2),
      variant_id: item.variant_id || null,
      product_id: item.product_id || null,
      vendor: item.vendor || null,
      requires_shipping: true
    }));

    logStep("Line items created (PRODUCTS ONLY)", { 
      itemCount: lineItems.length,
      productSubtotal: cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0),
      tipAmount: orderAmounts.tip_amount,
      note: "Only products in line_items - delivery fee and tip in shipping_lines section"
    });

    // Extract affiliate code if present
    const affiliateCode = metadata.affiliate_code || '';

    // Create Shopify order with EXACT structure matching screenshot
    const orderData = {
      order: {
        // ONLY actual products as line items - NO TIP, NO FEES
        line_items: lineItems, // Just the real products
        
        customer: null, // Will be set after customer creation
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1: deliveryAddress || "Address Required",
          city: "Address Required",
          province: "TX",
          country: "US",
          zip: "00000",
          phone: customerPhone
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          company: `🚚 DELIVERY: ${deliveryDate} at ${deliveryTime}`,
          address1: deliveryAddress || "Address Required",
          address2: deliveryInstructions ? `📋 Instructions: ${deliveryInstructions}` : undefined,
          city: "Address Required",
          province: "TX",
          country: "US",
          zip: "00000",
          phone: customerPhone
        },
        email: customerEmail,
        phone: customerPhone,
        
        // EXACT BREAKDOWN - Products subtotal only (without tip)
        subtotal_price: orderAmounts.subtotal.toFixed(2),  // Products only ($441.88)
        total_price: orderAmounts.total_amount.toFixed(2),  // Full total ($560.47)
        
        // Tax lines - ONLY sales tax (no tip here)
        tax_lines: orderAmounts.sales_tax > 0 ? [{
          title: "Sales Tax 8.25%", 
          price: orderAmounts.sales_tax.toFixed(2),  // $38.59
          rate: 0.0825
        }] : [],
        
        // Shipping lines - Delivery fee AND Driver tip as separate entries (same section)
        shipping_lines: [
          // Delivery fee entry
          ...(orderAmounts.delivery_fee > 0 ? [{
            title: "Delivery Fee",
            price: orderAmounts.delivery_fee.toFixed(2),
            code: "LOCAL_DELIVERY"
          }] : []),
          // Driver tip entry (separate but same section)
          ...(orderAmounts.tip_amount > 0 ? [{
            title: "Driver Tip", 
            price: orderAmounts.tip_amount.toFixed(2),
            code: "DRIVER_TIP"
          }] : [])
        ],
        
        // NOTE: Driver tip now in shipping_lines above (same section as delivery fee)
        
        // Custom attributes - delivery details displayed prominently
        note_attributes: [
          {
            name: "🚚 Delivery Date", 
            value: deliveryDate
          },
          {
            name: "🕐 Delivery Time",
            value: deliveryTime
          },
          {
            name: "📍 Full Delivery Address",
            value: deliveryAddress
          },
          {
            name: "📋 Special Instructions",
            value: deliveryInstructions || "None"
          },
          {
            name: "💰 Driver Tip Amount",
            value: `$${orderAmounts.tip_amount.toFixed(2)}`
          },
          {
            name: "💳 Stripe Payment ID",
            value: paymentIntentId || sessionId
          }
        ].filter(attr => attr.value && attr.value.trim() !== '' && attr.value !== 'None'),
        
        // Order notes - COMPREHENSIVE delivery information display
        note: `🚚 DELIVERY ORDER (CST) - ${deliveryDate} at ${deliveryTime}

📍 DELIVERY ADDRESS:
${deliveryAddress}
📞 Customer Phone: ${customerPhone}
✉️ Customer Email: ${customerEmail}
${deliveryInstructions ? `📋 SPECIAL INSTRUCTIONS: ${deliveryInstructions}` : '📋 SPECIAL INSTRUCTIONS: None'}

💰 PAYMENT BREAKDOWN (MATCHES STRIPE EXACTLY):
• Subtotal (Products): $${orderAmounts.subtotal.toFixed(2)}
• Sales Tax 8.25%: $${orderAmounts.sales_tax.toFixed(2)}
• Delivery Fee: $${orderAmounts.delivery_fee.toFixed(2)}
• Driver Tip: $${orderAmounts.tip_amount.toFixed(2)}
• TOTAL PAID: $${orderAmounts.total_amount.toFixed(2)}

💳 STRIPE PAYMENT CONFIRMATION:
Payment ID: ${paymentIntentId || sessionId}
Status: PAID ✅
${affiliateCode ? `🤝 AFFILIATE CODE: ${affiliateCode}` : ''}

⚠️ IMPORTANT: Driver tip ($${orderAmounts.tip_amount.toFixed(2)}) appears as separate line item in order totals above.
📦 ORDER FULFILLMENT: Prepare for delivery on ${deliveryDate} between ${deliveryTime}`,
        
        // Financial status - paid
        financial_status: "paid",
        
        // Tags for tracking
        tags: [
          "delivery-order",
          "stripe-paid",
          affiliateCode ? `affiliate-${affiliateCode}` : null,
          orderAmounts.tip_amount > 0 ? "has-tip" : "no-tip",
          `tip-${orderAmounts.tip_amount.toFixed(2).replace('.', '_')}`,
          `delivery-${deliveryDate}`
        ].filter(Boolean).join(", "),
        
        // Transaction record
        transactions: [{
          amount: orderAmounts.total_amount.toFixed(2),
          kind: "sale",
          gateway: "stripe",
          status: "success",
          source_name: "web"
        }]
      }
    };

    logStep("Creating Shopify order with FIXED STRUCTURE", { 
      totalAmount: orderAmounts.total_amount,
      lineItemCount: lineItems.length,
      shippingLinesCount: [
        ...(orderAmounts.delivery_fee > 0 ? [1] : []),
        ...(orderAmounts.tip_amount > 0 ? [1] : [])
      ].length,
      tipAmount: orderAmounts.tip_amount,
      deliveryFee: orderAmounts.delivery_fee,
      deliveryAddress: deliveryAddress,
      exactStructure: {
        line_items: "PRODUCTS ONLY",
        shipping_lines: "DELIVERY FEE + DRIVER TIP (separate entries)"
      }
    });

    // Create or find Shopify customer first
    logStep("Creating/finding Shopify customer", { firstName, lastName, email: customerEmail });

    let shopifyCustomerId = null;
    
    // First, try to find existing customer by email
    try {
      const searchResponse = await fetch(
        `https://${shopifyStore}/admin/api/2024-10/customers/search.json?query=email:${encodeURIComponent(customerEmail)}`,
        {
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.customers && searchResult.customers.length > 0) {
          shopifyCustomerId = searchResult.customers[0].id;
          logStep("Existing customer found", { customerId: shopifyCustomerId });
        }
      }
    } catch (searchError) {
      logStep("Customer search error, will create new", { error: searchError.message });
    }

    // If no existing customer found, create new one
    if (!shopifyCustomerId) {
      try {
        const customerData = {
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: customerEmail,
            phone: customerPhone,
            addresses: [
              {
                first_name: firstName,
                last_name: lastName,
                address1: deliveryAddress || "Address Required",
                city: "Address Required",
                province: "TX",
                country: "US",
                zip: "00000",
                phone: customerPhone
              }
            ]
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
          logStep("New customer created", { customerId: shopifyCustomerId });
        } else {
          const errorText = await customerResponse.text();
          logStep("Customer creation failed", { error: errorText });
        }
      } catch (customerError) {
        logStep("Customer creation error", { error: customerError.message });
      }
    }

    // Update order data with customer ID if we have one
    if (shopifyCustomerId) {
      orderData.order.customer = { id: shopifyCustomerId };
    }

    // Create the Shopify order
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
          order_number: shopifyOrder.name || shopifyOrder.order_number || `#${shopifyOrder.number}`,
          session_id: paymentIntentId || sessionId,
          payment_intent_id: paymentIntentId, // ✅ NEW: Store PaymentIntent ID
          shopify_order_id: shopifyOrder.id.toString(),
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: {
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
          order_number: shopifyOrder.name || shopifyOrder.order_number || `#${shopifyOrder.number}`,
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