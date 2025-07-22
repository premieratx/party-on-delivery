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
      "tailgate-beer",
      "seltzer-collection", 
      "cocktail-kits",
      "party-supplies"
    ];

    console.log("Target collections:", targetCollections);
    console.log("Will fetch from store:", SHOPIFY_STORE);
    const allCollections = [];

    // Fetch each collection using Storefront API GraphQL
    for (const handle of targetCollections) {
      console.log(`Fetching collection: ${handle}`);
      
      try {
        const query = `
          query getCollectionByHandle($handle: String!) {
            collectionByHandle(handle: $handle) {
              id
              title
              handle
              description
              products(first: 50) {
                edges {
                  node {
                    id
                    title
                    handle
                    description
                    images(first: 1) {
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
        console.log(`Request headers - Content-Type: application/json`);
        console.log(`Request headers - X-Shopify-Storefront-Access-Token: ${SHOPIFY_API_KEY?.substring(0, 10)}...`);

        const requestBody = JSON.stringify({
          query,
          variables: { handle }
        });
        console.log(`Request body length: ${requestBody.length}`);

        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
          },
          body: requestBody,
        });

        console.log(`Response status for ${handle}:`, response.status);
        console.log(`Response statusText for ${handle}:`, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP Error ${response.status} for ${handle}: ${errorText}`);
          continue; // Skip this collection and try the next one
        }
        
        const data = await response.json();
        console.log(`GraphQL response for ${handle} received:`, !!data.data);
        
        if (data.errors) {
          console.error(`GraphQL errors for ${handle}:`, JSON.stringify(data.errors));
          continue; // Skip this collection if there are GraphQL errors
        }
        
        if (data.data?.collectionByHandle) {
          const collection = data.data.collectionByHandle;
          console.log(`Collection found: ${handle} with ${collection.products.edges.length} products`);
          
          // Transform products with error handling
          const products = collection.products.edges.map(({ node: product }) => {
            try {
              const variant = product.variants.edges[0]?.node;
              const image = product.images.edges[0]?.node;
              
              return {
                id: product.id,
                title: product.title || '',
                price: variant ? parseFloat(variant.price.amount) : 0,
                image: image?.url || '/placeholder.svg',
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
          }).filter(Boolean); // Remove null products

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
      } catch (collectionError) {
        console.error(`Error fetching collection ${handle}:`, collectionError);
        // Continue with other collections even if one fails
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