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

    console.log('🚀 Direct sync with storage...');
    
    // Directly fetch and store products using our existing working fetch function
    const SHOPIFY_STORE = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not set");
    }
    
    // GraphQL query to fetch products
    const query = `
      query {
        products(first: 250, query: "status:active") {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              description
              productType
              vendor
              tags
              collections(first: 20) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;
    const maxPages = 10;
    
    while (hasNextPage && pageCount < maxPages) {
      const paginatedQuery = cursor ? 
        query.replace('first: 250, query: "status:active"', `first: 250, after: "${cursor}", query: "status:active"`) : 
        query;
      
      const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: paginatedQuery }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      if (!data.data?.products) {
        break;
      }

      // Process products
      const pageProducts = data.data.products.edges.map(({ node: product }: any) => {
        const variant = product.variants.edges[0]?.node;
        const image = product.images.edges[0]?.node;
        
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description || '',
          price: variant ? variant.price : '0',
          image: image?.url || '/placeholder.svg',
          vendor: product.vendor || '',
          productType: product.productType || '',
          tags: product.tags || [],
          collections: product.collections.edges.map(({ node }: any) => ({
            id: node.id,
            title: node.title,
            handle: node.handle
          })),
          variants: product.variants.edges.map(({ node: v }: any) => ({
            id: v.id,
            title: v.title,
            price: parseFloat(v.price),
            available: v.availableForSale
          }))
        };
      });

      allProducts = allProducts.concat(pageProducts);
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
      pageCount++;
      
      console.log(`Page ${pageCount} loaded ${pageProducts.length} products. Total: ${allProducts.length}`);
    }
    
    console.log(`✅ Fetched ${allProducts.length} products, now storing...`);
    
    // Store products in cache
    if (allProducts.length > 0) {
      const productsToStore = allProducts.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        data: product,
        updated_at: new Date().toISOString()
      }));
      
      // Clear existing cache first
      await supabase.from('shopify_products_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: storeError } = await supabase
        .from('shopify_products_cache')
        .insert(productsToStore);
        
      if (storeError) {
        console.error('❌ Failed to store products:', storeError);
        throw new Error(`Storage failed: ${storeError.message}`);
      }
      
      console.log(`✅ Successfully stored ${allProducts.length} products in cache`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product sync completed successfully',
        count: allProducts.length,
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