import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Always handle CORS preflight first
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== GET-ALL-COLLECTIONS FUNCTION START ===");

  try {
    // Get environment variables with proper validation
    const SHOPIFY_STORE_URL = Deno.env.get('SHOPIFY_STORE_URL');
    const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    
    console.log("Environment check:");
    console.log("Store URL exists:", !!SHOPIFY_STORE_URL);
    console.log("Store URL value:", SHOPIFY_STORE_URL);
    console.log("Access Token exists:", !!SHOPIFY_API_KEY);
    console.log("Access Token length:", SHOPIFY_API_KEY?.length || 0);
    
    if (!SHOPIFY_STORE_URL || !SHOPIFY_API_KEY) {
      const missingVars = [];
      if (!SHOPIFY_STORE_URL) missingVars.push('SHOPIFY_STORE_URL');
      if (!SHOPIFY_API_KEY) missingVars.push('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
      
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          collections: []
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    // Clean and validate the store URL - handle multiple formats
    let SHOPIFY_STORE = SHOPIFY_STORE_URL;
    if (SHOPIFY_STORE.includes('://')) {
      SHOPIFY_STORE = SHOPIFY_STORE.split('://')[1];
    }
    if (SHOPIFY_STORE.endsWith('/')) {
      SHOPIFY_STORE = SHOPIFY_STORE.slice(0, -1);
    }
    if (!SHOPIFY_STORE.includes('.myshopify.com')) {
      // If it's just the store name, add the domain
      if (!SHOPIFY_STORE.includes('.')) {
        SHOPIFY_STORE = `${SHOPIFY_STORE}.myshopify.com`;
      }
    }
    
    console.log("Cleaned store URL:", SHOPIFY_STORE);
    
    // Fetch ALL collections from Shopify, not just specific ones
    console.log("Will fetch ALL collections from store:", SHOPIFY_STORE);
    const allCollections = [];

    console.log("=== ATTEMPTING REAL-TIME FETCH OF ALL COLLECTIONS ===");
    
    // First, get all collection handles using the Storefront API
    const getAllCollectionsQuery = `
      query getAllCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    // Also prepare the detailed query for fetching products for each collection
    const getCollectionDetailsQuery = (handle: string) => `
      query getCollectionDetails($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          title
          handle
          description
          products(first: 100) {
            edges {
              node {
                id
                title
                handle
                description
                images(first: 10) {
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
                      price {
                        amount
                        currencyCode
                      }
                      availableForSale
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const graphqlUrl = `https://${SHOPIFY_STORE}/api/2024-10/graphql.json`;
    console.log(`Making GraphQL request to: ${graphqlUrl}`);

    // Background task function for periodic refresh
    const backgroundRefresh = async () => {
      try {
        console.log("=== BACKGROUND REFRESH STARTING ===");
        
        // Wait 5 minutes then refresh cache
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        );
        
        // Mark cache as stale to trigger refresh on next request
        await supabaseClient.from('cache').upsert({
          key: 'shopify-collections-last-refresh',
          data: { lastRefresh: Date.now(), status: 'stale' },
          expires_at: Math.floor(Date.now() + (24 * 60 * 60 * 1000)),
          created_at: new Date().toISOString()
        });
        
        console.log("Background refresh completed - cache marked for refresh");
      } catch (error) {
        console.error("Background refresh failed:", error);
      }
    };

    try {
      // Start background refresh task
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(backgroundRefresh());
      }

      // First, get list of all collections
      const collectionsListResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
        },
        body: JSON.stringify({ 
          query: getAllCollectionsQuery,
          variables: { first: 250 }  // Increased to fetch all collections
        }),
      });

      console.log(`Collections list response status:`, collectionsListResponse.status);

      if (!collectionsListResponse.ok) {
        const errorText = await collectionsListResponse.text();
        console.error(`HTTP Error ${collectionsListResponse.status}: ${errorText}`);
        throw new Error(`HTTP ${collectionsListResponse.status}: ${errorText}`);
      }
      
      const collectionsData = await collectionsListResponse.json();
      console.log(`Collections list GraphQL response received:`, !!collectionsData.data);
      
      if (collectionsData.errors) {
        console.error(`Collections list fetch failed: GraphQL errors:`, JSON.stringify(collectionsData.errors));
        throw new Error(`GraphQL errors: ${JSON.stringify(collectionsData.errors)}`);
      }

      const collectionsList = collectionsData.data?.collections?.edges || [];
      console.log(`Found ${collectionsList.length} collections in Shopify`);

      // Prioritize our main collections first, then fetch others
      const priorityCollections = ["spirits", "tailgate-beer", "boat-page-beer", "seltzer-collection", "cocktail-kits", "party-supplies"];
      const otherCollections = collectionsList
        .map(edge => edge.node.handle)
        .filter(handle => !priorityCollections.includes(handle));
      
      const orderedCollections = [...priorityCollections, ...otherCollections];
      console.log(`Processing collections in order:`, orderedCollections.slice(0, 10), '...');

      // Fetch detailed data for each collection
      let processedCount = 0;
      const maxCollections = 100; // Increased to handle all collections
      
      for (const handle of orderedCollections.slice(0, maxCollections)) {
        try {
          console.log(`Fetching collection: ${handle}`);
          
          const collectionResponse = await fetch(graphqlUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
            },
            body: JSON.stringify({ 
              query: getCollectionDetailsQuery(handle),
              variables: { handle }
            }),
          });

          if (collectionResponse.ok) {
            const data = await collectionResponse.json();
            const collection = data.data?.collectionByHandle;
            
            if (collection && collection.products.edges.length > 0) {
              console.log(`Collection found: ${handle} with ${collection.products.edges.length} products`);
              
              // Transform products with error handling
              const products = collection.products.edges.map(({ node: product }) => {
                try {
                  const variant = product.variants.edges[0]?.node;
                  const image = product.images.edges[0]?.node;
                  const allImages = product.images.edges.slice(1).map(({ node }) => node.url);
                  
                  return {
                    id: product.id,
                    title: product.title || '',
                    price: variant ? parseFloat(variant.price.amount) : 0,
                    image: image?.url || '/placeholder.svg',
                    images: allImages,
                    description: product.description || '',
                    handle: product.handle || '',
                    variants: product.variants.edges.map(({ node: v }) => ({
                      id: v.id,
                      title: v.title || 'Default Title',
                      price: parseFloat(v.price.amount) || 0,
                      available: v.availableForSale || false
                    }))
                  };
                } catch (productError) {
                  console.error(`Error processing product:`, productError);
                  return null;
                }
              }).filter(Boolean);

              allCollections.push({
                id: collection.id,
                title: collection.title,
                handle: collection.handle,
                description: collection.description || '',
                products
              });

              console.log(`Successfully loaded collection: ${handle} with ${products.length} products`);
              processedCount++;
            } else {
              console.log(`Collection ${handle} has no products or doesn't exist`);
            }
          } else {
            console.warn(`Failed to fetch collection ${handle}: ${collectionResponse.status}`);
          }
        } catch (collectionError) {
          console.error(`Error fetching collection ${handle}:`, collectionError);
          // Continue processing other collections
        }
      }
      
      console.log(`Successfully processed ${processedCount} collections`);
      
      // Cache the successful result for 6 hours (shorter refresh interval)
      if (allCollections.length > 0) {
        console.log("=== CACHING SUCCESSFUL RESULT ===");
        try {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
          );
          
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 6); // 6 hours from now
          
          await supabaseClient.from('cache').upsert({
            key: 'shopify-collections',
            data: allCollections,
            expires_at: Math.floor(expiresAt.getTime()),
            created_at: new Date().toISOString()
          });
          
          // Also store metadata about the fetch
          await supabaseClient.from('cache').upsert({
            key: 'shopify-collections-metadata',
            data: { 
              totalCollections: allCollections.length,
              lastFetch: new Date().toISOString(),
              status: 'success'
            },
            expires_at: Math.floor(expiresAt.getTime()),
            created_at: new Date().toISOString()
          });
          
          console.log("Collections cached to Supabase for 6 hours");
        } catch (cacheError) {
          console.warn("Failed to cache to Supabase:", cacheError);
        }
      }
      
    } catch (fetchError) {
      console.error("Real-time fetch failed:", fetchError.message);
      
      console.log("=== FALLING BACK TO CACHE ===");
      console.log("=== LOADING FROM CACHE ===");
      
      // Try to load from Supabase cache first (30-day storage)
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        );
        
        const { data: cachedData } = await supabaseClient
          .from('cache')
          .select('data, expires_at')
          .eq('key', 'shopify-collections')
          .single();
        
        if (cachedData && cachedData.expires_at > Date.now()) {
          console.log("Loaded collections from Supabase cache");
          allCollections.push(...cachedData.data);
        } else {
          console.log("No cached data available");
        }
      } catch (cacheError) {
        console.warn("Cache fallback failed:", cacheError);
        console.log("No cached data available");
      }
    }

    console.log(`=== FINAL RESULT: ${allCollections.length} collections loaded ===`);

    // Always return a successful response, even if some collections failed
    return new Response(
      JSON.stringify({ 
        collections: allCollections,
        success: true,
        totalCollections: allCollections.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("=== CRITICAL ERROR in get-all-collections function ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: `Function error: ${error.message}`,
        collections: [],
        success: false
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});