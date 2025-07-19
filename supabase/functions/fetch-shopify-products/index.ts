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
    const { collectionHandle } = await req.json();
    
    const SHOPIFY_STORE = "premier-concierge.myshopify.com";
    const SHOPIFY_API_KEY = "0d4359f88af16da44f2653d9134c18c5";
    
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

    const response = await fetch(`https://${SHOPIFY_STORE}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: { handle: collectionHandle }
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const collection: ShopifyCollection = data.data.collectionByHandle;
    
    if (!collection) {
      throw new Error(`Collection not found: ${collectionHandle}`);
    }

    // Transform Shopify data to our format
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

    return new Response(
      JSON.stringify({
        collection: {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          description: collection.description
        },
        products
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