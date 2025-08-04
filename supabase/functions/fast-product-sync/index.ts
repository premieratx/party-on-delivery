import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Incremental sync for faster collection updates
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productIds, collectionHandle, operation = 'add' } = await req.json();

    console.log(`🚀 Fast sync: ${operation} ${productIds?.length || 0} products to collection ${collectionHandle}`);

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Product IDs array is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process in small batches for speed
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      // Handle the batch based on operation
      if (operation === 'add') {
        // Mark products as modified for this collection
        const { error: modError } = await supabase
          .from('product_modifications')
          .upsert(
            batch.map(productId => ({
              shopify_product_id: productId,
              collection: collectionHandle,
              product_title: `Product ${productId}`, // Will be updated by sync
              synced_to_shopify: false,
              app_synced: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'shopify_product_id,collection' }
          );

        if (modError) {
          console.error('Error creating modifications:', modError);
          results.push({ batch, success: false, error: modError.message });
        } else {
          results.push({ batch, success: true });
        }
      } else if (operation === 'remove') {
        // Remove product modifications for this collection
        const { error: removeError } = await supabase
          .from('product_modifications')
          .delete()
          .in('shopify_product_id', batch)
          .eq('collection', collectionHandle);

        if (removeError) {
          console.error('Error removing modifications:', removeError);
          results.push({ batch, success: false, error: removeError.message });
        } else {
          results.push({ batch, success: true });
        }
      }
    }

    // Clear relevant cache entries
    const cachePatterns = [
      `shopify_collections_%`,
      `shopify_products_%`,
      `delivery_app_%`,
      `collections_%`,
      `critical_products_%`
    ];

    for (const pattern of cachePatterns) {
      await supabase
        .from('cache')
        .delete()
        .like('key', pattern);
    }

    console.log(`✅ Fast sync completed: ${results.filter(r => r.success).length}/${results.length} batches successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fast sync completed for ${productIds.length} products`,
        results,
        operation,
        collectionHandle,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fast sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});