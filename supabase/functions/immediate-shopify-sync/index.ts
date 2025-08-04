import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting immediate Shopify sync...');

    // Step 1: Fetch latest products from Shopify with retry
    console.log('📦 Fetching products from Shopify...');
    const { data: shopifyData, error: shopifyError } = await withRetry(
      () => supabase.functions.invoke('fetch-shopify-products', {
        body: { forceRefresh: true }
      })
    );

    if (shopifyError) {
      console.error('❌ Shopify fetch error:', shopifyError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Shopify fetch failed: ${shopifyError.message}`,
          details: shopifyError.stack 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('✅ Shopify products fetched successfully');

    // Step 2: Clear existing cache entries
    console.log('🗑️ Clearing cache...');
    try {
      const { error: cacheError } = await supabase
        .from('cache')
        .delete()
        .like('key', '%products%');

      if (cacheError) {
        console.warn('⚠️ Cache clear warning:', cacheError.message);
      } else {
        console.log('✅ Cache cleared successfully');
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache clear error (non-critical):', cacheError);
    }

    // Step 3: Process any pending product modifications
    console.log('🔄 Processing pending modifications...');
    const { data: pendingMods, error: modsError } = await supabase
      .from('product_modifications')
      .select('*')
      .eq('synced_to_shopify', false);

    if (modsError) {
      console.warn('⚠️ Error fetching modifications:', modsError);
    } else if (pendingMods && pendingMods.length > 0) {
      console.log(`🔄 Found ${pendingMods.length} pending modifications to sync`);
      
      // Group by collection for batch sync
      const collectionGroups = new Map();
      pendingMods.forEach(mod => {
        if (mod.collection) {
          if (!collectionGroups.has(mod.collection)) {
            collectionGroups.set(mod.collection, []);
          }
          collectionGroups.get(mod.collection).push(mod.shopify_product_id);
        }
      });

      console.log(`📦 Processing ${collectionGroups.size} collections...`);

      // Sync each collection
      for (const [collectionTitle, productIds] of collectionGroups.entries()) {
        try {
          const handle = collectionTitle.toLowerCase().replace(/\s+/g, '-');
          console.log(`🔄 Syncing collection "${collectionTitle}" with ${productIds.length} products...`);
          
          const { data: syncResult, error: syncError } = await withRetry(
            () => supabase.functions.invoke('sync-custom-collection-to-shopify', {
              body: {
                collection_id: `custom-${handle}`,
                title: collectionTitle,
                handle: handle,
                description: `Custom collection: ${collectionTitle}`,
                product_ids: productIds
              }
            })
          );

          if (syncError) {
            console.error(`❌ Error syncing collection "${collectionTitle}":`, syncError);
            throw syncError;
          } else {
            console.log(`✅ Successfully synced collection "${collectionTitle}" to Shopify:`, syncResult);
            
            // Mark products as synced to Shopify
            const { error: updateError } = await supabase
              .from('product_modifications')
              .update({ 
                synced_to_shopify: true,
                updated_at: new Date().toISOString()
              })
              .in('shopify_product_id', productIds);

            if (updateError) {
              console.error(`❌ Error marking products as synced:`, updateError);
            } else {
              console.log(`✅ Marked ${productIds.length} products as synced to Shopify`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing collection "${collectionTitle}":`, error);
          throw error; // Re-throw to fail the entire sync if any collection fails
        }
      }
    } else {
      console.log('ℹ️ No pending modifications to sync');
    }

    // Step 4: Sync to app
    console.log('📱 Syncing to app...');
    const { data: appSyncData, error: appSyncError } = await withRetry(
      () => supabase.functions.invoke('sync-products-to-app')
    );

    if (appSyncError) {
      console.warn('⚠️ App sync warning:', appSyncError.message);
    } else {
      console.log('✅ App sync completed successfully');
    }

    // Step 5: Update cache with fresh data
    console.log('💾 Updating cache with fresh data...');
    try {
      const cacheKey = 'shopify_products_latest';
      const { error: cacheUpsertError } = await supabase.rpc('safe_cache_upsert', {
        cache_key: cacheKey,
        cache_data: shopifyData,
        expires_timestamp: Date.now() + (5 * 60 * 1000) // 5 minutes
      });

      if (cacheUpsertError) {
        console.warn('⚠️ Cache upsert warning:', cacheUpsertError.message);
      } else {
        console.log('✅ Cache updated successfully');
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache update error (non-critical):', cacheError);
    }

    console.log('🎉 Immediate Shopify sync completed successfully');

    // Return success with sync details
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Immediate Shopify sync completed successfully',
        details: {
          shopifyProductsCount: shopifyData?.products?.length || 0,
          pendingModsProcessed: pendingMods?.length || 0,
          cacheUpdated: true,
          appSyncCompleted: !appSyncError,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Immediate sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unexpected error during immediate sync',
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});