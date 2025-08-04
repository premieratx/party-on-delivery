import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry wrapper for API calls
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Check if error is retryable (5xx, network errors)
      const isRetryable = error?.status >= 500 || 
                         error?.status === 429 || 
                         error?.name === 'TypeError' ||
                         error?.message?.includes('fetch');
      
      if (!isRetryable) break;
      
      console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Starting sync-products-to-app function...');

    // Get all synced product modifications that haven't been synced to app yet
    const { data: modifications, error: modificationsError } = await supabase
      .from('product_modifications')
      .select('*')
      .eq('synced_to_shopify', true)
      .eq('app_synced', false);

    if (modificationsError) {
      console.error('❌ Error fetching modifications:', modificationsError);
      throw modificationsError;
    }

    console.log(`📊 Found ${modifications?.length || 0} products to sync to app`);

    if (!modifications || modifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No products to sync to app',
          syncedCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh product data from Shopify to ensure we have latest info
    console.log('📦 Fetching fresh product data from Shopify...');
    const { data: shopifyResponse, error: shopifyError } = await withRetry(
      () => supabase.functions.invoke('fetch-shopify-products', {
        body: { forceRefresh: true }
      })
    );
    
    if (shopifyError) {
      console.error('❌ Error fetching Shopify products:', shopifyError);
      throw shopifyError;
    }

    if (!shopifyResponse?.products) {
      throw new Error('No products received from Shopify');
    }

    console.log(`✅ Fetched ${shopifyResponse.products.length} products from Shopify`);

    // Create a map of Shopify products for easy lookup
    const shopifyProductsMap = new Map();
    shopifyResponse.products.forEach((product: any) => {
      shopifyProductsMap.set(product.id, product);
    });

    let syncedCount = 0;
    let errors: string[] = [];

    // Process each modification and update app data
    for (const modification of modifications) {
      try {
        const shopifyProduct = shopifyProductsMap.get(modification.shopify_product_id);
        
        if (!shopifyProduct) {
          console.warn(`⚠️ Product ${modification.shopify_product_id} not found in Shopify data`);
          errors.push(`Product ${modification.product_title} not found in Shopify`);
          continue;
        }

        console.log(`🔄 Syncing to app: ${modification.product_title}`);

        // Update the modification record to mark as app_synced
        const { error: updateError } = await supabase
          .from('product_modifications')
          .update({ 
            app_synced: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', modification.id);

        if (updateError) {
          console.error(`❌ Error updating modification ${modification.id}:`, updateError);
          errors.push(`Failed to mark ${modification.product_title} as app synced`);
          continue;
        }

        syncedCount++;
        console.log(`✅ Successfully synced to app: ${modification.product_title}`);

      } catch (error) {
        console.error(`❌ Error processing modification ${modification.id}:`, error);
        errors.push(`Error processing ${modification.product_title}: ${error.message}`);
      }
    }

    // Clear cache to force refresh of collections in delivery app
    console.log('🗑️ Clearing cache to trigger app refresh...');
    
    try {
      // Clear collections cache
      await supabase.from('cache').delete().eq('key', 'shopify-collections');
      await supabase.from('cache').delete().like('key', '%products%');
      console.log('✅ Cache cleared successfully');
      
      // Force refresh of collections
      await withRetry(
        () => supabase.functions.invoke('get-all-collections', {
          body: { forceRefresh: true }
        })
      );
      console.log('✅ Collections refreshed successfully');
      
    } catch (cacheError) {
      console.warn('⚠️ Cache refresh warning (non-critical):', cacheError);
      // Don't fail the whole operation for cache issues
    }

    console.log(`🎉 App sync complete: ${syncedCount} products synced successfully`);

    if (errors.length > 0) {
      console.warn('⚠️ Some errors occurred during sync:', errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedCount} products to app`,
        syncedCount,
        totalProcessed: modifications.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in sync-products-to-app function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to sync products to app',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})