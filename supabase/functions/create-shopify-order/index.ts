import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 CREATE SHOPIFY ORDER - Starting...");
    
    const body = await req.json();
    console.log("📦 Request body received:", body);

    const { 
      paymentIntentId,
      cartItems,
      customerInfo,
      deliveryInfo,
      amounts
    } = body;

    // Validate required data
    if (!paymentIntentId) {
      throw new Error("Payment Intent ID is required");
    }
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart items are required");
    }
    if (!customerInfo?.email) {
      throw new Error("Customer email is required");
    }

    console.log("✅ Data validation passed");

    // Get Shopify credentials
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    if (!shopifyToken) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN not configured");
    }

    console.log("🔑 Shopify token retrieved");

    // Create line items for Shopify
    const lineItems = cartItems.map((item: any) => ({
      title: item.title || item.name,
      quantity: item.quantity,
      price: parseFloat(item.price || "0").toFixed(2),
      variant_id: item.variant_id || null,
      requires_shipping: true
    }));

    console.log("📝 Line items created:", lineItems.length);

    // Create Shopify order
    const orderData = {
      order: {
        line_items: lineItems,
        customer: {
          email: customerInfo.email,
          first_name: customerInfo.firstName || "Customer",
          last_name: customerInfo.lastName || "",
          phone: customerInfo.phone || ""
        },
        billing_address: {
          first_name: customerInfo.firstName || "Customer",
          last_name: customerInfo.lastName || "",
          address1: deliveryInfo?.address || "Address Required",
          city: "Austin",
          province: "TX",
          country: "US",
          zip: "78701",
          phone: customerInfo.phone || ""
        },
        shipping_address: {
          first_name: customerInfo.firstName || "Customer",
          last_name: customerInfo.lastName || "",
          address1: deliveryInfo?.address || "Address Required",
          address2: deliveryInfo?.instructions || "",
          city: "Austin",
          province: "TX",
          country: "US",
          zip: "78701",
          phone: customerInfo.phone || ""
        },
        email: customerInfo.email,
        subtotal_price: amounts?.subtotal?.toFixed(2) || "0.00",
        total_price: amounts?.totalAmount?.toFixed(2) || "0.00",
        financial_status: "paid",
        note: `Delivery: ${deliveryInfo?.date || 'TBD'} at ${deliveryInfo?.time || 'TBD'}`,
        tags: "delivery-order,webapp",
        transactions: [{
          amount: amounts?.totalAmount?.toFixed(2) || "0.00",
          kind: "sale",
          gateway: "stripe",
          status: "success"
        }]
      }
    };

    console.log("🏪 Creating Shopify order...");

    const response = await fetch(
      "https://premier-concierge.myshopify.com/admin/api/2024-10/orders.json",
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Shopify API error:", errorText);
      throw new Error(`Shopify API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Shopify order created:", result.order.name);

    return new Response(
      JSON.stringify({
        success: true,
        shopify_order_id: result.order.id,
        order_number: result.order.name,
        message: "Order created successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Error:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});