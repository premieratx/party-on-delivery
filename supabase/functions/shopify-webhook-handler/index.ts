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