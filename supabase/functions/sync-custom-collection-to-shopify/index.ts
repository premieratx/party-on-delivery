import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collection_id, title, handle, description, product_ids } = await req.json();
    
    console.log('Syncing custom collection to Shopify:', { collection_id, title, handle, product_ids_count: product_ids?.length });

    const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN');

    if (!shopifyStoreUrl || !shopifyAccessToken) {
      throw new Error('Missing Shopify configuration');
    }

    // First, get the actual Shopify product IDs from our product IDs
    // We need to map our internal product IDs to Shopify product IDs
    const productIdsQuery = product_ids.map((id: string) => `id:${id}`).join(' OR ');
    
    const productsResponse = await fetch(`${shopifyStoreUrl}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken
      },
      body: JSON.stringify({
        query: `
          query getProducts($query: String!) {
            products(first: 100, query: $query) {
              edges {
                node {
                  id
                  handle
                }
              }
            }
          }
        `,
        variables: {
          query: productIdsQuery
        }
      })
    });

    const productsData = await productsResponse.json();
    console.log('Found products for collection:', productsData.data?.products?.edges?.length || 0);

    // Extract Shopify product IDs
    const shopifyProductIds = productsData.data?.products?.edges?.map((edge: any) => edge.node.id) || [];

    // Create the collection in Shopify
    const createCollectionResponse = await fetch(`${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken
      },
      body: JSON.stringify({
        custom_collection: {
          title: title,
          handle: handle,
          body_html: description || '',
          published: true
        }
      })
    });

    const collectionData = await createCollectionResponse.json();
    
    if (!createCollectionResponse.ok) {
      console.error('Failed to create Shopify collection:', collectionData);
      throw new Error(`Shopify API error: ${collectionData.errors || 'Unknown error'}`);
    }

    const shopifyCollectionId = collectionData.custom_collection.id;
    console.log('Created Shopify collection:', shopifyCollectionId);

    // Add products to the collection (using REST API for collects)
    const collectPromises = shopifyProductIds.map(async (productId: string) => {
      const collectResponse = await fetch(`${shopifyStoreUrl}/admin/api/2025-01/collects.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken
        },
        body: JSON.stringify({
          collect: {
            collection_id: shopifyCollectionId,
            product_id: productId.replace('gid://shopify/Product/', '') // Extract numeric ID
          }
        })
      });

      if (!collectResponse.ok) {
        const error = await collectResponse.json();
        console.warn('Failed to add product to collection:', error);
      }
    });

    // Wait for all products to be added
    await Promise.allSettled(collectPromises);

    console.log(`Successfully created collection "${title}" in Shopify with ${shopifyProductIds.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        shopify_collection_id: shopifyCollectionId,
        products_added: shopifyProductIds.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error syncing collection to Shopify:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})