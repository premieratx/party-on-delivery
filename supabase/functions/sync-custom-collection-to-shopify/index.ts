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
    if (!product_ids || product_ids.length === 0) {
      console.log('No products to add to collection');
    }
    
    let shopifyProductIds: string[] = [];
    
    if (product_ids && product_ids.length > 0) {
      // Convert full Shopify GIDs to numeric IDs for the query
      const numericIds = product_ids.map((id: string) => {
        if (id.startsWith('gid://shopify/Product/')) {
          return id.replace('gid://shopify/Product/', '');
        }
        return id;
      });
      
      console.log('Converted product IDs:', numericIds);
      
      // Create query for Shopify products using numeric IDs
      const productIdsQuery = numericIds.map((id: string) => `id:${id}`).join(' OR ');
      
      const productsResponse = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/graphql.json`, {
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
                    title
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
      console.log('Products found:', productsData.data?.products?.edges?.map((edge: any) => edge.node.title) || []);

      // Extract Shopify product IDs
      shopifyProductIds = productsData.data?.products?.edges?.map((edge: any) => edge.node.id) || [];
    }

    // First, try to find the existing collection by handle
    const getCollectionResponse = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json?handle=${handle}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken
      }
    });

    const existingCollectionsData = await getCollectionResponse.json();
    let shopifyCollectionId;

    if (existingCollectionsData.custom_collections && existingCollectionsData.custom_collections.length > 0) {
      // Collection exists, use its ID
      shopifyCollectionId = existingCollectionsData.custom_collections[0].id;
      console.log('Found existing Shopify collection:', shopifyCollectionId);
      
      // Clear existing products from the collection first
      const collectsResponse = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects.json?collection_id=${shopifyCollectionId}&limit=250`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken
        }
      });
      
      const collectsData = await collectsResponse.json();
      if (collectsData.collects && collectsData.collects.length > 0) {
        console.log(`Removing ${collectsData.collects.length} existing products from collection`);
        const deletePromises = collectsData.collects.map(async (collect: any) => {
          try {
            await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects/${collect.id}.json`, {
              method: 'DELETE',
              headers: {
                'X-Shopify-Access-Token': shopifyAccessToken
              }
            });
          } catch (error) {
            console.warn('Error removing product from collection:', error);
          }
        });
        await Promise.allSettled(deletePromises);
      }
    } else {
      // Collection doesn't exist, create it
      const createCollectionResponse = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json`, {
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

      shopifyCollectionId = collectionData.custom_collection.id;
      console.log('Created new Shopify collection:', shopifyCollectionId);
    }
    console.log('Created Shopify collection:', shopifyCollectionId);

    // Add products to the collection (using REST API for collects)
    let addedProducts = 0;
    if (shopifyProductIds.length > 0) {
      const collectPromises = shopifyProductIds.map(async (productId: string) => {
        try {
          const collectResponse = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects.json`, {
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

          if (collectResponse.ok) {
            addedProducts++;
          } else {
            const error = await collectResponse.json();
            console.warn('Failed to add product to collection:', error);
          }
        } catch (error) {
          console.warn('Error adding product to collection:', error);
        }
      });

      // Wait for all products to be added
      await Promise.allSettled(collectPromises);
    }

    console.log(`Successfully created collection "${title}" in Shopify with ${addedProducts} products`);

    return new Response(
      JSON.stringify({
        success: true,
        shopify_collection_id: shopifyCollectionId,
        products_added: addedProducts
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