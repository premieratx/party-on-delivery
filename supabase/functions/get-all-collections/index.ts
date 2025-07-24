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
    
    // Validate that we have the correct collections in Shopify
    const targetCollections = [
      "spirits",              // NEW: Added spirits collection 
      "tailgate-beer",
      "seltzer-collection", 
      "cocktail-kits",
      "party-supplies"
    ];

    console.log("Target collections:", targetCollections);
    console.log("Will fetch from store:", SHOPIFY_STORE);
    const allCollections = [];

    console.log("=== ATTEMPTING REAL-TIME FETCH ===");
    
    // Build the complete GraphQL query to fetch all collections at once
    const query = `
      query getAllCollections {
        ${targetCollections.map(handle => `
          ${handle.replace(/-/g, '_')}: collectionByHandle(handle: "${handle}") {
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
        `).join('')}
      }
    `;

    const graphqlUrl = `https://${SHOPIFY_STORE}/api/2024-10/graphql.json`;
    console.log(`Making GraphQL request to: ${graphqlUrl}`);
    console.log(`Request headers - Content-Type: application/json`);
    console.log(`Request headers - X-Shopify-Storefront-Access-Token: ${SHOPIFY_API_KEY?.substring(0, 10)}...`);

    const requestBody = JSON.stringify({ query });
    console.log(`Request body length: ${requestBody.length}`);

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
        },
        body: requestBody,
      });

      console.log(`Response status for collections:`, response.status);
      console.log(`Response statusText for collections:`, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`GraphQL response for collections received:`, !!data.data);
      
      if (data.errors) {
        console.error(`Real-time fetch failed: GraphQL errors:`, JSON.stringify(data.errors));
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      // Process each collection from the response
      for (const handle of targetCollections) {
        const collectionKey = handle.replace(/-/g, '_');
        const collection = data.data?.[collectionKey];
        
        if (collection) {
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
        } else {
          console.log(`Collection not found in Shopify: ${handle}`);
        }
      }
      
      // Cache the successful result for 30 days
      if (allCollections.length > 0) {
        console.log("=== CACHING SUCCESSFUL RESULT ===");
        // Using Supabase for robust 30-day caching
        try {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
          );
          
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
          
          await supabaseClient.from('cache').upsert({
            key: 'shopify-collections',
            data: allCollections,
            expires_at: Math.floor(expiresAt.getTime()),
            created_at: new Date().toISOString()
          });
          
          console.log("Collections cached to Supabase for 30 days");
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