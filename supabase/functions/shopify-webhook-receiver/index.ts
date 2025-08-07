import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

interface ShopifyWebhookPayload {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  number: number;
  note: string;
  token: string;
  gateway: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  financial_status: string;
  confirmed: boolean;
  total_discounts: string;
  total_line_items_price: string;
  cart_token: string;
  buyer_accepts_marketing: boolean;
  name: string;
  referring_site: string;
  landing_site: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  total_price_usd: string;
  checkout_token: string;
  reference: string;
  user_id: number | null;
  location_id: number | null;
  source_identifier: string;
  source_url: string;
  processed_at: string;
  device_id: number | null;
  phone: string;
  customer_locale: string;
  app_id: number;
  browser_ip: string;
  client_details: {
    browser_ip: string;
    accept_language: string;
    user_agent: string;
    session_hash: string;
    browser_width: number;
    browser_height: number;
  };
  landing_site_ref: string;
  order_number: number;
  discount_applications: any[];
  discount_codes: any[];
  note_attributes: any[];
  payment_gateway_names: string[];
  processing_method: string;
  checkout_id: number;
  source_name: string;
  fulfillment_status: string | null;
  tax_lines: any[];
  tags: string;
  contact_email: string;
  order_status_url: string;
  presentment_currency: string;
  total_line_items_price_set: any;
  total_discounts_set: any;
  total_shipping_price_set: any;
  subtotal_price_set: any;
  total_price_set: any;
  total_tax_set: any;
  line_items: Array<{
    id: number;
    variant_id: number;
    title: string;
    quantity: number;
    sku: string;
    variant_title: string;
    vendor: string;
    fulfillment_service: string;
    product_id: number;
    requires_shipping: boolean;
    taxable: boolean;
    gift_card: boolean;
    name: string;
    variant_inventory_management: string;
    properties: any[];
    product_exists: boolean;
    fulfillable_quantity: number;
    grams: number;
    price: string;
    total_discount: string;
    fulfillment_status: string | null;
    price_set: any;
    total_discount_set: any;
    discount_allocations: any[];
    duties: any[];
    admin_graphql_api_id: string;
    tax_lines: any[];
  }>;
  billing_address: any;
  shipping_address: any;
  fulfillments: any[];
  refunds: any[];
  customer: {
    id: number;
    email: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id: number;
    note: string;
    verified_email: boolean;
    multipass_identifier: string | null;
    tax_exempt: boolean;
    phone: string;
    tags: string;
    last_order_name: string;
    currency: string;
    accepts_marketing_updated_at: string;
    marketing_opt_in_level: string | null;
    tax_exemptions: any[];
    admin_graphql_api_id: string;
    default_address: any;
  };
}

