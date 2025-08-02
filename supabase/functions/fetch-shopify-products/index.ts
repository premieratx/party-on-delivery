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
    console.log("=== FETCH-SHOPIFY-PRODUCTS FUNCTION START ===");
    
    const SHOPIFY_STORE = Deno.env.get("SHOPIFY_STORE_URL")?.replace("https://", "") || "premier-concierge.myshopify.com";
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    
    console.log("Store URL:", SHOPIFY_STORE);
    console.log("Access Token exists:", !!SHOPIFY_ACCESS_TOKEN);
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN is not set");
    }
    
    // GraphQL query to fetch ALL products with product types and categories
    const query = `
      query {
        products(first: 250) {
          edges {
            node {
              id
              title
              handle
              description
              productType
              vendor
              tags
              images(first: 5) {
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
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    console.log("Making GraphQL request to Shopify Admin API...");
    
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    console.log("Response status:", response.status);
    console.log("Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("GraphQL response received:", !!data);
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data?.products) {
      console.error("No products data in response");
      throw new Error("No products data in response");
    }

    // Transform Shopify data to our format
    const products = data.data.products.edges.map(({ node: product }: any) => {
      const variant = product.variants.edges[0]?.node;
      const image = product.images.edges[0]?.node;
      
      // Extract category from tags or use productType
      let category = product.productType || 'Uncategorized';
      
      // Look for category tags (tags that might indicate category)
      const categoryTags = product.tags.filter((tag: string) => 
        tag.toLowerCase().includes('spirits') ||
        tag.toLowerCase().includes('beer') ||
        tag.toLowerCase().includes('wine') ||
        tag.toLowerCase().includes('cocktail') ||
        tag.toLowerCase().includes('party') ||
        tag.toLowerCase().includes('supplies')
      );
      
      if (categoryTags.length > 0) {
        category = categoryTags[0];
      }
      
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description || '',
        price: variant ? variant.price : '0',
        image: image?.url || '/placeholder.svg',
        images: product.images.edges.slice(1).map(({ node }: any) => node.url),
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
    });

    console.log(`Processed ${products.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        products: products,
        count: products.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error fetching Shopify products:", error);
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