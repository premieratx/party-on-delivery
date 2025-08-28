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
    logStep("=== CREATE SHOPIFY ORDER STARTED (FIXED VERSION) ===");

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
            subtotal: orderDraft.draft_data.subtotal || 0,
            delivery_fee: orderDraft.draft_data.delivery_fee || 0,
            sales_tax: orderDraft.draft_data.sales_tax || 0,
            tip_amount: orderDraft.draft_data.tip_amount || 0,
            total_amount: orderDraft.total_amount || 0
          };
          logStep("Order data loaded from database", { 
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

    // Check for duplicate orders before creating
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

    // Validate payment amount
    const totalDifference = Math.abs(paymentAmount - orderAmounts.total_amount);
    
    logStep("Using stored total_amount directly", {
      paymentAmount,
      storedTotalAmount: orderAmounts.total_amount,
      difference: totalDifference,
      breakdown: orderAmounts
    });
    
    if (totalDifference > 0.02) {
      logStep("ERROR: Amount mismatch", {
        paymentAmount,
        calculatedTotal: orderAmounts.total_amount,
        difference: totalDifference,
        breakdown: orderAmounts
      });
      throw new Error(`Payment amount mismatch: Payment $${paymentAmount} vs Order $${orderAmounts.total_amount}`);
    }

    logStep("Amount validation passed", { 
      paymentAmount,
      calculatedTotal: orderAmounts.total_amount,
      difference: totalDifference
    });

    // Extract customer and delivery info
    const customerName = metadata.customer_name || '';
    const customerEmail = metadata.customer_email || '';
    const customerPhone = metadata.customer_phone || '';
    const deliveryDate = metadata.delivery_date || '';
    const deliveryTime = metadata.delivery_time || '';
    const deliveryInstructions = metadata.delivery_instructions || '';

    // FIXED: Enhanced address parsing with proper metadata extraction
    let street = '';
    let city = '';
    let state = '';
    let zip = '';
    let fullAddressString = '';

    logStep("Raw delivery address data received", {
      delivery_address: metadata.delivery_address,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      type: typeof metadata.delivery_address
    });

    try {
      // First, try to get from delivery_address in metadata
      let deliveryAddressSource = metadata.delivery_address;
      
      // If delivery_address is empty, try alternative metadata keys
      if (!deliveryAddressSource || deliveryAddressSource.trim() === '') {
        deliveryAddressSource = metadata.shipping_address || 
                               metadata.address || 
                               metadata.customer_address ||
                               '';
      }
      
      logStep("Address parsing attempt", { 
        delivery_address: deliveryAddressSource,
        all_metadata_keys: Object.keys(metadata),
        type: typeof deliveryAddressSource
      });

      if (deliveryAddressSource && typeof deliveryAddressSource === 'string' && deliveryAddressSource.trim() !== '') {
        // Parse standard address format: "123 Main St, City, ST 12345"
        const addressParts = deliveryAddressSource.split(',').map(part => part.trim());
        
        if (addressParts.length >= 3) {
          street = addressParts[0];
          city = addressParts[1];
          const stateZipPart = addressParts[2];
          
          // Extract state and ZIP from "ST 12345" format
          const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
          
          if (stateZipMatch) {
            state = stateZipMatch[1].toUpperCase();
            zip = stateZipMatch[2];
          } else {
            // Fallback: use parts as-is
            const parts = stateZipPart.split(' ');
            state = parts[0] || '';
            zip = parts.slice(1).join(' ') || '';
          }
        } else if (addressParts.length === 2) {
          // Format: "123 Main St, City ST"
          street = addressParts[0];
          city = addressParts[1]; 
        } else {
          // Single string - use as street
          street = deliveryAddressSource;
        }
        
        // Build full address string
        fullAddressString = deliveryAddressSource;
        
      } else if (deliveryAddressSource && typeof deliveryAddressSource === 'object') {
        // Handle JSON object format
        const addrObj = deliveryAddressSource;
        street = addrObj.street || addrObj.address || addrObj.line1 || addrObj.address1 || '';
        city = addrObj.city || '';
        state = addrObj.state || addrObj.province || '';
        zip = addrObj.zip || addrObj.zipCode || addrObj.postal_code || '';
        
        // Build full address string from parts
        const parts = [street, city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean);
        fullAddressString = parts.join(', ');
        
      } else {
        // CRITICAL: If no address found, this is a major issue
        logStep("CRITICAL: No delivery address found in metadata", {
          all_metadata: metadata,
          attempted_sources: ['delivery_address', 'shipping_address', 'address', 'customer_address']
        });
        
        // Set error message that will be visible in Shopify
        street = 'DELIVERY ADDRESS MISSING - CHECK CHECKOUT FLOW';
        city = 'UNKNOWN';
        state = 'UNKNOWN';
        zip = 'UNKNOWN';
        fullAddressString = 'DELIVERY ADDRESS MISSING - CHECK CHECKOUT FLOW';
      }
      
    } catch (addressParseError) {
      logStep("WARNING: Address parsing error", { 
        error: addressParseError.message,
        rawAddress: metadata.delivery_address 
      });
      street = 'ADDRESS PARSING ERROR';
      city = 'UNKNOWN';
      state = 'UNKNOWN';
      zip = 'UNKNOWN';
      fullAddressString = 'ADDRESS PARSING ERROR';
    }

    logStep("ENHANCED ADDRESS PARSING COMPLETED", {
      street, 
      city, 
      state, 
      zip, 
      fullAddressString,
      willDisplayInShopifyAs: fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '') 
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
            verified_email: false,
            accepts_marketing: false
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
          logStep("Created new Shopify customer", { customerId: shopifyCustomerId });
        } else {
          const errorText = await customerResponse.text();
          logStep("Customer creation failed", { error: errorText });
        }
      } catch (customerError) {
        logStep("Customer creation error", { error: customerError.message });
      }
    }

    // SHOPIFY STANDARD ORDER STRUCTURE - Following Official Documentation
    
    // Build line items - ONLY ACTUAL PRODUCTS (NO TIPS/FEES)
    const lineItems = [];
    let productSubtotal = 0;
    
    cartItems.forEach((item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemTotal = itemPrice * itemQuantity;
      productSubtotal += itemTotal;
      
      const lineItem = {
        title: item.title || item.name,
        price: itemPrice.toFixed(2),
        quantity: itemQuantity,
        requires_shipping: true,
        taxable: true,
        fulfillment_service: "manual"
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
    });

    // FIXED: Build shipping lines (delivery fee + driver tip)
    const shippingLines = [];
    const deliveryFeeInDollars = orderAmounts.delivery_fee || 0;
    const tipAmountInDollars = orderAmounts.tip_amount || 0;
    
    // Add delivery fee
    if (deliveryFeeInDollars > 0) {
      shippingLines.push({
        title: "Delivery Service",
        price: deliveryFeeInDollars.toFixed(2),
        code: "DELIVERY",
        source: "delivery_app"
      });
    }
    
    // FIXED: Add driver tip to shipping lines (NOT as line item)
    if (tipAmountInDollars > 0) {
      shippingLines.push({
        title: "Driver Tip",
        price: tipAmountInDollars.toFixed(2),
        code: "DRIVER_TIP",
        source: "delivery_app"
      });
    }

    // Build tax lines (Shopify standard for taxes)  
    const taxLines = [];
    if (orderAmounts.sales_tax > 0) {
      taxLines.push({
        title: "Sales Tax",
        price: orderAmounts.sales_tax.toFixed(2),
        rate: orderAmounts.sales_tax / (productSubtotal || 1), // Calculate actual rate
        price_set: {
          shop_money: {
            amount: orderAmounts.sales_tax.toFixed(2),
            currency_code: "USD"
          }
        }
      });
    }

    logStep("SHOPIFY STANDARD STRUCTURE PREPARED", { 
      lineItemCount: lineItems.length,
      productCount: cartItems.length,
      productSubtotal: productSubtotal.toFixed(2),
      shippingLineCount: shippingLines.length,
      taxLineCount: taxLines.length,
      deliveryFee: deliveryFeeInDollars,
      tipAmount: tipAmountInDollars,
      salesTax: orderAmounts.sales_tax
    });

    // Extract affiliate code if present
    const affiliateCode = metadata.affiliate_code || '';

    // Create Shopify order with OFFICIAL SHOPIFY STRUCTURE
    const orderData = {
      order: {
        // PRODUCTS ONLY in line_items (Shopify standard)
        line_items: lineItems,
        
        // DELIVERY FEE + DRIVER TIP in shipping_lines (Shopify standard)
        shipping_lines: shippingLines,
        
        // SALES TAX in tax_lines (Shopify standard) 
        tax_lines: taxLines,
        
        customer: shopifyCustomerId ? { id: shopifyCustomerId } : undefined,
        
        // Billing address (customer's billing info)
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
        
        // Shipping address (delivery address)
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          company: `DELIVERY: ${deliveryDate} at ${deliveryTime}`,
          address1: street,
          address2: deliveryInstructions ? `Instructions: ${deliveryInstructions}` : undefined,
          city: city,
          province: state,
          country: "US",
          zip: zip,
          phone: customerPhone
        },
        
        email: customerEmail,
        phone: customerPhone,
        
        // CORRECT SHOPIFY TOTALS - Products only in subtotal, tip with shipping
        subtotal_price: productSubtotal.toFixed(2), // Products only
        total_shipping_price_set: (deliveryFeeInDollars + tipAmountInDollars) > 0 ? {
          shop_money: {
            amount: (deliveryFeeInDollars + tipAmountInDollars).toFixed(2),
            currency_code: "USD"
          }
        } : undefined,
        total_tax: orderAmounts.sales_tax.toFixed(2),
        total_price: orderAmounts.total_amount.toFixed(2),
        
        // Custom attributes for delivery details
        note_attributes: [
          {
            name: "Delivery Date", 
            value: deliveryDate
          },
          {
            name: "Delivery Time",
            value: deliveryTime
          },
          {
            name: "Full Delivery Address",
            value: fullAddressString || `${street}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '')
          },
          {
            name: "Special Instructions",
            value: deliveryInstructions || "None"
          },
          {
            name: "Driver Tip Amount",
            value: `$${tipAmountInDollars.toFixed(2)}`
          },
          {
            name: "Stripe Payment ID",
            value: paymentIntentId || sessionId
          }
        ].filter(attr => attr.value && attr.value.trim() !== '' && attr.value !== 'None'),
        
        // Comprehensive order notes
        note: `DELIVERY ORDER (CST) - ${deliveryDate} at ${deliveryTime}

DELIVERY ADDRESS: 
${street}
${city}, ${state} ${zip}
Customer: ${customerPhone}
${deliveryInstructions ? `SPECIAL INSTRUCTIONS: ${deliveryInstructions}` : 'SPECIAL INSTRUCTIONS: None'}

PAYMENT BREAKDOWN:
• Product Subtotal: $${productSubtotal.toFixed(2)}
• Delivery Fee: $${deliveryFeeInDollars.toFixed(2)}  
• Sales Tax: $${orderAmounts.sales_tax.toFixed(2)}
• Driver Tip: $${tipAmountInDollars.toFixed(2)}
• TOTAL PAID: $${orderAmounts.total_amount.toFixed(2)}

STRIPE CONFIRMATION: ${paymentIntentId || sessionId}
${affiliateCode ? `AFFILIATE: ${affiliateCode}` : ''}

NOTE: Order structure follows Shopify standards - delivery fee in shipping_lines, tax in tax_lines, tip as line item.`,
        
        // Financial status
        financial_status: "paid",
        
        // Tags for tracking and filtering
        tags: [
          "delivery-order",
          "stripe-paid", 
          "shopify-standard-structure",
          affiliateCode ? `affiliate-${affiliateCode}` : null,
          tipAmountInDollars > 0 ? "has-tip" : "no-tip",
          `tip-${tipAmountInDollars.toFixed(2).replace('.', '_')}`,
          `delivery-${deliveryDate}`
        ].filter(Boolean).join(", "),
        
        // Transaction record showing payment completed
        transactions: [{
          amount: orderAmounts.total_amount.toFixed(2),
          kind: "sale",
          gateway: "stripe",
          status: "success",
          source_name: "web"
        }]
      }
    };

    logStep("Creating Shopify order with STANDARD STRUCTURE", { 
      totalAmount: orderAmounts.total_amount,
      lineItemCount: lineItems.length,
      shippingLineCount: shippingLines.length,
      taxLineCount: taxLines.length,
      addressFormatted: `${street}, ${city}, ${state} ${zip}`
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
        throw new Error(`Shopify order creation failed: ${orderResponse.status} - ${errorText}`);
      }

      const orderResult = await orderResponse.json();
      const shopifyOrderId = orderResult.order.id;
      const orderNumber = orderResult.order.order_number;

      logStep("✅ SHOPIFY ORDER CREATED SUCCESSFULLY (STANDARD STRUCTURE)", {
        shopifyOrderId,
        orderNumber,
        totalAmount: orderResult.order.total_price,
        subtotalPrice: orderResult.order.subtotal_price,
        totalTax: orderResult.order.total_tax,
        shippingAddress: orderResult.order.shipping_address
      });

      // Store the order in our database
      try {
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        const { error: insertError } = await supabaseClient
          .from('customer_orders')
          .insert({
            order_number: orderNumber.toString(),
            shopify_order_id: shopifyOrderId.toString(),
            session_id: paymentIntentId || sessionId,
            payment_intent_id: paymentIntentId,
            customer_id: null, // We might not have auth user
            subtotal: productSubtotal, // Products only (tip now in shipping)
            delivery_fee: deliveryFeeInDollars,
            total_amount: orderAmounts.total_amount,
            status: 'confirmed',
            delivery_date: deliveryDate || null,
            delivery_time: deliveryTime || null,
            delivery_address: {
              street: street,
              city: city,
              state: state,
              zip: zip,
              full_address: fullAddressString,
              instructions: deliveryInstructions
            },
            line_items: cartItems,
            special_instructions: deliveryInstructions,
            affiliate_code: affiliateCode || null
          });

        if (insertError) {
          logStep("WARNING: Failed to store order in database", { error: insertError.message });
        } else {
          logStep("Order stored in database successfully");
        }
      } catch (dbError) {
        logStep("WARNING: Database storage failed", { error: dbError.message });
      }

      return new Response(
        JSON.stringify({
          success: true,
          shopify_order_id: shopifyOrderId.toString(),
          order_number: orderNumber.toString(),
          total_amount: orderAmounts.total_amount,
          subtotal: productSubtotal, // Products only
          delivery_fee: deliveryFeeInDollars,
          sales_tax: orderAmounts.sales_tax,
          tip_amount: tipAmountInDollars,
          shipping_address: orderResult.order.shipping_address,
          message: "Order created successfully - driver tip moved to shipping_lines with delivery fee"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } catch (orderError) {
      logStep("ERROR: Order creation failed", { 
        error: orderError.message,
        stack: orderError.stack 
      });
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

  } catch (error) {
    logStep("=== CRITICAL ERROR ===", {
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});