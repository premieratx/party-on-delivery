import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}][SHOPIFY-OPTIMIZER] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== SHOPIFY SYNC OPTIMIZER STARTED ===");

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN');
    const shopifyStore = Deno.env.get('SHOPIFY_STORE_URL') || "premier-concierge.myshopify.com";

    if (!supabaseUrl || !supabaseServiceKey || !shopifyToken) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    logStep("Environment validated, fetching fresh Shopify data");

    // 1. Fetch ALL products from Shopify directly
    let allProducts: any[] = [];
    let nextPageUrl = `https://${shopifyStore}/admin/api/2024-10/products.json?limit=250`;
    
    while (nextPageUrl) {
      logStep(`Fetching products from: ${nextPageUrl.split('?')[0]}`);
      
      const response = await fetch(nextPageUrl, {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      allProducts = allProducts.concat(data.products || []);
      
      // Check for pagination
      const linkHeader = response.headers.get('Link');
      nextPageUrl = null;
      
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) {
          nextPageUrl = nextMatch[1];
        }
      }
      
      logStep(`Batch complete: ${data.products?.length || 0} products. Total: ${allProducts.length}`);
    }

    logStep(`✅ Fetched ${allProducts.length} total products from Shopify`);

    // 2. Clear old product cache and insert fresh data
    logStep("Clearing old product cache");
    await supabase.from('shopify_products_cache').delete().neq('id', 0);

    // 3. Process and cache all products with collection data
    const collectionsMap = new Map<string, number>();
    const productsToInsert = [];
    
    for (const product of allProducts) {
      // Extract collections from product
      const collections: string[] = [];
      
      if (product.tags) {
        const tags = product.tags.split(',').map((tag: string) => tag.trim().toLowerCase());
        collections.push(...tags);
      }
      
      if (product.product_type) {
        const productType = product.product_type.toLowerCase().replace(/[^a-z0-9]/g, '-');
        collections.push(productType);
      }
      
      if (product.vendor) {
        const vendor = product.vendor.toLowerCase().replace(/[^a-z0-9]/g, '-');
        collections.push(`vendor-${vendor}`);
      }

      // Add default collections based on product type
      const title = product.title.toLowerCase();
      if (title.includes('beer')) collections.push('beer', 'tailgate-beer');
      if (title.includes('wine')) collections.push('wine');
      if (title.includes('spirit') || title.includes('whiskey') || title.includes('vodka')) collections.push('spirits');
      if (title.includes('cocktail') || title.includes('kit')) collections.push('cocktail-kits');
      if (title.includes('seltzer') || title.includes('hard seltzer')) collections.push('seltzer-collection');
      if (title.includes('mixer') || title.includes('soda') || title.includes('tonic')) collections.push('mixers-non-alcoholic');

      // Count products per collection
      collections.forEach(collection => {
        const handle = collection.toLowerCase().replace(/[^a-z0-9]/g, '-');
        collectionsMap.set(handle, (collectionsMap.get(handle) || 0) + 1);
      });

      // Prepare product for cache
      productsToInsert.push({
        id: product.id,
        title: product.title,
        handle: product.handle,
        product_type: product.product_type,
        vendor: product.vendor,
        data: {
          ...product,
          collections: collections.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, '-'))
        }
      });
    }

    // 4. Batch insert products
    logStep(`Inserting ${productsToInsert.length} products into cache`);
    const batchSize = 100;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('shopify_products_cache')
        .insert(batch);
      
      if (error) {
        logStep(`Batch insert error for items ${i}-${i + batchSize}:`, error.message);
      }
    }

    // 5. Build collection results with REAL counts
    const collections = Array.from(collectionsMap.entries())
      .filter(([handle, count]) => count >= 3) // Only collections with 3+ products
      .map(([handle, count]) => ({
        handle,
        name: handle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        title: handle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        products_count: count
      }))
      .sort((a, b) => b.products_count - a.products_count);

    logStep(`✅ Generated ${collections.length} collections with real product counts`, 
      collections.slice(0, 5).map(c => `${c.name}: ${c.products_count}`)
    );

    // 6. Cache the results
    const cacheData = {
      collections,
      total_products: allProducts.length,
      last_sync: new Date().toISOString(),
      collection_counts: Object.fromEntries(collectionsMap)
    };

    await supabase.from('cache').upsert({
      key: 'optimized_shopify_collections',
      data: cacheData,
      expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
    });

    logStep("=== SHOPIFY SYNC OPTIMIZER COMPLETED ===");

    return new Response(
      JSON.stringify({
        success: true,
        collections,
        total_products: allProducts.length,
        message: `Successfully synced ${allProducts.length} products and ${collections.length} collections`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("CRITICAL ERROR", { error: error.message, stack: error.stack });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Check edge function logs for detailed error information"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});