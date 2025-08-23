import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory cache for ultra-fast responses
let productIndex: any[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const searchCache = new Map<string, any>();

interface SearchRequest {
  query?: string;
  category?: string;
  limit?: number;
  action?: 'search' | 'preload' | 'warm_cache';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { query, category, limit = 50, action = 'search' }: SearchRequest = await req.json();

    console.log(`🔍 Ultra-fast search: ${action}`, { query, category, limit });

    // Check if we need to refresh the index
    const needsRefresh = Date.now() - lastCacheUpdate > CACHE_DURATION || productIndex.length === 0;
    
    if (needsRefresh || action === 'preload') {
      console.log('🚀 Refreshing product index...');
      
      // Load ALL products in one fast query - no limit to get full 1068+ catalog
      const { data: products, error } = await supabase
        .from('shopify_products_cache')
        .select('id, title, price, image, handle, data');

      if (error) {
        throw new Error(`Failed to load products: ${error.message}`);
      }

      // Build optimized search index
      productIndex = (products || []).map(product => {
        const cleanTitle = product.title
          .replace(/https?:\/\/[^\s]+/g, '')
          .replace(/\b\d{6,}\b/g, '')
          .replace(/\|\s*\d+/g, '')
          .trim();

        // Extract searchable terms
        const searchTerms = [
          cleanTitle.toLowerCase(),
          product.title.toLowerCase(),
          ...(cleanTitle.toLowerCase().split(/\s+/)),
          product.handle?.toLowerCase() || ''
        ].filter(Boolean);

        return {
          id: product.id,
          title: product.title,
          cleanTitle,
          price: parseFloat(product.price) || 0,
          image: product.image,
          handle: product.handle,
          searchTerms: searchTerms.join(' '),
          variants: [{
            id: `${product.id}-default`,
            title: 'Default',
            price: parseFloat(product.price) || 0,
            available: true
          }]
        };
      });

      lastCacheUpdate = Date.now();
      console.log(`✅ Index refreshed: ${productIndex.length} products`);
    }

    // For preload/warm cache, just return success
    if (action === 'preload' || action === 'warm_cache') {
      const endTime = performance.now();
      return new Response(
        JSON.stringify({
          success: true,
          cached: productIndex.length,
          loadTime: `${(endTime - startTime).toFixed(2)}ms`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ultra-fast search
    let results = productIndex;

    if (query && query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      const cacheKey = `${searchQuery}_${category || 'all'}_${limit}`;
      
      // Check cache first
      if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        const endTime = performance.now();
        console.log(`⚡ Cache hit for "${query}" - ${(endTime - startTime).toFixed(2)}ms`);
        
        return new Response(
          JSON.stringify({
            products: cached.products,
            totalFound: cached.totalFound,
            query: searchQuery,
            loadTime: `${(endTime - startTime).toFixed(2)}ms`,
            fromCache: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Perform ultra-fast search
      results = productIndex.filter(product => {
        return product.searchTerms.includes(searchQuery) ||
               product.cleanTitle.toLowerCase().includes(searchQuery);
      });

      // Sort by relevance (exact matches first, then partial matches)
      results.sort((a, b) => {
        const aExact = a.cleanTitle.toLowerCase().includes(searchQuery) ? 1 : 0;
        const bExact = b.cleanTitle.toLowerCase().includes(searchQuery) ? 1 : 0;
        
        if (aExact !== bExact) return bExact - aExact;
        
        // Then by price (ascending)
        return a.price - b.price;
      });

      // Cache the results
      const limitedResults = results.slice(0, limit);
      searchCache.set(cacheKey, {
        products: limitedResults,
        totalFound: results.length
      });

      // Limit cache size
      if (searchCache.size > 1000) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }

      results = limitedResults;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🎯 Search completed: "${query}" - ${results.length} results in ${duration.toFixed(2)}ms`);

    return new Response(
      JSON.stringify({
        products: results,
        totalFound: results.length,
        query: query || '',
        loadTime: `${duration.toFixed(2)}ms`,
        fromCache: false,
        indexSize: productIndex.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Ultra-fast search error:', error);
    
    const endTime = performance.now();
    return new Response(
      JSON.stringify({
        error: error.message,
        products: [],
        totalFound: 0,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});