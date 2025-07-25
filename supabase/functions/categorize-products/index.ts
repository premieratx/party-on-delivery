import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductData {
  id: string;
  title: string;
  handle: string;
  description?: string;
  productType?: string;
  tags?: string[];
}

function categorizeProduct(product: ProductData): { category: string; subcategory?: string; confidence: number } {
  const title = product.title.toLowerCase();
  const description = (product.description || '').toLowerCase();
  const productType = (product.productType || '').toLowerCase();
  const tags = (product.tags || []).map(tag => tag.toLowerCase());
  
  const allText = `${title} ${description} ${productType} ${tags.join(' ')}`;

  // Beer detection
  const beerKeywords = ['beer', 'lager', 'ale', 'ipa', 'pilsner', 'stout', 'porter', 'wheat beer', 'light beer', 'corona', 'budweiser', 'heineken', 'stella', 'modelo', 'dos equis', 'tecate', 'pacifico'];
  const beerTypes = {
    'light': ['light', 'corona', 'modelo', 'tecate', 'pacifico', 'dos equis'],
    'dark': ['stout', 'porter', 'dark'],
    'hoppy': ['ipa', 'hoppy', 'pale ale'],
    'local': ['local', 'craft', 'artisan'],
    'mexican': ['corona', 'modelo', 'tecate', 'pacifico', 'dos equis', 'mexican']
  };
  
  for (const keyword of beerKeywords) {
    if (allText.includes(keyword)) {
      let subcategory = 'light'; // default
      for (const [type, typeKeywords] of Object.entries(beerTypes)) {
        if (typeKeywords.some(tk => allText.includes(tk))) {
          subcategory = type;
          break;
        }
      }
      return { category: 'beer', subcategory, confidence: 0.9 };
    }
  }

  // Wine detection
  const wineKeywords = ['wine', 'chardonnay', 'cabernet', 'merlot', 'pinot', 'sauvignon', 'riesling', 'rosé', 'champagne', 'prosecco', 'sangria'];
  const wineTypes = {
    'chardonnay': ['chardonnay'],
    'cabernet': ['cabernet'],
    'pinot noir': ['pinot noir', 'pinot'],
    'sauvignon blanc': ['sauvignon blanc'],
    'rosé': ['rosé', 'rose']
  };
  
  for (const keyword of wineKeywords) {
    if (allText.includes(keyword)) {
      let subcategory = 'chardonnay'; // default
      for (const [type, typeKeywords] of Object.entries(wineTypes)) {
        if (typeKeywords.some(tk => allText.includes(tk))) {
          subcategory = type;
          break;
        }
      }
      return { category: 'wine', subcategory, confidence: 0.9 };
    }
  }

  // Liquor detection
  const liquorKeywords = ['whiskey', 'bourbon', 'scotch', 'vodka', 'gin', 'rum', 'tequila', 'cognac', 'brandy', 'liqueur', 'schnapps', 'everclear', 'fireball', 'jack daniels', 'jameson', 'grey goose', 'absolut', 'bacardi', 'captain morgan', 'jose cuervo', 'patron'];
  const liquorTypes = {
    'whiskey': ['whiskey', 'bourbon', 'scotch', 'jack daniels', 'jameson', 'fireball'],
    'tequila': ['tequila', 'jose cuervo', 'patron'],
    'gin': ['gin'],
    'rum': ['rum', 'bacardi', 'captain morgan'],
    'vodka': ['vodka', 'grey goose', 'absolut']
  };
  
  for (const keyword of liquorKeywords) {
    if (allText.includes(keyword)) {
      let subcategory = 'whiskey'; // default
      for (const [type, typeKeywords] of Object.entries(liquorTypes)) {
        if (typeKeywords.some(tk => allText.includes(tk))) {
          subcategory = type;
          break;
        }
      }
      return { category: 'liquor', subcategory, confidence: 0.9 };
    }
  }

  // Cocktail detection
  const cocktailKeywords = ['cocktail', 'margarita', 'mojito', 'cosmopolitan', 'manhattan', 'martini', 'daiquiri', 'punch', 'mixer', 'mix', 'kit', 'spicy margarita', 'paloma', 'cosmo', 'rum punch'];
  const cocktailTypes = {
    'margarita': ['margarita'],
    'spicy margarita': ['spicy margarita'],
    'paloma': ['paloma'],
    'cosmo': ['cosmo', 'cosmopolitan'],
    'rum punch': ['rum punch', 'punch']
  };
  
  for (const keyword of cocktailKeywords) {
    if (allText.includes(keyword)) {
      let subcategory = 'margarita'; // default
      for (const [type, typeKeywords] of Object.entries(cocktailTypes)) {
        if (typeKeywords.some(tk => allText.includes(tk))) {
          subcategory = type;
          break;
        }
      }
      return { category: 'cocktails', subcategory, confidence: 0.8 };
    }
  }

  // Default fallback
  return { category: 'other', confidence: 0.3 };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting product categorization...');

    // Get all cached products from Shopify
    const { data: products, error: productsError } = await supabase
      .from('shopify_products_cache')
      .select('shopify_product_id, title, handle, description, data');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    console.log(`Found ${products?.length || 0} products to categorize`);

    let categorizedCount = 0;
    let updatedCount = 0;

    for (const product of products || []) {
      try {
        // Extract additional data from the JSON data field
        const productData = product.data as any;
        const productType = productData?.productType || '';
        const tags = productData?.tags || [];

        const productInfo: ProductData = {
          id: product.shopify_product_id,
          title: product.title,
          handle: product.handle,
          description: product.description,
          productType,
          tags
        };

        const categorization = categorizeProduct(productInfo);

        // Check if categorization already exists
        const { data: existing } = await supabase
          .from('product_categories')
          .select('id')
          .eq('shopify_product_id', product.shopify_product_id)
          .single();

        if (existing) {
          // Update existing categorization
          const { error: updateError } = await supabase
            .from('product_categories')
            .update({
              assigned_category: categorization.category,
              subcategory: categorization.subcategory,
              confidence_score: categorization.confidence,
              updated_at: new Date().toISOString()
            })
            .eq('shopify_product_id', product.shopify_product_id);

          if (updateError) {
            console.error(`Error updating categorization for ${product.title}:`, updateError);
          } else {
            updatedCount++;
          }
        } else {
          // Insert new categorization
          const { error: insertError } = await supabase
            .from('product_categories')
            .insert({
              shopify_product_id: product.shopify_product_id,
              product_title: product.title,
              product_handle: product.handle,
              assigned_category: categorization.category,
              subcategory: categorization.subcategory,
              confidence_score: categorization.confidence
            });

          if (insertError) {
            console.error(`Error inserting categorization for ${product.title}:`, insertError);
          } else {
            categorizedCount++;
          }
        }

        console.log(`Categorized: ${product.title} -> ${categorization.category}${categorization.subcategory ? ` (${categorization.subcategory})` : ''}`);
      } catch (productError) {
        console.error(`Error processing product ${product.title}:`, productError);
      }
    }

    console.log(`Categorization complete: ${categorizedCount} new, ${updatedCount} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Categorized ${categorizedCount} new products and updated ${updatedCount} existing categorizations`,
        categorizedCount,
        updatedCount,
        totalProducts: products?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in categorize-products function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});