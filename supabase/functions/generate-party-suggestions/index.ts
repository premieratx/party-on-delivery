import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation, maxSuggestions = 8 } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get products from cache
    const { data: products, error } = await supabase
      .from('shopify_products_cache')
      .select('*')
      .limit(100);

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    // Filter and score products based on conversation
    const scoredProducts = products.map(product => {
      let score = 0;
      const productData = product.data as any;
      const title = productData.title?.toLowerCase() || '';
      const description = productData.body_html?.toLowerCase() || '';
      const tags = productData.tags?.toLowerCase() || '';
      
      // Score based on occasion
      if (conversation.occasion) {
        const occasion = conversation.occasion.toLowerCase();
        if (title.includes(occasion) || tags.includes(occasion)) score += 10;
        
        // Special occasion mappings
        if (occasion.includes('birthday') && (title.includes('celebration') || tags.includes('party'))) score += 5;
        if (occasion.includes('wedding') && (title.includes('elegant') || tags.includes('premium'))) score += 5;
        if (occasion.includes('bbq') && (title.includes('beer') || tags.includes('casual'))) score += 5;
      }

      // Score based on preferences
      if (conversation.preferences) {
        conversation.preferences.forEach((pref: string) => {
          if (title.includes(pref.toLowerCase()) || tags.includes(pref.toLowerCase())) {
            score += 8;
          }
        });
      }

      // Score based on guest count (suggest appropriate quantities)
      if (conversation.guestCount) {
        const guestCount = conversation.guestCount;
        
        // Beer scoring for guest count
        if (title.includes('beer') || title.includes('lager') || title.includes('ale')) {
          if (guestCount <= 5) score += 3;
          else if (guestCount <= 15) score += 5;
          else score += 7;
        }
        
        // Wine scoring for guest count  
        if (title.includes('wine')) {
          if (guestCount <= 8) score += 4;
          else score += 6;
        }
        
        // Spirits for larger parties
        if ((title.includes('vodka') || title.includes('whiskey') || title.includes('rum')) && guestCount > 10) {
          score += 6;
        }
      }

      // Score based on budget
      if (conversation.budget && productData.variants && productData.variants[0]) {
        const price = parseFloat(productData.variants[0].price);
        const budget = conversation.budget.toLowerCase();
        
        if (budget.includes('low') || budget.includes('cheap')) {
          if (price < 20) score += 5;
          else if (price > 50) score -= 3;
        } else if (budget.includes('high') || budget.includes('expensive')) {
          if (price > 50) score += 5;
          else if (price < 20) score -= 2;
        } else if (budget.includes('medium')) {
          if (price >= 20 && price <= 50) score += 5;
        }
      }

      // Boost popular/featured items
      if (tags.includes('featured') || tags.includes('popular')) score += 3;
      
      return {
        ...productData,
        score,
        id: product.id,
        shopify_id: product.shopify_id
      };
    }).filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    // Format suggestions for frontend
    const suggestions = scoredProducts.map(product => ({
      id: product.id,
      shopify_id: product.shopify_id,
      title: product.title,
      description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      price: product.variants?.[0]?.price || '0',
      image: product.images?.[0]?.src || '',
      tags: product.tags?.split(',').map((tag: string) => tag.trim()) || [],
      score: product.score,
      vendor: product.vendor,
      product_type: product.product_type
    }));

    // Calculate recommended quantities based on guest count
    const recommendations = suggestions.map(suggestion => {
      let recommendedQuantity = 1;
      
      if (conversation.guestCount) {
        const guests = conversation.guestCount;
        const title = suggestion.title.toLowerCase();
        
        if (title.includes('beer') || title.includes('bottle')) {
          recommendedQuantity = Math.ceil(guests * 2.5); // 2-3 beers per person
        } else if (title.includes('wine')) {
          recommendedQuantity = Math.ceil(guests / 4); // 1 bottle per 4 people
        } else if (title.includes('vodka') || title.includes('whiskey') || title.includes('spirits')) {
          recommendedQuantity = Math.ceil(guests / 8); // 1 bottle per 8 people
        } else if (title.includes('mixer') || title.includes('soda')) {
          recommendedQuantity = Math.ceil(guests / 3); // 1 mixer per 3 people
        }
      }
      
      return {
        ...suggestion,
        recommendedQuantity,
        estimatedTotal: (parseFloat(suggestion.price) * recommendedQuantity).toFixed(2)
      };
    });

    return new Response(JSON.stringify({
      suggestions: recommendations,
      conversation,
      totalEstimate: recommendations.reduce((sum, item) => sum + parseFloat(item.estimatedTotal), 0).toFixed(2)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate Suggestions Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});