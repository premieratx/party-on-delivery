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

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      throw new Error("Payment Intent ID is required");
    }

    logStep("Payment Intent ID received", { paymentIntentId });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new Error("Payment not completed");
    }

    logStep("Stripe payment intent retrieved", { status: paymentIntent.status });

    // Get Shopify credentials
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL");
    
    if (!shopifyToken || !shopifyStore) {
      throw new Error("Shopify credentials not configured");
    }

    // Parse cart items from metadata
    const cartItems = JSON.parse(paymentIntent.metadata?.cart_items || '[]');
    const deliveryDate = paymentIntent.metadata?.delivery_date;
    const deliveryTime = paymentIntent.metadata?.delivery_time;
    const deliveryAddress = paymentIntent.metadata?.delivery_address;
    const deliveryInstructions = paymentIntent.metadata?.delivery_instructions;
    const customerName = paymentIntent.metadata?.customer_name;
    const customerPhone = paymentIntent.metadata?.customer_phone;
    const customerEmail = paymentIntent.metadata?.customer_email;

    logStep("Metadata parsed", { 
      itemCount: cartItems.length, 
      deliveryDate, 
      deliveryTime,
      customerName,
      deliveryInstructions 
    });

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
      `https://${shopifyStore}/admin/api/2025-01/customers.json`,
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

    // Prepare line items for Shopify order
    const lineItems = cartItems.map((item: any) => ({
      title: item.title || item.name,
      price: item.price.toString(), // Convert number to string for Shopify
      quantity: item.quantity,
      requires_shipping: true,
    }));

    // Create order in Shopify
    const orderData = {
      order: {
        line_items: lineItems,
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
        note: `🚚 DELIVERY ORDER 🚚
📅 Delivery Date: ${deliveryDate}
⏰ Delivery Time: ${deliveryTime}
📍 Delivery Address: ${deliveryAddress}
${deliveryInstructions ? `📝 Special Instructions: ${deliveryInstructions}` : ''}
💳 Stripe Payment ID: ${paymentIntentId}
✅ Payment Status: Paid`,
        tags: `delivery-order, delivery-${deliveryDate}, stripe-${paymentIntentId}`,
        shipping_lines: [{
          title: "Scheduled Delivery Service",
          price: "5.99",
          code: "DELIVERY"
        }]
      }
    };

    logStep("Creating Shopify order", { lineItemCount: lineItems.length });

    const orderResponse = await fetch(
      `https://${shopifyStore}/admin/api/2025-01/orders.json`,
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

      // Check if order group exists for this customer
      const { data: existingGroup } = await supabaseClient
        .from('order_groups')
        .select('id')
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let orderGroupId = existingGroup?.id;

      // Create new order group if none exists or if last order was more than 24 hours ago
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
      }
    } catch (supabaseError) {
      logStep('Error with Supabase operations', supabaseError);
      // Don't fail the order creation if Supabase operations fail
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