import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SHOPIFY-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const body = await req.json();
    const { paymentIntentId, isAddingToOrder, useSameAddress, sessionId } = body;
    if (!paymentIntentId && !sessionId) {
      throw new Error("Payment Intent ID or Session ID is required");
    }

    logStep("Payment Intent ID received", { 
      paymentIntentId, 
      isAddingToOrder, 
      useSameAddress, 
      sessionId,
      bodyKeys: Object.keys(body)
    });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get payment details from Stripe (either PaymentIntent or CheckoutSession)
    let metadata;
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        throw new Error("Payment not completed");
      }
      metadata = paymentIntent.metadata;
      logStep("Stripe payment intent retrieved", { status: paymentIntent.status });
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        throw new Error("Payment not completed");
      }
      metadata = session.metadata;
      logStep("Stripe checkout session retrieved", { status: session.payment_status });
    } else {
      throw new Error("No payment method specified");
    }

    // Get Shopify credentials
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
    
    if (!shopifyToken) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not configured");
    }

    // Parse cart items from metadata - with database fallback for large orders
    let cartItems = [];
    
    // First try to get cart data from order_drafts if referenced
    if (metadata?.cart_data_id) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        const { data: orderDraft, error } = await supabaseClient
          .from('order_drafts')
          .select('draft_data')
          .eq('id', metadata.cart_data_id)
          .single();
          
        if (!error && orderDraft?.draft_data?.cartItems) {
          cartItems = orderDraft.draft_data.cartItems;
          logStep("Cart items loaded from order_drafts", { 
            cartDataId: metadata.cart_data_id,
            itemCount: cartItems.length 
          });
        }
      } catch (dbError) {
        logStep("Failed to load cart data from database", dbError);
      }
    }
    
    // Fallback: try to parse from metadata (for backward compatibility)
    if (!cartItems || cartItems.length === 0) {
      try {
        if (metadata?.cart_items) {
          cartItems = JSON.parse(metadata.cart_items);
          logStep("Cart items parsed from metadata", { itemCount: cartItems.length });
        }
      } catch (parseError) {
        logStep("Failed to parse cart_items from metadata", parseError);
      }
    }
    
    // Final validation with detailed logging
    if (!cartItems || cartItems.length === 0) {
      logStep("CRITICAL: No cart items found anywhere", { 
        availableMetadataKeys: Object.keys(metadata || {}),
        cartDataId: metadata?.cart_data_id,
        isGroupOrder: !!groupOrderToken,
        groupOrderToken
      });
      throw new Error("No cart items found. Check order_drafts table and metadata structure.");
    }
    
    logStep("Cart items successfully loaded", { 
      itemCount: cartItems.length,
      source: metadata?.cart_data_id ? 'order_drafts' : 'metadata'
    });
    
    const deliveryDate = metadata?.delivery_date;
    const deliveryTime = metadata?.delivery_time;
    const deliveryAddress = metadata?.delivery_address;
    const deliveryInstructions = metadata?.delivery_instructions;
    const customerName = metadata?.customer_name;
    const customerPhone = metadata?.customer_phone;
    const customerEmail = metadata?.customer_email;
    const groupOrderNumber = metadata?.group_order_number;
    const groupOrderToken = metadata?.group_order_token; // New: detect if joining existing order
    const discountCode = metadata?.discount_code;
    const discountAmount = metadata?.discount_amount;
    const subtotal = parseFloat(metadata?.subtotal || '0');
    const shippingFee = parseFloat(metadata?.shipping_fee || '0');
    const salesTax = parseFloat(metadata?.sales_tax || '0');
    const tipAmount = parseFloat(metadata?.tip_amount || '0');
    const totalAmount = parseFloat(metadata?.total_amount || '0');
    
    // CRITICAL: Verify amounts match to prevent 100x errors
    const calculatedTotal = subtotal + shippingFee + salesTax + tipAmount;
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      throw new Error(`Shopify order amount mismatch: Metadata total $${totalAmount.toFixed(2)} doesn't match calculated total $${calculatedTotal.toFixed(2)}`);
    }
    
    // Validate reasonable amount range
    if (totalAmount < 0.50 || totalAmount > 10000) {
      throw new Error(`Invalid order amount: $${totalAmount.toFixed(2)}. Must be between $0.50 and $10,000.00`);
    }
    const affiliateCode = body.affiliateCode;

    logStep("Metadata parsed", { 
      itemCount: cartItems.length, 
      deliveryDate, 
      deliveryTime,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryInstructions,
      discountCode,
      discountAmount,
      subtotal,
      shippingFee,
      salesTax,
      tipAmount,
      totalAmount
    });

    // **GROUP ORDER DETECTION AND HANDLING**
    let isJoiningGroupOrder = false;
    let originalGroupOrderId = null;
    let shareToken = null;
    
    // Generate a unique share token for EVERY order (not just group orders)
    const crypto = globalThis.crypto;
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const defaultShareToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    
    if (groupOrderToken) {
      logStep("🔄 GROUP ORDER DETECTED - Processing group order join", { 
        groupOrderToken,
        customerEmail,
        customerName,
        cartItemsCount: cartItems.length,
        subtotal
      });
      
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Try to join the existing group order
        const { data: joinResult, error: joinError } = await supabaseClient.rpc('join_group_order', {
          p_share_token: groupOrderToken,
          p_customer_email: customerEmail,
          p_customer_name: customerName,
          p_line_items: cartItems,
          p_subtotal: subtotal
        });

        if (joinError) {
          logStep("Error joining group order", joinError);
        } else if (joinResult && joinResult.success) {
          isJoiningGroupOrder = true;
          originalGroupOrderId = joinResult.original_order_id;
          shareToken = joinResult.share_token;
          logStep("Successfully joined group order", { 
            originalOrderId: originalGroupOrderId,
            shareToken: shareToken 
          });
        } else {
          logStep("Group order join failed", joinResult);
        }
      } catch (groupError) {
        logStep("Exception in group order handling", groupError);
      }
    }
    
    // If not joining a group order, use the generated default share token
    if (!shareToken) {
      shareToken = defaultShareToken;
      logStep("Using generated share token for new order", { shareToken });
    }
    
    // Enhanced affiliate tracking calculations
    let affiliateCommissionAmount = 0;
    let discountType = '';
    let totalOrderValue = 0;
    let actualDiscountApplied = 0;
    
    // Calculate total order value and affiliate commission
    if (cartItems.length > 0) {
      totalOrderValue = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    }
    
    if (discountCode) {
      if (discountCode === 'PREMIER2025') {
        discountType = 'free_shipping';
        actualDiscountApplied = shippingFee;
        affiliateCommissionAmount = Math.round((totalOrderValue * 0.05) * 100) / 100; // 5% commission on order value
      } else if (discountCode === 'PARTYON10') {
        discountType = 'percentage_discount';
        actualDiscountApplied = Math.round((totalOrderValue * 0.10) * 100) / 100; // 10% discount
        affiliateCommissionAmount = Math.round((totalOrderValue * 0.08) * 100) / 100; // 8% commission on order value
      } else {
        // Future affiliate codes - default to 5% commission
        discountType = 'affiliate_code';
        actualDiscountApplied = parseFloat(discountAmount || '0');
        affiliateCommissionAmount = Math.round((totalOrderValue * 0.05) * 100) / 100;
      }
    }


    // Parse delivery address components
    const parseAddress = (fullAddress: string) => {
      const parts = fullAddress.split(',').map(part => part.trim());
      return {
        street: parts[0] || '',
        city: parts[1] || '',
        stateZip: parts[2] || '',
        state: parts[2]?.split(' ')[0] || '',
        zip: parts[2]?.split(' ')[1] || ''
      };
    };

    const addressParts = parseAddress(deliveryAddress || '');

    // Create customer in Shopify
    const customerData = {
      customer: {
        first_name: customerName?.split(' ')[0] || '',
        last_name: customerName?.split(' ').slice(1).join(' ') || '',
        email: customerEmail || '',
        phone: customerPhone || '',
        note: `Customer created from delivery order. Delivery scheduled: ${deliveryDate} at ${deliveryTime}${deliveryInstructions ? `. Instructions: ${deliveryInstructions}` : ''}`,
        addresses: [{
          address1: addressParts.street,
          city: addressParts.city,
          province: addressParts.state,
          country: "US",
          zip: addressParts.zip,
          phone: customerPhone || ''
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

    let shopifyCustomer;
    if (customerResponse.ok) {
      const customerResult = await customerResponse.json();
      shopifyCustomer = customerResult.customer;
      logStep("Shopify customer created", { customerId: shopifyCustomer.id });
    } else {
      logStep("Customer creation failed, continuing without customer", { 
        status: customerResponse.status 
      });
    }

    // Prepare line items for Shopify order with proper inventory management
    const lineItems = [];
    
    // Process each cart item to create proper Shopify line items
    for (const item of cartItems) {
      // If item has Shopify product/variant IDs, use them for proper inventory tracking
      if (item.id && item.id.includes('gid://shopify/Product/')) {
        // Extract Shopify product ID from GID
        const productId = item.id.replace('gid://shopify/Product/', '');
        
        // For products with variants, we need to find the correct variant
        if (item.variant && item.variant.includes('gid://shopify/ProductVariant/')) {
          const variantId = item.variant.replace('gid://shopify/ProductVariant/', '');
          lineItems.push({
            variant_id: parseInt(variantId),
            quantity: item.quantity,
            price: item.price.toString()
          });
        } else {
          // Use product without specific variant
          lineItems.push({
            title: item.title || item.name,
            price: item.price.toString(),
            quantity: item.quantity,
            requires_shipping: true,
            product_id: parseInt(productId)
          });
        }
      } else {
        // Fallback for items without Shopify IDs (custom items)
        lineItems.push({
          title: item.title || item.name,
          price: item.price.toString(),
          quantity: item.quantity,
          requires_shipping: true
        });
      }
    }

    // FIXED: Driver tip should NOT be included in line items - it's separate from taxable subtotal

    // Create order in Shopify with proper totals structure
    const orderData = {
      order: {
        customer: shopifyCustomer ? { id: shopifyCustomer.id } : undefined,
        billing_address: {
          first_name: customerName?.split(' ')[0] || '',
          last_name: customerName?.split(' ').slice(1).join(' ') || '',
          address1: addressParts.street,
          city: addressParts.city,
          province: addressParts.state,
          country: "US",
          zip: addressParts.zip,
          phone: customerPhone || '',
        },
        shipping_address: {
          first_name: customerName?.split(' ')[0] || '',
          last_name: customerName?.split(' ').slice(1).join(' ') || '',
          address1: addressParts.street,
          city: addressParts.city,
          province: addressParts.state,
          country: "US",
          zip: addressParts.zip,
          phone: customerPhone || '',
        },
        email: customerEmail || '',
        phone: customerPhone || '',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        
        // Set line items (products only - NO tip here)
        line_items: lineItems,
        
        // Add tip as a separate line item (non-taxable)
        ...(tipAmount > 0 && {
          tip_amount: tipAmount.toFixed(2)
        }),
        
        // Proper Shopify shipping lines structure
        shipping_lines: shippingFee > 0 ? [{
          title: "Local Delivery",
          price: shippingFee.toFixed(2),
          code: "LOCAL_DELIVERY"
        }] : [],
        
        // Proper Shopify tax lines structure (calculated on subtotal only, not tip)
        tax_lines: salesTax > 0 ? [{
          title: "Sales Tax",
          price: salesTax.toFixed(2),
          rate: 0.0825
        }] : [],
        
        // Apply discount codes properly with exact Shopify structure
        ...(discountCode && discountAmount && parseFloat(discountAmount) > 0 && {
          discount_applications: [{
            title: discountCode,
            description: `${discountCode} discount applied`,
            value: Math.abs(parseFloat(discountAmount)).toFixed(2),
            value_type: discountType === 'percentage_discount' ? 'percentage' : 'fixed_amount',
            allocation_method: "across",
            target_selection: "all",
            target_type: "line_item"
          }],
          discount_codes: [{
            code: discountCode,
            amount: Math.abs(parseFloat(discountAmount)).toFixed(2),
            type: discountType === 'percentage_discount' ? 'percentage' : 'fixed_amount'
          }]
        }),
        
        // Set totals to match Stripe charge exactly - precision formatting
        subtotal_price: subtotal.toFixed(2),
        total_tax: salesTax.toFixed(2),
        total_shipping_price_set: {
          shop_money: {
            amount: shippingFee.toFixed(2),
            currency_code: "USD"
          },
          presentment_money: {
            amount: shippingFee.toFixed(2),
            currency_code: "USD"
          }
        },
        
        // Tip is now included as line item above, so no separate tip field needed
        
        // Ensure exact price matching for order totals
        current_total_price: totalAmount.toFixed(2),
        total_price: totalAmount.toFixed(2),
        total_price_set: {
          shop_money: {
            amount: totalAmount.toFixed(2),
            currency_code: "USD"
          },
          presentment_money: {
            amount: totalAmount.toFixed(2),
            currency_code: "USD"
          }
        },
        note: `🚚 DELIVERY ORDER 🚚
📅 Delivery Date: ${deliveryDate}
⏰ Delivery Time: ${deliveryTime}
📍 Delivery Address: ${deliveryAddress}
${deliveryInstructions ? `📝 Special Instructions: ${deliveryInstructions}` : ''}
${discountCode ? `🎟️ Discount Code Used: ${discountCode} (${actualDiscountApplied > 0 ? `$${actualDiscountApplied.toFixed(2)} ${discountType === 'free_shipping' ? 'shipping discount' : 'off'}` : ''})` : ''}
💳 Stripe Payment ID: ${paymentIntentId}
✅ Payment Status: Paid

💰 PAYMENT BREAKDOWN (MATCHES STRIPE CHARGE):
Subtotal: $${subtotal.toFixed(2)}
${discountCode ? `Discount (${discountCode}): -$${Math.abs(parseFloat(discountAmount || '0')).toFixed(2)}` : ''}
Shipping: $${shippingFee.toFixed(2)}
Taxes: $${salesTax.toFixed(2)}
Tip: $${tipAmount.toFixed(2)}
TOTAL CHARGED: $${totalAmount.toFixed(2)}

🏷️ RECOMSALE AFFILIATE TRACKING:
${discountCode ? `📊 Affiliate Code: ${discountCode}
💰 Commission Amount: $${affiliateCommissionAmount.toFixed(2)}
📈 Order Value: $${totalOrderValue.toFixed(2)}
🔖 Discount Type: ${discountType}
💵 Discount Applied: $${actualDiscountApplied.toFixed(2)}
🎯 Attribution: ${discountCode}-tracking-${Date.now()}` : 'No affiliate code used'}`,
        tags: `delivery-order,stripe-payment${discountCode ? `,discount-${discountCode}` : ''}`,
        note_attributes: [
          {
            name: "Stripe Payment Total",
            value: `$${totalAmount.toFixed(2)}`
          },
          {
            name: "Subtotal",
            value: `$${subtotal.toFixed(2)}`
          },
          {
            name: "Delivery Fee",
            value: `$${shippingFee.toFixed(2)}`
          },
          {
            name: "Sales Tax",
            value: `$${salesTax.toFixed(2)}`
          },
            {
              name: "Driver Tip (Gratuity)",
              value: `$${tipAmount.toFixed(2)}`
            },
          ...(discountCode ? [
            {
              name: "RecomSale Affiliate Code",
              value: discountCode
            },
            {
              name: "Affiliate Commission Amount",
              value: `$${affiliateCommissionAmount.toFixed(2)}`
            },
            {
              name: "Order Value for Commission",
              value: `$${totalOrderValue.toFixed(2)}`
            },
            {
              name: "Discount Type",
              value: discountType
            },
            {
              name: "Actual Discount Applied",
              value: `$${actualDiscountApplied.toFixed(2)}`
            },
            {
              name: "RecomSale Tracking ID",
              value: `${discountCode}-${Date.now()}`
            },
            {
              name: "Attribution Timestamp",
              value: new Date().toISOString()
            }
          ] : [])
        ]
      }
    };

    logStep("Creating Shopify order", { lineItemCount: lineItems.length });

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
      logStep("Shopify order creation failed", { 
        status: orderResponse.status, 
        error: errorText 
      });
      throw new Error(`Failed to create Shopify order: ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    logStep("Shopify order created successfully", { 
      orderId: orderResult.order.id,
      orderNumber: orderResult.order.order_number 
    });

    // Track affiliate referral if affiliate code is provided
    if (affiliateCode) {
      try {
        logStep('Tracking affiliate referral', { affiliateCode });
        
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const { data: trackingResult, error: trackingError } = await supabaseService.functions.invoke('track-affiliate-referral', {
          body: {
            affiliateCode: affiliateCode,
            orderData: orderResult.order,
            customerEmail: customerEmail,
            orderId: orderResult.order.id.toString()
          }
        });

        if (trackingError) {
          logStep('Error tracking affiliate referral', trackingError);
        } else {
          logStep('Affiliate referral tracked', trackingResult);
        }
      } catch (affiliateError) {
        logStep('Error in affiliate tracking', affiliateError);
        // Don't fail the order creation if affiliate tracking fails
      }
    }

    // Store order group info in Supabase for potential future orders
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      let orderGroupId;
      let isNewGroup = false;

      // If this is a group order (friend adding to existing order), find the original order group
      if (groupOrderNumber) {
        const { data: originalOrder } = await supabaseClient
          .from('shopify_orders')
          .select('order_group_id')
          .eq('shopify_order_number', groupOrderNumber)
          .single();
        
        if (originalOrder?.order_group_id) {
          orderGroupId = originalOrder.order_group_id;
          logStep('Found existing order group for group order', { orderGroupId, groupOrderNumber });
        }
      }

      // If not a group order or if group order lookup failed, check for existing group by customer
      if (!orderGroupId) {
        const { data: existingGroup } = await supabaseClient
          .from('order_groups')
          .select('id')
          .eq('customer_email', customerEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        orderGroupId = existingGroup?.id;
      }

      // Create new order group if none exists
      if (!orderGroupId) {
        const { data: newGroup, error: groupError } = await supabaseClient
          .from('order_groups')
          .insert({
            customer_email: customerEmail,
            customer_name: customerName || '',
            customer_phone: customerPhone || '',
            delivery_address: addressParts.street || '',
            delivery_city: addressParts.city || '',
            delivery_state: addressParts.state || '',
            delivery_zip: addressParts.zip || '',
            delivery_instructions: deliveryInstructions || ''
          })
          .select('id')
          .single();

        if (groupError) {
          logStep('Error creating order group', groupError);
        } else {
          orderGroupId = newGroup?.id;
          isNewGroup = true;
          logStep('Created new order group', { orderGroupId });
        }
      }

      // Add this Shopify order to the group
      if (orderGroupId) {
        const { error: orderError } = await supabaseClient
          .from('shopify_orders')
          .insert({
            order_group_id: orderGroupId,
            shopify_order_id: orderResult.order.id.toString(),
            shopify_order_number: orderResult.order.order_number?.toString() || '',
            amount: parseFloat((orderResult.order.total_price || 0).toString()),
            currency: orderResult.order.currency || 'USD',
            status: 'completed'
          });

        if (orderError) {
          logStep('Error linking order to group', orderError);
        } else {
          logStep('Order linked to group successfully', { orderGroupId });
        }

        // Update Shopify order with group information
        try {
          let groupTags = isNewGroup ? 'delivery-group-1' : `delivery-group-${orderGroupId?.slice(-8)}`;
          
          // Add group bundle tag if this is a group order
          if (isJoiningGroupOrder || shareToken) {
            groupTags += ', group-bundle';
          }
          
          // Build tags array based on order type
          const tagArray = [groupTags];
          
          // Add discount tags if applicable
          if (discountCode) {
            tagArray.push(`discount-${discountCode}`, `affiliate-${discountCode}`);
          }
          
          // Check if this is a bundle order (second order to same address/time)
          const isBundleOrder = isAddingToOrder && useSameAddress;
          
          if (isBundleOrder) {
            // This is a second order being added - mark as bundle-order-placed
            tagArray.push('bundle-order-placed', 'delivery-bundle', 'free-shipping');
          } else {
            // This is a first purchase - mark as bundle-ready
            tagArray.push('bundle-ready');
          }
          
          const newTags = tagArray.join(', ');
          
          const updateUrl = `https://${shopifyStore}/admin/api/2024-10/orders/${orderResult.order.id}.json`;
          
          await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken
            },
            body: JSON.stringify({
              order: {
                id: orderResult.order.id,
                tags: `${orderResult.order.tags || ''}, ${newTags}`.replace(/^, /, ''),
                note: `${orderResult.order.note || ''}

🔗 ORDER GROUP: ${orderGroupId}
📦 BUNDLING: This order can be bundled with other orders in the same group for delivery efficiency.
${discountCode ? `🏷️ AFFILIATE TRACKING: Discount code "${discountCode}" used for affiliate sales tracking.` : ''}`
              }
            })
          });
          
          logStep('Updated Shopify order with group info', { groupTags, orderGroupId });
        } catch (updateError) {
          logStep('Error updating Shopify order with group info', updateError);
        }
      }
    } catch (supabaseError) {
      logStep('Error with Supabase operations', supabaseError);
      // Don't fail the order creation if Supabase operations fail
    }

    // Store customer order in database for dashboard tracking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // ALWAYS create customer order record for ALL orders (individual and group)
    try {
      // Check if order already exists to prevent duplicates
      const { data: existingOrder } = await supabaseClient
        .from('customer_orders')
        .select('id, share_token')
        .or(`session_id.eq.${sessionId || paymentIntentId},shopify_order_id.eq.${orderResult.order.id.toString()}`)
        .maybeSingle();

      let customerOrder;
      if (existingOrder) {
        logStep('Order already exists, skipping duplicate creation', { existingOrderId: existingOrder.id });
        shareToken = existingOrder.share_token;
        customerOrder = existingOrder;
      } else {
        const customerOrderData = {
          order_number: orderResult.order.order_number,
          customer_id: null, // Will be linked when user logs in
          session_id: sessionId || paymentIntentId,
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: {
            street: addressParts.street,
            city: addressParts.city,
            state: addressParts.state,
            zipCode: addressParts.zip,
            instructions: deliveryInstructions
          },
          line_items: cartItems,
          subtotal: subtotal,
          delivery_fee: shippingFee,
          total_amount: totalAmount,
          shopify_order_id: orderResult.order.id.toString(),
          status: 'confirmed',
          affiliate_code: affiliateCode,
          affiliate_id: null, // Will be populated by affiliate tracking
          is_group_order: isJoiningGroupOrder,
          group_order_id: isJoiningGroupOrder ? originalGroupOrderId : null,
          // ALWAYS set the share_token for ALL orders (group or individual)
          share_token: shareToken,
          is_shareable: true, // Always make orders shareable
        };

        const { data: newOrder, error: customerOrderError } = await supabaseClient
          .from('customer_orders')
          .insert(customerOrderData)
          .select('share_token, id')
          .single();

        if (!customerOrderError && newOrder) {
          shareToken = newOrder.share_token; // Get the generated or existing share_token
          customerOrder = newOrder;
          logStep('Customer order record created', { 
            shareToken, 
            orderId: newOrder.id,
            isGroupOrder: isJoiningGroupOrder,
            orderType: isJoiningGroupOrder ? 'group-addition' : 'new-order',
            isShareable: true
          });
        } else {
          logStep('Error creating customer order record', customerOrderError);
        }
      }
    } catch (orderStoreError) {
      logStep('Exception storing customer order', orderStoreError);
    }

    // Send group order confirmation email with share link
    try {
      const emailData = {
        orderDetails: {
          orderNumber: orderResult.order.order_number,
          deliveryDate,
          deliveryTime,
          deliveryAddress,
          deliveryInstructions
        },
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        deliveryInfo: {
          date: deliveryDate,
          timeSlot: deliveryTime,
          address: deliveryAddress,
          instructions: deliveryInstructions
        },
        cartItems: cartItems,
        paymentInfo: {
          subtotal: subtotal,
          deliveryFee: shippingFee,
          salesTax: salesTax,
          tipAmount: tipAmount,
          discountCode: discountCode,
          discountAmount: parseFloat(discountAmount || '0'),
          total: totalAmount
        },
        shopifyOrderInfo: {
          shopifyOrderId: orderResult.order.id,
          orderNumber: orderResult.order.order_number
        },
        shareToken: shareToken,
        isGroupOrder: isJoiningGroupOrder,
        groupParticipants: [] // Will be populated for joined orders
      };

      // Use the new group order confirmation function
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-group-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
        },
        body: JSON.stringify(emailData)
      });

      if (emailResponse.ok) {
        logStep('Group order confirmation email sent successfully');
      } else {
        const emailError = await emailResponse.text();
        logStep('Failed to send group order confirmation email', { error: emailError });
      }
    } catch (emailError) {
      logStep('Error sending group order confirmation email', emailError);
      // Don't fail the order creation if email fails
    }

    // Send SMS notification
    try {
      if (customerPhone) {
        const smsMessage = `Thank you for ordering from Party On Delivery, we've got your order! Add more items with FREE shipping using code PREMIER2025: ${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '').replace('https://acmlfzfliqupwxwoefdq.supabase.co', 'https://party-on-delivery.lovable.app')}`;
        
        const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ghl-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
          },
          body: JSON.stringify({
            phone: customerPhone,
            message: smsMessage
          })
        });

        if (smsResponse.ok) {
          logStep('SMS notification sent successfully');
        } else {
          const smsError = await smsResponse.text();
          logStep('Failed to send SMS notification', { error: smsError });
        }
      }
    } catch (smsError) {
      logStep('Error sending SMS notification', smsError);
      // Don't fail the order creation if SMS fails
    }

    // Sync customer order data with real-time update
    try {
      const syncResult = await supabaseClient.functions.invoke('sync-customer-order-realtime', {
        body: {
          sessionId: sessionId || paymentIntentId,
          paymentIntentId,
          orderData: {
            customerEmail: customerEmail,
            customerName: customerName,
            customerPhone: customerPhone,
            orderNumber: orderResult.order.order_number,
            shopifyOrderId: orderResult.order.id,
            totalAmount: Number(totalAmount),
            subtotal: Number(subtotal),
            shippingFee: Number(shippingFee),
            deliveryDate: deliveryDate,
            deliveryTime: deliveryTime,
            deliveryAddress: addressParts.street,
            deliveryCity: addressParts.city,
            deliveryState: addressParts.state,
            deliveryZip: addressParts.zip,
            deliveryInstructions: deliveryInstructions,
            lineItems: cartItems,
            discountCode,
            affiliateCode
          }
        }
      });
      
      if (syncResult.error) {
        console.error('Error syncing customer order:', syncResult.error);
      } else {
        logStep("Customer order synced successfully", syncResult.data);
      }
    } catch (syncError) {
      console.error('Error calling sync function:', syncError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      shopifyOrderId: orderResult.order.id,
      orderNumber: orderResult.order.order_number,
      order: orderResult.order
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-shopify-order", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});