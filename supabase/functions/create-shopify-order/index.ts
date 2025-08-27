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
          // CRITICAL FIX: Don't double-convert amounts - they're already in dollars in draft_data
          orderAmounts = {
            subtotal: orderDraft.draft_data.subtotal || 0,
            delivery_fee: orderDraft.draft_data.delivery_fee || 0,
            sales_tax: orderDraft.draft_data.sales_tax || 0,
            tip_amount: orderDraft.draft_data.tip_amount || 0,
            total_amount: orderDraft.total_amount || 0
          };
          logStep("Order data loaded from database (FIXED DECIMAL CONVERSION)", { 
            itemCount: cartItems.length,
            totalAmount: orderAmounts.total_amount,
            deliveryFee: orderAmounts.delivery_fee,
            tipAmount: orderAmounts.tip_amount
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
      // CRITICAL FIX: Properly parse and round tip amount from metadata
      const rawTipAmount = parseFloat(metadata.tip_amount || '0');
      orderAmounts = {
        subtotal: parseFloat(metadata.subtotal || '0'),
        delivery_fee: parseFloat(metadata.delivery_fee || '0'),
        sales_tax: parseFloat(metadata.sales_tax || '0'),
        tip_amount: Math.round(rawTipAmount * 100) / 100, // Round to 2 decimal places
        total_amount: parseFloat(metadata.total_amount || '0')
      };
      logStep("Using amounts from metadata with proper tip rounding", {
        ...orderAmounts,
        rawTipFromMetadata: rawTipAmount
      });
    }

    // CRITICAL FIX: Check for duplicate orders before creating
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      
      const { data: existingOrder } = await supabaseClient
        .from('customer_orders')
        .select('id, order_number, shopify_order_id')
        .eq('session_id', paymentIntentId || sessionId)
        .limit(1)
        .maybeSingle();
        
      if (existingOrder) {
        logStep("ORDER ALREADY EXISTS - PREVENTING DUPLICATE", {
          existingOrderId: existingOrder.id,
          existingOrderNumber: existingOrder.order_number,
          existingShopifyOrderId: existingOrder.shopify_order_id
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            shopify_order_id: existingOrder.shopify_order_id,
            order_number: existingOrder.order_number,
            total_amount: orderAmounts.total_amount,
            message: "Order already exists - duplicate prevented",
            duplicate_prevented: true
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
    const deliveryInstructions = metadata.delivery_instructions || '';

    // Parse delivery address - handle both string and JSON formats
    let deliveryAddressObj = {};
    let street = '';
    let city = '';
    let state = '';
    let zip = '';
    let fullAddressString = '';

    // First, log what we received
    logStep("Raw delivery address data received", {
      delivery_address: metadata.delivery_address,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      type: typeof metadata.delivery_address
    });

    try {
      // Handle different address formats
      if (metadata.delivery_address) {
        if (typeof metadata.delivery_address === 'object') {
          // Already an object
          deliveryAddressObj = metadata.delivery_address;
          street = deliveryAddressObj.street || deliveryAddressObj.address1 || deliveryAddressObj.line1 || deliveryAddressObj.address || '';
          city = deliveryAddressObj.city || '';
          state = deliveryAddressObj.state || deliveryAddressObj.province || '';
          zip = deliveryAddressObj.zip || deliveryAddressObj.postal_code || deliveryAddressObj.zipCode || '';
        } else if (typeof metadata.delivery_address === 'string' && metadata.delivery_address.trim().startsWith('{')) {
          // JSON string
          deliveryAddressObj = JSON.parse(metadata.delivery_address);
          street = deliveryAddressObj.street || deliveryAddressObj.address1 || deliveryAddressObj.line1 || deliveryAddressObj.address || '';
          city = deliveryAddressObj.city || '';
          state = deliveryAddressObj.state || deliveryAddressObj.province || '';
          zip = deliveryAddressObj.zip || deliveryAddressObj.postal_code || deliveryAddressObj.zipCode || '';
        } else {
          // Plain string address
          const deliveryAddress = metadata.delivery_address.toString().trim();
          fullAddressString = deliveryAddress;
          
          // Try to parse if it contains commas
          if (deliveryAddress.includes(',')) {
            const addressParts = deliveryAddress.split(',').map(p => p.trim());
            street = addressParts[0] || '';
            city = addressParts[1] || '';
            const stateZip = addressParts[2] || '';
            const stateParts = stateZip.split(' ');
            state = stateParts[0] || '';
            zip = stateParts.slice(1).join(' ') || '';
          } else {
            // Use entire string as street if no structure
            street = deliveryAddress;
          }
        }

        // Build formatted address string if we have parts
        if (!fullAddressString && (street || city || state || zip)) {
          const parts = [street, city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean);
          fullAddressString = parts.join(', ');
        }

        // Fallback to ensure we always have something
        if (!fullAddressString) {
          fullAddressString = metadata.delivery_address.toString();
        }
      }

      // Fallback if still empty - USE EVERYTHING WE HAVE
      if (!fullAddressString) {
        // Try every possible address field from metadata
        fullAddressString = metadata.delivery_address || 
                           metadata.address || 
                           metadata.customer_address ||
                           metadata.shipping_address ||
                           JSON.stringify(metadata.delivery_address || {}) ||
                           'FALLBACK: Raw metadata available but address parsing failed';
        street = fullAddressString;
        
        // Log this so we can see what we're missing
        logStep("CRITICAL: Using ultimate fallback for address", {
          attempted_address: fullAddressString,
          all_metadata_keys: Object.keys(metadata),
          full_metadata: metadata
        });
      }

    } catch (addressParseError) {
      logStep("WARNING: Could not parse delivery address", { 
        error: addressParseError.message,
        rawAddress: metadata.delivery_address 
      });
      // Robust fallback
      fullAddressString = metadata.delivery_address ? metadata.delivery_address.toString() : 'Address parsing failed';
      street = fullAddressString;
    }

    logStep("Address parsing completed", {
      customerName,
      customerEmail,
      deliveryDate,
      deliveryTime,
      itemCount: cartItems.length,
      finalAddressData: { 
        street, 
        city, 
        state, 
        zip, 
        fullAddressString,
        willGoToShopifyAs: fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '') 
      }
    });

    // Create customer in Shopify
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

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
          const existingCustomer = searchResult.customers[0];
          shopifyCustomerId = existingCustomer.id;
          
          logStep("Found existing Shopify customer", { 
            customerId: shopifyCustomerId,
            existingEmail: existingCustomer.email 
          });

          // Update existing customer with latest info (phone, address)
          const updateData = {
            customer: {
              id: shopifyCustomerId,
              first_name: firstName || existingCustomer.first_name,
              last_name: lastName || existingCustomer.last_name,
              phone: customerPhone || existingCustomer.phone,
              note: `Delivery order (CST) - ${deliveryDate} at ${deliveryTime}${deliveryInstructions ? `. Instructions: ${deliveryInstructions}` : ''}`
            }
          };

          const updateResponse = await fetch(
            `https://${shopifyStore}/admin/api/2024-10/customers/${shopifyCustomerId}.json`,
            {
              method: 'PUT',
              headers: {
                'X-Shopify-Access-Token': shopifyToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData),
            }
          );

          if (updateResponse.ok) {
            logStep("Updated existing customer info", { customerId: shopifyCustomerId });
          }
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
            note: `Delivery order (CST) - ${deliveryDate} at ${deliveryTime}${deliveryInstructions ? `. Instructions: ${deliveryInstructions}` : ''}`,
            addresses: [{
              address1: street,
              city: city,
              province: state,
              country: "US",
              zip: zip,
              phone: customerPhone,
              default: true
            }],
            // Ensure customer can receive marketing emails
            accepts_marketing: true,
            marketing_opt_in_level: "single_opt_in"
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
          logStep("✅ New Shopify customer created with contact info", { 
            customerId: shopifyCustomerId,
            email: customerEmail,
            phone: customerPhone
          });
        } else {
          const errorText = await customerResponse.text();
          logStep("⚠️ Customer creation failed, order will continue without customer link", { 
            status: customerResponse.status,
            error: errorText
          });
        }
      } catch (customerError) {
        logStep("⚠️ Customer creation error, order will continue", { error: customerError.message });
      }
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

    logStep("Line items prepared (PRODUCTS ONLY)", { 
      itemCount: lineItems.length,
      productSubtotal: lineItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0),
      note: "Only actual products included as line items - delivery fee, tip, and tax handled separately"
    });

    // Extract affiliate code if present
    const affiliateCode = metadata.affiliate_code || '';

    // Create Shopify order with EXACT structure matching screenshot
    const orderData = {
      order: {
        // ONLY actual products as line items - NO TIP, NO FEES
        line_items: lineItems, // Just the real products
        
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
          company: `🚚 DELIVERY: ${deliveryDate} at ${deliveryTime}`,
          address1: street,
          address2: deliveryInstructions ? `📋 Instructions: ${deliveryInstructions}` : undefined,
          city: city,
          province: state,
          country: "US",
          zip: zip,
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
        
        // Shipping lines - ONLY delivery fee ($30.00)
        shipping_lines: orderAmounts.delivery_fee > 0 ? [{
          title: "Delivery Fee",
          price: orderAmounts.delivery_fee.toFixed(2),  // $30.00
          code: "LOCAL_DELIVERY"
        }] : [],
        
        // Tip handling - Use Shopify's NATIVE tip system (same as POS transactions)
        ...(orderAmounts.tip_amount > 0 ? {
          tip_payment_gateway: "stripe",
          tip_payment_method: "credit_card", 
          current_total_additional_fees_set: {
            shop_money: {
              amount: orderAmounts.tip_amount.toFixed(2),
              currency_code: "USD"
            },
            presentment_money: {
              amount: orderAmounts.tip_amount.toFixed(2),
              currency_code: "USD" 
            }
          }
        } : {}),
        
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
            value: fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '')
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
${fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '')}
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

    logStep("Creating Shopify order", { 
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
          order_number: shopifyOrder.name || shopifyOrder.order_number || `#${shopifyOrder.number}`,
          session_id: paymentIntentId || sessionId,
          shopify_order_id: shopifyOrder.id.toString(),
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: {
            street,
            city,
            state,
            zip,
            full_address: fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, ''),
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