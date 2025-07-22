import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOPIFY_STORE = Deno.env.get('SHOPIFY_STORE_URL') || "premier-concierge.myshopify.com";
    const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN') || "0d4359f88af16da44f2653d9134c18c5";
    
    // Updated collections to match the frontend component
    const targetCollections = [
      "tailgate-beer",
      "seltzer-collection", 
      "cocktail-kits",
      "party-supplies"
    ];

    const allCollections = [];

    // Fetch each collection
    for (const handle of targetCollections) {
      const query = `
        query getCollectionByHandle($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            title
            handle
            description
            products(first: 20) {
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
                  variants(first: 5) {
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

      const response = await fetch(`https://${SHOPIFY_STORE}/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
        },
        body: JSON.stringify({
          query,
          variables: { handle }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.collectionByHandle) {
          const collection = data.data.collectionByHandle;
          
          // Transform products
          const products = collection.products.edges.map(({ node: product }) => {
            const variant = product.variants.edges[0]?.node;
            const image = product.images.edges[0]?.node;
            
            return {
              id: product.id,
              title: product.title,
              price: variant ? parseFloat(variant.price.amount) : 0,
              image: image?.url || '/placeholder.svg',
              description: product.description,
              handle: product.handle,
              variants: product.variants.edges.map(({ node: v }) => ({
                id: v.id,
                title: v.title,
                price: parseFloat(v.price.amount),
                available: v.availableForSale
              }))
            };
          });

          allCollections.push({
            id: collection.id,
            title: collection.title,
            handle: collection.handle,
            description: collection.description,
            products
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ collections: allCollections }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error fetching collections:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});