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
    const { orderNumber } = await req.json();
    
    if (!orderNumber) {
      throw new Error("Order number is required");
    }

    // Get Shopify credentials
    const shopifyToken = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const shopifyStore = Deno.env.get("SHOPIFY_STORE_URL");
    
    if (!shopifyToken || !shopifyStore) {
      throw new Error("Shopify credentials not configured");
    }

    // First, find the order by order number
    const ordersResponse = await fetch(
      `https://${shopifyStore}/admin/api/2025-01/orders.json?name=${orderNumber}&status=any`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    
    if (!ordersData.orders || ordersData.orders.length === 0) {
      throw new Error("Order not found");
    }

    const order = ordersData.orders[0];

    // Get detailed order information including line items
    const orderResponse = await fetch(
      `https://${shopifyStore}/admin/api/2025-01/orders/${order.id}.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order details: ${orderResponse.status}`);
    }

    const orderData = await orderResponse.json();
    
    // Transform the line items to match our cart item format
    const items = orderData.order.line_items.map((item: any) => ({
      id: item.product_id?.toString() || item.id.toString(),
      title: item.title,
      name: item.name || item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image || '/placeholder.svg', // Fallback image
      variant: item.variant_title || undefined
    }));

    // Extract delivery information from order notes
    const note = orderData.order.note || '';
    const deliveryDateMatch = note.match(/📅 Delivery Date: ([^\n]+)/);
    const deliveryTimeMatch = note.match(/⏰ Delivery Time: ([^\n]+)/);
    const deliveryAddressMatch = note.match(/📍 Delivery Address: ([^\n]+)/);
    const instructionsMatch = note.match(/📝 Special Instructions: ([^\n]+)/);

    return new Response(JSON.stringify({
      success: true,
      order: {
        orderNumber: orderData.order.order_number || orderData.order.name,
        total: parseFloat(orderData.order.total_price),
        subtotal: parseFloat(orderData.order.subtotal_price),
        currency: orderData.order.currency,
        createdAt: orderData.order.created_at,
        status: orderData.order.financial_status,
        items: items,
        customer: {
          name: `${orderData.order.billing_address?.first_name || ''} ${orderData.order.billing_address?.last_name || ''}`.trim(),
          email: orderData.order.email,
          phone: orderData.order.phone
        },
        delivery: {
          date: deliveryDateMatch?.[1] || '',
          time: deliveryTimeMatch?.[1] || '',
          address: deliveryAddressMatch?.[1] || '',
          instructions: instructionsMatch?.[1] || ''
        },
        shippingAddress: orderData.order.shipping_address
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in get-shopify-order-details:", errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});