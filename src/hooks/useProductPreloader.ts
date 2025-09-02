import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductCache {
  [collectionHandle: string]: {
    products: any[];
    lastUpdated: number;
    loading: boolean;
  }
}

// Global cache to share across components
const globalProductCache: ProductCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductPreloader = () => {
  const [cache, setCache] = useState<ProductCache>(globalProductCache);

  const preloadCollection = useCallback(async (collectionHandle: string) => {
    // Check if already cached and not expired
    const existing = globalProductCache[collectionHandle];
    if (existing && Date.now() - existing.lastUpdated < CACHE_DURATION) {
      return existing.products;
    }
    
    // Mark as loading
    globalProductCache[collectionHandle] = {
      products: existing?.products || [],
      lastUpdated: existing?.lastUpdated || 0,
      loading: true
    };
    setCache({ ...globalProductCache });

    try {
      // Use instant-product-cache which preserves exact Shopify collection order
      const { data, error } = await supabase.functions.invoke('instant-product-cache', {
        body: {
          collection_handle: collectionHandle,
          force_refresh: false
        }
      });

      if (error) throw error;

      const products = data?.products || [];
      
      // Update cache - silent success
      globalProductCache[collectionHandle] = {
        products,
        lastUpdated: Date.now(),
        loading: false
      };
      setCache({ ...globalProductCache });

      return products;
    } catch (error) {
      console.error(`❌ Product loading failed for ${collectionHandle}:`, error);
      
      // Mark as not loading
      if (globalProductCache[collectionHandle]) {
        globalProductCache[collectionHandle].loading = false;
        setCache({ ...globalProductCache });
      }
      
      throw error;
    }
  }, []);

  const getFromCache = useCallback((collectionHandle: string) => {
    const cached = globalProductCache[collectionHandle];
    if (cached && !cached.loading && (Date.now() - cached.lastUpdated) < CACHE_DURATION) {
      return cached.products;
    }
    return null;
  }, []);

  const preloadMultipleCollections = useCallback(async (collectionHandles: string[]) => {
    // FIXED: Sequential loading to prevent overwhelming the edge function
    for (const handle of collectionHandles) {
      try {
        await preloadCollection(handle);
        // Small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠️ Skipping collection ${handle}:`, error.message);
        // Continue with next collection instead of failing all
      }
    }
  }, [preloadCollection]);

  const clearCache = useCallback(() => {
    Object.keys(globalProductCache).forEach(key => {
      delete globalProductCache[key];
    });
    setCache({});
  }, []);

  return {
    cache,
    preloadCollection,
    getFromCache,
    preloadMultipleCollections,
    clearCache
  };
};