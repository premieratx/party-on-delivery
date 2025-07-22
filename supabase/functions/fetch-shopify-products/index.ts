import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText?: string;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
      };
    }>;
  };
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handles } = await req.json();
    
    if (!handles || !Array.isArray(handles)) {
      throw new Error("Collection handles array is required");
    }
    
    const SHOPIFY_STORE = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
    const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    
    if (!SHOPIFY_API_KEY) {
      throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");
    }
    
    // GraphQL query to fetch collection with products
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

    const allCollections = [];

    // Fetch each collection
    for (const handle of handles) {
      try {
        const response = await fetch(`https://${SHOPIFY_STORE}/api/2024-10/graphql.json`, {
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
            const collection: ShopifyCollection = data.data.collectionByHandle;
            
            // Transform Shopify data to our format
            const products = collection.products.edges.map(({ node: product }) => {
              const variant = product.variants.edges[0]?.node;
              const image = product.images.edges[0]?.node;
              const allImages = product.images.edges.slice(1).map(({ node }) => node.url); // Get additional images (excluding first)
              
              return {
                id: product.id,
                title: product.title,
                price: variant ? parseFloat(variant.price.amount) : 0,
                image: image?.url || '/placeholder.svg',
                images: allImages, // Add all additional images
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
      } catch (fetchError) {
        console.error(`Error fetching collection ${handle}:`, fetchError);
      }
    }

    return new Response(
      JSON.stringify({
        collections: allCollections
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});