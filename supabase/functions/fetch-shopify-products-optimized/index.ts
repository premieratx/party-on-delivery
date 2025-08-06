import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OptimizedFetchOptions {
  lightweight?: boolean;
  includeImages?: boolean;
  limit?: number;
  collectionHandle?: string;
  forceRefresh?: boolean;
}

// Intelligent rate limiter with queue
class SmartRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 500; // 500ms between requests
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequestsPerMinute = 40; // Conservative limit

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
      
      // Reset request count if window has passed
      if (now - this.windowStart > 60000) {
        this.requestCount = 0;
        this.windowStart = now;
      }
      
      // Check if we've hit the rate limit
      if (this.requestCount >= this.maxRequestsPerMinute) {
        const waitTime = 60000 - (now - this.windowStart);
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
      
      // Ensure minimum interval between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const operation = this.queue.shift();
      if (operation) {
        this.lastRequestTime = Date.now();
        this.requestCount++;
        await operation();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new SmartRateLimiter();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== OPTIMIZED SHOPIFY FETCH START ===");
    
    const options: OptimizedFetchOptions = await req.json().catch(() => ({}));
    const { 
      lightweight = false, 
      includeImages = false, 
      limit = 50,
      collectionHandle,
      forceRefresh = false
    } = options;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check cache first (unless force refresh)
    const cacheKey = `shopify_products_${lightweight ? 'light' : 'full'}_${limit}_${collectionHandle || 'all'}`;
    
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('cache')
        .select('data, created_at')
        .eq('key', cacheKey)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!cacheError && cachedData) {
        console.log(`✅ Returning cached data (${JSON.stringify(cachedData.data).length} bytes)`);
        return new Response(
          JSON.stringify({
            success: true,
            products: cachedData.data.products || [],
            count: cachedData.data.count || 0,
            cached: true,
            cachedAt: cachedData.created_at
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
    }

    const SHOPIFY_STORE = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not set");
    }

    // Build optimized GraphQL query based on options
    const query = `
      query getProducts($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              ${lightweight ? '' : 'description'}
              productType
              vendor
              tags
              ${includeImages ? `
                images(first: 5) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              ` : `
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              `}
              variants(first: 3) {
                edges {
                  node {
                    id
                    title
                    price
                    availableForSale
                  }
                }
              }
              ${lightweight ? '' : `
                collections(first: 10) {
                  edges {
                    node {
                      id
                      title
                      handle
                    }
                  }
                }
              `}
            }
          }
        }
      }
    `;

    // Build query filter
    let queryFilter = "status:active";
    if (collectionHandle) {
      queryFilter += ` AND collection:${collectionHandle}`;
    }

    const variables = {
      first: Math.min(limit, 100), // Cap at 100 for safety
      query: queryFilter
    };

    console.log(`🔄 Fetching ${limit} products (lightweight: ${lightweight})`);

    const response = await rateLimiter.execute(async () => {
      return fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      });
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data?.products) {
      console.error("No products data in response");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No products data returned',
          products: [] 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process products efficiently
    const products = data.data.products.edges.map(({ node: product }: any) => {
      const variant = product.variants.edges[0]?.node;
      const image = product.images.edges[0]?.node;
      
      // Determine category efficiently
      let category = product.productType || 'Uncategorized';
      if (product.tags?.length) {
        const alcoholTag = product.tags.find((tag: string) => 
          /whiskey|vodka|gin|rum|tequila|beer|wine|champagne|bourbon|scotch|brandy|cognac|liqueur|spirits/i.test(tag)
        );
        if (alcoholTag) category = alcoholTag;
      }

      const baseProduct = {
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: variant?.price || '0',
        image: image?.url || '/placeholder.svg',
        vendor: product.vendor || '',
        category: category,
        productType: product.productType || '',
        tags: product.tags || [],
        variants: product.variants.edges.map(({ node: v }: any) => ({
          id: v.id,
          title: v.title,
          price: parseFloat(v.price),
          available: v.availableForSale
        }))
      };

      // Add optional fields based on request
      if (!lightweight) {
        return {
          ...baseProduct,
          description: product.description || '',
          collections: product.collections?.edges?.map(({ node }: any) => ({
            id: node.id,
            title: node.title,
            handle: node.handle
          })) || []
        };
      }

      if (includeImages) {
        return {
          ...baseProduct,
          images: product.images.edges.slice(1).map(({ node }: any) => node.url)
        };
      }

      return baseProduct;
    });

    console.log(`✅ Processed ${products.length} products`);

    // Cache the results
    const cacheData = {
      products,
      count: products.length,
      lightweight,
      timestamp: new Date().toISOString()
    };

    const expiresAt = new Date(Date.now() + (lightweight ? 15 : 10) * 60 * 1000); // 15min for lightweight, 10min for full

    await supabase
      .from('cache')
      .upsert({
        key: cacheKey,
        data: cacheData,
        expires_at: expiresAt.toISOString()
      });

    console.log(`💾 Cached results until ${expiresAt.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        products,
        count: products.length,
        cached: false,
        lightweight,
        includeImages
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in optimized fetch:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        products: []
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});