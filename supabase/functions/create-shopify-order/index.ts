import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Session ID received", { sessionId });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    logStep("Stripe session retrieved", { paymentStatus: session.payment_status });

    // Get Shopify credentials
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL");
    
    if (!shopifyToken || !shopifyStore) {
      throw new Error("Shopify credentials not configured");
    }

    // Parse cart items from metadata
    const cartItems = JSON.parse(session.metadata?.cart_items || '[]');
    const deliveryDate = session.metadata?.delivery_date;
    const deliveryTime = session.metadata?.delivery_time;
    const deliveryAddress = session.metadata?.delivery_address;
    const customerName = session.metadata?.customer_name;
    const customerPhone = session.metadata?.customer_phone;

    logStep("Metadata parsed", { 
      itemCount: cartItems.length, 
      deliveryDate, 
      deliveryTime,
      customerName 
    });

    // Create customer in Shopify
    const customerData = {
      customer: {
        first_name: customerName?.split(' ')[0] || '',
        last_name: customerName?.split(' ').slice(1).join(' ') || '',
        email: session.customer_details?.email || '',
        phone: customerPhone || '',
        addresses: [{
          address1: deliveryAddress || '',
          city: "City", // You might want to parse this from deliveryAddress
          province: "State",
          country: "US",
          zip: "00000"
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
      title: item.name,
      price: item.price.replace('$', ''),
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
          address1: deliveryAddress || '',
          city: "City",
          province: "State",
          country: "US",
          zip: "00000",
          phone: customerPhone || '',
        },
        shipping_address: {
          first_name: customerName?.split(' ')[0] || '',
          last_name: customerName?.split(' ').slice(1).join(' ') || '',
          address1: deliveryAddress || '',
          city: "City",
          province: "State",
          country: "US",
          zip: "00000",
          phone: customerPhone || '',
        },
        email: session.customer_details?.email || '',
        phone: customerPhone || '',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        note: `Delivery scheduled for ${deliveryDate} at ${deliveryTime}. Stripe Session: ${sessionId}`,
        tags: `delivery-${deliveryDate}, stripe-${sessionId}`,
        shipping_lines: [{
          title: "Delivery Service",
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
      throw new Error(`Failed to create Shopify order: ${orderText}`);
    }

    const orderResult = await orderResponse.json();
    logStep("Shopify order created successfully", { 
      orderId: orderResult.order.id,
      orderNumber: orderResult.order.order_number 
    });

    return new Response(JSON.stringify({ 
      success: true,
      shopifyOrderId: orderResult.order.id,
      orderNumber: orderResult.order.order_number
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