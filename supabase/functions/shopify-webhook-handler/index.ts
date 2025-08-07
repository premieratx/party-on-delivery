import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookData = await req.json()
    const topic = req.headers.get('X-Shopify-Topic')
    
    console.log(`📨 Received Shopify webhook: ${topic}`)

// Handle different webhook types
switch (topic) {
  case 'collections/update':
  case 'collections/create':
    await handleCollectionUpdate(supabase, webhookData)
    break
  
  case 'products/update':
  case 'products/create':
    await handleProductUpdate(supabase, webhookData)
    break
    
  case 'orders/paid':
  case 'orders/create':
    await handleOrderUpdate(supabase, webhookData)
    break
    
  default:
    console.log(`ℹ️ Unhandled webhook topic: ${topic}`)
}

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleCollectionUpdate(supabase: any, collection: any) {
  console.log(`🔄 Updating collection cache: ${collection.handle}`)
  
  // Clear collection cache
  await supabase
    .from('cache')
    .delete()
    .eq('key', `shopify_collection_${collection.handle}`)
    
  // Trigger app refresh for this collection
  await supabase.functions.invoke('sync-products-to-app', {
    body: { collection_handle: collection.handle, incremental: true }
  })
}

async function handleProductUpdate(supabase: any, product: any) {
  console.log(`🔄 Updating product cache: ${product.id}`)
  
  // Clear product-related caches
  await supabase
    .from('cache')
    .delete()
    .like('key', '%product%')
    
  // Update product in our cache
  await supabase
    .from('shopify_products_cache')
    .upsert({
      shopify_id: product.id.toString(),
      title: product.title,
      handle: product.handle,
      data: product,
      updated_at: new Date().toISOString()
    })
}

async function handleOrderUpdate(supabase: any, order: any) {
  console.log(`📦 Processing order webhook: ${order.id}`)
  
  // Process line items to handle tips correctly
  const processedLineItems = order.line_items?.map((item: any) => {
    // If this is a tip item, mark it as such for proper Shopify handling
    if (item.title?.toLowerCase().includes('tip') || 
        item.title?.toLowerCase().includes('driver') ||
        item.sku?.toLowerCase().includes('tip')) {
      return {
        ...item,
        is_tip: true,
        tip_amount: parseFloat(item.price || "0")
      };
    }
    return item;
  }) || [];

  // Calculate subtotal excluding tips for proper order formatting
  const tipItems = processedLineItems.filter((item: any) => item.is_tip);
  const regularItems = processedLineItems.filter((item: any) => !item.is_tip);
  const tipTotal = tipItems.reduce((sum: number, item: any) => sum + (item.tip_amount || 0), 0);
  const itemsSubtotal = regularItems.reduce((sum: number, item: any) => sum + (parseFloat(item.price || "0") * item.quantity), 0);
  
  // Standardize order format for processing with proper tip handling
  const standardOrder = {
    shopify_order_id: order.id.toString(),
    order_number: order.order_number || order.name,
    customer_email: order.email || order.customer?.email,
    customer_phone: order.phone || order.customer?.phone,
    total_price: parseFloat(order.total_price) || 0,
    subtotal_price: itemsSubtotal, // Excluding tips
    total_tax: parseFloat(order.total_tax) || 0,
    tip_amount: tipTotal, // Separate tip amount
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    line_items: processedLineItems,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    note: order.note,
    tags: order.tags,
    source_name: order.source_name
  }
  
  // Store order in our system
  await supabase
    .from('shopify_orders_cache')
    .upsert(standardOrder, { onConflict: 'shopify_order_id' })
  
  console.log(`✅ Order ${order.id} processed with tip handling - Tips: $${tipTotal}, Subtotal: $${itemsSubtotal}`)
  
  // If order is paid, trigger order processing
  if (order.financial_status === 'paid') {
    await supabase.functions.invoke('process-order-complete', {
      body: { order: standardOrder }
    })
  }
}