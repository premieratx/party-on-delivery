import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('🔄 Force Product Sync: Starting immediate sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Clearing cache tables...');
    
    // Clear cache tables first
    await supabase.from('cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('🚀 Calling fetch-shopify-products...');
    
    // Call the working fetch-shopify-products function
    const { data: productsData, error: productsError } = await supabase.functions.invoke('fetch-shopify-products', {
      body: { force: true }
    });

    if (productsError) {
      console.error('❌ Products fetch failed:', productsError);
      throw new Error(`Fetch failed: ${productsError.message}`);
    }

    console.log('✅ Products fetched successfully, count:', productsData?.count || 0);
    
    // Store products in cache using service role permissions
    if (productsData?.products && Array.isArray(productsData.products)) {
      console.log(`💾 Storing ${productsData.products.length} products in cache...`);
      
      const productsToStore = productsData.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        data: product,
        updated_at: new Date().toISOString()
      }));
      
      const { error: storeError } = await supabase
        .from('shopify_products_cache')
        .upsert(productsToStore, { onConflict: 'id' });
        
      if (storeError) {
        console.error('❌ Failed to store products:', storeError);
        throw new Error(`Storage failed: ${storeError.message}`);
      }
      
      console.log(`✅ Successfully stored ${productsData.products.length} products in cache`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product sync completed successfully',
        data: productsData,
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