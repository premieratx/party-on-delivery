import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting with queue management
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 750; // 750ms between requests (well under 2 calls/second)

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const operation = this.queue.shift();
      if (operation) {
        this.lastRequestTime = Date.now();
        await operation();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Enhanced retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await rateLimiter.execute(operation);
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Check if error is retryable
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
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error?.message || error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Handle removing specific products from a collection
async function handleRemoveProducts(collectionHandle: string, productIds: string[]) {
  const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL');
  const shopifyAccessToken = Deno.env.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN');

  if (!shopifyStoreUrl || !shopifyAccessToken) {
    throw new Error('Missing Shopify configuration');
  }

  console.log(`🗑️ Removing ${productIds.length} products from collection: ${collectionHandle}`);

  // First, find the collection by handle
  const getCollectionResponse = await withRetry(
    () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json?handle=${collectionHandle}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken
      }
    })
  );

  if (!getCollectionResponse.ok) {
    throw new Error(`Failed to find collection: ${getCollectionResponse.status}`);
  }

  const collectionsData = await getCollectionResponse.json();
  if (!collectionsData.custom_collections || collectionsData.custom_collections.length === 0) {
    throw new Error(`Collection "${collectionHandle}" not found`);
  }

  const shopifyCollectionId = collectionsData.custom_collections[0].id;

  // Convert product IDs to numeric format
  const numericProductIds = productIds.map((id: string) => {
    if (id.startsWith('gid://shopify/Product/')) {
      return id.replace('gid://shopify/Product/', '');
    }
    return id;
  });

  // Find existing collects for these products in this collection
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
  const collectsToRemove = collectsData.collects?.filter((collect: any) => 
    numericProductIds.includes(collect.product_id.toString())
  ) || [];

  console.log(`Found ${collectsToRemove.length} collects to remove`);

  // Remove the collects
  let removedCount = 0;
  for (const collect of collectsToRemove) {
    try {
      await withRetry(
        () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/collects/${collect.id}.json`, {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': shopifyAccessToken
          }
        })
      );
      removedCount++;
      console.log(`✅ Removed product ${collect.product_id} from collection`);
    } catch (error) {
      console.warn(`⚠️ Error removing product ${collect.product_id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      removed_count: removedCount,
      collection_handle: collectionHandle,
      message: `Removed ${removedCount} product(s) from collection "${collectionHandle}"`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collection_id, title, handle, description, product_ids, action, collection_handle } = await req.json();
    
    console.log('🔄 Starting Shopify collection sync:', { 
      collection_id, 
      title, 
      handle, 
      action,
      collection_handle,
      product_ids_count: product_ids?.length 
    });

    // Handle remove products action
    if (action === 'remove_products' && collection_handle && product_ids) {
      return await handleRemoveProducts(collection_handle, product_ids);
    }

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
      
      // Check which products are already in the collection to avoid duplicates
      console.log('🔍 Checking existing products in collection...');
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
      const existingProductIds = new Set(
        collectsData.collects?.map((collect: any) => collect.product_id.toString()) || []
      );
      
      // Filter out products that are already in the collection
      const newProductIds = shopifyProductIds.filter(id => {
        const numericId = id.replace('gid://shopify/Product/', '');
        return !existingProductIds.has(numericId);
      });
      
      if (newProductIds.length === 0) {
        console.log('✅ All products are already in the collection - no changes needed');
      } else {
        console.log(`➕ Adding ${newProductIds.length} new products to collection (${existingProductIds.size} already exist)`);
        shopifyProductIds = newProductIds; // Only add the new products
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

      if (!createCollectionResponse.ok) {
        const collectionData = await createCollectionResponse.json();
        console.error('❌ Failed to create Shopify collection:', collectionData);
        
        // If handle already exists, try to fetch the existing collection
        if (collectionData.errors?.handle?.includes('already been taken')) {
          console.log(`🔄 Handle exists, fetching existing collection...`);
          const refetchResponse = await withRetry(
            () => fetch(`https://${shopifyStoreUrl}/admin/api/2025-01/custom_collections.json?handle=${handle}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAccessToken
              }
            })
          );
          
          if (refetchResponse.ok) {
            const refetchData = await refetchResponse.json();
            if (refetchData.custom_collections && refetchData.custom_collections.length > 0) {
              shopifyCollectionId = refetchData.custom_collections[0].id;
              console.log(`✅ Found existing collection: ${shopifyCollectionId}`);
            } else {
              throw new Error(`Collection with handle "${handle}" not found after creation failure`);
            }
          } else {
            throw new Error(`Failed to fetch existing collection after creation failure: ${refetchResponse.status}`);
          }
        } else {
          throw new Error(`Shopify API error creating collection: ${JSON.stringify(collectionData.errors || collectionData)}`);
        }
      } else {
        const collectionData = await createCollectionResponse.json();
        shopifyCollectionId = collectionData.custom_collection.id;
        console.log('✅ Created new Shopify collection:', shopifyCollectionId);
      }

    }

    // Add products to the collection (using REST API for collects)
    let addedProducts = 0;
    if (shopifyProductIds.length > 0) {
      console.log(`📦 Adding ${shopifyProductIds.length} products to collection...`);
      
      // Process products sequentially to avoid rate limits
      for (const productId of shopifyProductIds) {
        try {
          const numericProductId = productId.replace('gid://shopify/Product/', '');
          
          // Rate limiting is handled by the RateLimiter class, no additional delay needed
          
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