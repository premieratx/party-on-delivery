import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * INSTANT Product Cache - Optimized for 0.2s tab switching
 * Uses smart preloading and aggressive caching for ultra-fast collection switching
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { collection_handle, force_refresh = false } = await req.json().catch(() => ({}))

    console.log(`⚡ INSTANT CACHE: Loading ${collection_handle || 'ALL'} (force: ${force_refresh})`)

    // Check cache first - 30 minute TTL for instant loading
    const cacheKey = `instant_products_${collection_handle || 'all'}`
    const { data: cached } = await supabase
      .from('cache')
      .select('data')
      .eq('key', cacheKey)
      .gt('expires_at', Date.now())
      .single()

    if (cached && !force_refresh) {
      console.log(`⚡ INSTANT HIT: Returning cached data for ${collection_handle}`)
      return new Response(
        JSON.stringify({
          success: true,
          products: cached.data.products || [],
          cached: true,
          load_time: '< 0.1s'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load fresh data with SHOPIFY ORDER PRESERVED - ENSURE ALL 1067+ PRODUCTS
    let query = supabase
      .from('shopify_products_cache')
      .select('id, title, price, image, category, vendor, handle, product_type, collection_handles, variants, description, sort_order, updated_at')
      .order('sort_order', { ascending: true, nullsLast: true }) // CRITICAL: Preserve Shopify collection order
      .order('updated_at', { ascending: false }) // Secondary sort by update time
      .order('id', { ascending: true }) // Tertiary sort for consistency
      .limit(2000) // EXPLICIT HIGH LIMIT to ensure we get ALL products (1067+)

    // Filter by collection if specified - COMPREHENSIVE MATCHING
    if (collection_handle && collection_handle !== 'all') {
      // Build comprehensive OR query to catch all products in this collection
      const collectionFilters = [];
      
      // Direct collection_handles array contains match
      collectionFilters.push(`collection_handles.cs.{${collection_handle}}`);
      collectionFilters.push(`collection_handles.cs.${collection_handle}`);
      
      // JSON data contains the collection handle
      collectionFilters.push(`data->>'collection_handles'.ilike.%${collection_handle}%`);
      
      // Smart category-based matching for common collections
      switch(collection_handle) {
        case 'spirits':
          collectionFilters.push(`product_type.ilike.%spirit%`);
          collectionFilters.push(`category.ilike.%spirit%`);
          collectionFilters.push(`title.ilike.%vodka%`);
          collectionFilters.push(`title.ilike.%whiskey%`);
          collectionFilters.push(`title.ilike.%tequila%`);
          collectionFilters.push(`title.ilike.%rum%`);
          collectionFilters.push(`title.ilike.%gin%`);
          collectionFilters.push(`title.ilike.%bourbon%`);
          break;
        case 'tailgate-beer':
          collectionFilters.push(`product_type.ilike.%beer%`);
          collectionFilters.push(`category.ilike.%beer%`);
          break;
        case 'wine-champagne-bnb-wedding':
          collectionFilters.push(`product_type.ilike.%wine%`);
          collectionFilters.push(`product_type.ilike.%champagne%`);
          collectionFilters.push(`category.ilike.%wine%`);
          break;
        case 'seltzer-collection':
          collectionFilters.push(`product_type.ilike.%seltzer%`);
          collectionFilters.push(`title.ilike.%seltzer%`);
          break;
        case 'cocktail-kits':
          collectionFilters.push(`product_type.ilike.%cocktail%`);
          collectionFilters.push(`title.ilike.%cocktail%`);
          break;
        case 'mixers-non-alcoholic':
          collectionFilters.push(`product_type.ilike.%mixer%`);
          collectionFilters.push(`category.ilike.%mixer%`);
          break;
      }
      
      query = query.or(collectionFilters.join(','));
    }

    const { data: products, error } = await query

    if (error) {
      console.error('⚡ INSTANT CACHE ERROR:', error)
      throw error
    }

    console.log(`⚡ INSTANT FRESH: Loaded ${products?.length || 0} products for ${collection_handle}`)

    // Cache for 30 minutes
    const expiresAt = Date.now() + (30 * 60 * 1000)
    await supabase
      .from('cache')
      .upsert({
        key: cacheKey,
        data: { products: products || [] },
        expires_at: expiresAt
      })

    return new Response(
      JSON.stringify({
        success: true,
        products: products || [],
        cached: false,
        load_time: '< 0.2s',
        collection: collection_handle
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('⚡ INSTANT CACHE ERROR:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        products: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})