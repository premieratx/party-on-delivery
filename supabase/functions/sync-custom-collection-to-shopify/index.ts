import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting helper
async function rateLimitedDelay(ms = 500) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for API calls with better rate limiting
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add rate limiting delay before each attempt
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff starting from attempt 1
        console.log(`⏳ Rate limiting delay: ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await rateLimitedDelay(delay);
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Check if error is retryable (5xx, network errors, rate limits)
      const isRetryable = error?.status >= 500 || 
                         error?.status === 429 || 
                         error?.name === 'TypeError' ||
                         error?.message?.includes('fetch') ||
                         error?.message?.includes('Exceeded') ||
                         error?.message?.includes('Too Many Requests');
      
      if (!isRetryable) {
        console.error(`Non-retryable error:`, error);
        break;
      }
      
      console.warn(`Retryable error on attempt ${attempt + 1}:`, error?.message || error);
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
    const { collection_id, title, handle, description, product_ids } = await req.json();
    
    console.log('🔄 Starting Shopify collection sync:', { 
      collection_id, 
      title, 
      handle, 
      product_ids_count: product_ids?.length 
    });

    const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN');

    if (!shopifyStoreUrl || !shopifyAccessToken) {
      throw new Error('Missing Shopify configuration - check SHOPIFY_STORE_URL and SHOPIFY_ADMIN_API_ACCESS_TOKEN');
    }

    // Validate input
    if (!title || !handle) {
      throw new Error('Collection title and handle are required');
    }

    let shopifyProductIds: string[] = [];
    
    if (product_ids && product_ids.length > 0) {
      console.log('📦 Processing product IDs for collection...');
      
      // Convert full Shopify GIDs to numeric IDs for the query
      const numericIds = product_ids.map((id: string) => {
        if (id.startsWith('gid://shopify/Product/')) {
          return id.replace('gid://shopify/Product/', '');
        }
        return id;
      });
      
      console.log('✅ Converted product IDs:', numericIds);
      
      // Create query for Shopify products using numeric IDs
      const productIdsQuery = numericIds.map((id: string) => `id:${id}`).join(' OR ');
      
      console.log('🔍 Fetching products from Shopify...');
      const productsResponse = await withRetry(
        async () => {
          const response = await fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/graphql.json`, {
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
          
          if (!response.ok) {
            throw new Error(`Shopify GraphQL API error: ${response.status} ${response.statusText}`);
          }
          
          return response;
        }
      );

      const productsData = await productsResponse.json();
      
      if (productsData.errors) {
        throw new Error(`Shopify GraphQL errors: ${JSON.stringify(productsData.errors)}`);
      }
      
      console.log('✅ Found products for collection:', productsData.data?.products?.edges?.length || 0);
      console.log('📋 Products found:', productsData.data?.products?.edges?.map((edge: any) => edge.node.title) || []);

      // Extract Shopify product IDs
      shopifyProductIds = productsData.data?.products?.edges?.map((edge: any) => edge.node.id) || [];
    }

    console.log('🔍 Checking for existing collection...');
    // First, try to find the existing collection by handle
    const getCollectionResponse = await withRetry(
      () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json?handle=${handle}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken
        }
      })
    );

    if (!getCollectionResponse.ok) {
      throw new Error(`Failed to check existing collections: ${getCollectionResponse.status} ${getCollectionResponse.statusText}`);
    }

    const existingCollectionsData = await getCollectionResponse.json();
    let shopifyCollectionId;

    if (existingCollectionsData.custom_collections && existingCollectionsData.custom_collections.length > 0) {
      // Collection exists, use its ID
      shopifyCollectionId = existingCollectionsData.custom_collections[0].id;
      console.log('✅ Found existing Shopify collection:', shopifyCollectionId);
      
      // Clear existing products from the collection first
      console.log('🧹 Clearing existing products from collection...');
      const collectsResponse = await withRetry(
        () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects.json?collection_id=${shopifyCollectionId}&limit=250`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyAccessToken
          }
        })
      );
      
      const collectsData = await collectsResponse.json();
      if (collectsData.collects && collectsData.collects.length > 0) {
        console.log(`🗑️ Removing ${collectsData.collects.length} existing products from collection`);
        const deletePromises = collectsData.collects.map(async (collect: any) => {
          try {
            await withRetry(
              () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects/${collect.id}.json`, {
                method: 'DELETE',
                headers: {
                  'X-Shopify-Access-Token': shopifyAccessToken
                }
              })
            );
          } catch (error) {
            console.warn('⚠️ Error removing product from collection:', error);
          }
        });
        await Promise.allSettled(deletePromises);
        console.log('✅ Cleared existing products from collection');
      }
    } else {
      // Collection doesn't exist, create it
      console.log('🆕 Creating new collection in Shopify...');
      const createCollectionResponse = await withRetry(
        () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json`, {
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
        })
      );

      const collectionData = await createCollectionResponse.json();
      
      if (!createCollectionResponse.ok) {
        console.error('❌ Failed to create Shopify collection:', collectionData);
        throw new Error(`Shopify API error creating collection: ${JSON.stringify(collectionData.errors || collectionData)}`);
      }

      shopifyCollectionId = collectionData.custom_collection.id;
      console.log('✅ Created new Shopify collection:', shopifyCollectionId);
    }

    // Add products to the collection (using REST API for collects)
    let addedProducts = 0;
    if (shopifyProductIds.length > 0) {
      console.log(`📦 Adding ${shopifyProductIds.length} products to collection...`);
      
      // Process products sequentially to avoid rate limits
      for (const productId of shopifyProductIds) {
        try {
          const numericProductId = productId.replace('gid://shopify/Product/', '');
          
          // Add rate limiting delay between requests
          await rateLimitedDelay(600); // 600ms between each request to stay under 2 calls/second
          
          const collectResponse = await withRetry(
            () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAccessToken
              },
              body: JSON.stringify({
                collect: {
                  collection_id: shopifyCollectionId,
                  product_id: numericProductId
                }
              })
            })
          );

          if (collectResponse.ok) {
            addedProducts++;
            console.log(`✅ Added product ${numericProductId} to collection`);
          } else {
            const error = await collectResponse.json();
            console.warn(`⚠️ Failed to add product ${numericProductId} to collection:`, error);
          }
        } catch (error) {
          console.warn(`⚠️ Error adding product ${productId} to collection:`, error);
        }
      }
    }

    console.log(`🎉 Successfully synced collection "${title}" to Shopify with ${addedProducts} products`);

    return new Response(
      JSON.stringify({
        success: true,
        shopify_collection_id: shopifyCollectionId,
        products_added: addedProducts,
        collection_title: title,
        collection_handle: handle,
        message: `Collection "${title}" synced successfully with ${addedProducts} products`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error syncing collection to Shopify:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})