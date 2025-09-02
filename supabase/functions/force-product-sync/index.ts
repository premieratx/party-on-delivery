import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Force Product Sync: Starting immediate sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear existing cache to force fresh data
    console.log('🧹 Clearing stale cache...');
    await supabase.from('cache').delete().like('key', '%instant-product%');
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Force sync using the working fetch-shopify-products function
    console.log('🚀 Triggering fresh product sync...');
    const { data: productsData, error: productsError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { force: true }
    });

    if (productsError) {
      console.error('❌ Products fetch failed:', productsError);
      throw productsError;
    }

    console.log('✅ Products fetched successfully');

    // Insert products into cache
    if (productsData?.products && Array.isArray(productsData.products)) {
      console.log(`💾 Caching ${productsData.products.length} products...`);
      
      const productsToInsert = productsData.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        data: product,
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('shopify_products_cache')
        .upsert(productsToInsert, { onConflict: 'id' });

      if (insertError) {
        console.error('❌ Cache insert failed:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully cached ${productsData.products.length} products`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product sync completed successfully',
        products_synced: productsData?.products?.length || 0,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Force sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});