// Verify Shopify webhook signature
async function verifyShopifyWebhook(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async (req) => {
  console.log(`🔔 Shopify Webhook: ${req.method} request received`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get webhook signature and topic
    const signature = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    
    console.log(`📋 Webhook Details:`, {
      topic,
      shopDomain,
      hasSignature: !!signature
    });

    // Get request body
    const body = await req.text();
    
    // Verify webhook signature (recommended for production)
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const isValid = await verifyShopifyWebhook(body, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log('✅ Webhook signature verified');
    }

    const payload: ShopifyWebhookPayload = JSON.parse(body);
    
    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(supabase, payload);
        break;
      
      case 'orders/updated':
        await handleOrderUpdate(supabase, payload);
        break;
      
      case 'orders/paid':
        await handleOrderPaid(supabase, payload);
        break;
      
      case 'orders/cancelled':
        await handleOrderCancelled(supabase, payload);
        break;
      
      case 'orders/fulfilled':
        await handleOrderFulfilled(supabase, payload);
        break;
      
      case 'products/create':
      case 'products/update':
      case 'collections/create':
      case 'collections/update':
      case 'inventory_levels/update':
        await handleProductUpdate(supabase, payload);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook topic: ${topic}`);
    }

    console.log(`✅ Successfully processed ${topic} webhook`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${topic} webhook`,
      orderId: payload.id || payload.number
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// Handle new order creation
async function handleOrderCreate(supabase: any, order: ShopifyWebhookPayload) {
  console.log(`📝 Processing new order: ${order.name} (${order.id})`);
  
  try {
    // Store order in shopify_orders_cache table
    const { error } = await supabase
      .from('shopify_orders_cache')
      .upsert({
        shopify_order_id: order.id.toString(),
        order_number: order.name,
        email: order.email,
        total_price: parseFloat(order.total_price),
        currency: order.currency,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        order_data: order,
        created_at: order.created_at,
        updated_at: order.updated_at
      });

    if (error) {
      console.error('Error storing order:', error);
      throw error;
    }

    // Send confirmation email or SMS if configured
    await sendOrderConfirmation(supabase, order);
    
    console.log(`✅ Order ${order.name} stored successfully`);
  } catch (error) {
    console.error(`❌ Error processing order ${order.name}:`, error);
    throw error;
  }
}

// Handle order updates
async function handleOrderUpdate(supabase: any, order: ShopifyWebhookPayload) {
  console.log(`🔄 Updating order: ${order.name} (${order.id})`);
  
  try {
    const { error } = await supabase
      .from('shopify_orders_cache')
      .update({
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        order_data: order,
        updated_at: order.updated_at
      })
      .eq('shopify_order_id', order.id.toString());

    if (error) throw error;
    
    console.log(`✅ Order ${order.name} updated successfully`);
  } catch (error) {
    console.error(`❌ Error updating order ${order.name}:`, error);
    throw error;
  }
}

// Handle order payment
async function handleOrderPaid(supabase: any, order: ShopifyWebhookPayload) {
  console.log(`💰 Order paid: ${order.name} (${order.id})`);
  
  try {
    const { error } = await supabase
      .from('shopify_orders_cache')
      .update({
        financial_status: 'paid',
        order_data: order,
        updated_at: order.updated_at
      })
      .eq('shopify_order_id', order.id.toString());

    if (error) throw error;
    
    // Send payment confirmation
    await sendPaymentConfirmation(supabase, order);
    
    console.log(`✅ Payment processed for order ${order.name}`);
  } catch (error) {
    console.error(`❌ Error processing payment for order ${order.name}:`, error);
    throw error;
  }
}

// Handle order cancellation
async function handleOrderCancelled(supabase: any, order: ShopifyWebhookPayload) {
  console.log(`❌ Order cancelled: ${order.name} (${order.id})`);
  
  try {
    const { error } = await supabase
      .from('shopify_orders_cache')
      .update({
        financial_status: order.financial_status,
        fulfillment_status: 'cancelled',
        order_data: order,
        updated_at: order.updated_at
      })
      .eq('shopify_order_id', order.id.toString());

    if (error) throw error;
    
    console.log(`✅ Order ${order.name} marked as cancelled`);
  } catch (error) {
    console.error(`❌ Error cancelling order ${order.name}:`, error);
    throw error;
  }
}

// Handle order fulfillment
async function handleOrderFulfilled(supabase: any, order: ShopifyWebhookPayload) {
  console.log(`📦 Order fulfilled: ${order.name} (${order.id})`);
  
  try {
    const { error } = await supabase
      .from('shopify_orders_cache')
      .update({
        fulfillment_status: 'fulfilled',
        order_data: order,
        updated_at: order.updated_at
      })
      .eq('shopify_order_id', order.id.toString());

    if (error) throw error;
    
    // Send fulfillment notification
    await sendFulfillmentNotification(supabase, order);
    
    console.log(`✅ Order ${order.name} marked as fulfilled`);
  } catch (error) {
    console.error(`❌ Error fulfilling order ${order.name}:`, error);
    throw error;
  }
}

// Handle product/collection/inventory updates
async function handleProductUpdate(supabase: any, data: any) {
  console.log(`🔄 Product/collection/inventory updated: ${data.id}`);
  
  try {
    // Invalidate all product-related caches
    await Promise.all([
      // Clear instant cache
      supabase.from('cache').delete().eq('key', 'instant-product-cache'),
      // Clear other product caches
      supabase.from('cache').delete().ilike('key', '%product%'),
      supabase.from('cache').delete().ilike('key', '%collection%'),
      supabase.from('cache').delete().ilike('key', '%shopify%')
    ]);
    
    // Trigger background cache refresh for instant loading
    setTimeout(async () => {
      try {
        await supabase.functions.invoke('instant-product-cache', {
          body: { forceRefresh: true }
        });
        console.log('✅ Background cache refresh triggered');
      } catch (error) {
        console.error('⚠️ Background cache refresh failed:', error);
      }
    }, 1000); // Small delay to ensure cache clearing is complete
    
    console.log(`✅ Product cache invalidated and refresh triggered`);
  } catch (error) {
    console.error(`❌ Error handling product update:`, error);
    throw error;
  }
}

// Send order confirmation
async function sendOrderConfirmation(supabase: any, order: ShopifyWebhookPayload) {
  try {
    if (order.email && order.email !== 'guest@example.com') {
      console.log(`📧 Sending order confirmation to ${order.email}`);
      
      // You can call your existing email function here
      await supabase.functions.invoke('send-order-confirmation-email', {
        body: {
          email: order.email,
          orderNumber: order.name,
          orderDetails: order
        }
      });
    }
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    // Don't throw - this is non-critical
  }
}

// Send payment confirmation
async function sendPaymentConfirmation(supabase: any, order: ShopifyWebhookPayload) {
  try {
    if (order.email && order.email !== 'guest@example.com') {
      console.log(`💳 Sending payment confirmation to ${order.email}`);
      
      // Implement payment confirmation logic here
    }
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    // Don't throw - this is non-critical
  }
}

// Send fulfillment notification
async function sendFulfillmentNotification(supabase: any, order: ShopifyWebhookPayload) {
  try {
    if (order.email && order.email !== 'guest@example.com') {
      console.log(`📦 Sending fulfillment notification to ${order.email}`);
      
      // Implement fulfillment notification logic here
    }
  } catch (error) {
    console.error('Error sending fulfillment notification:', error);
    // Don't throw - this is non-critical
  }
}