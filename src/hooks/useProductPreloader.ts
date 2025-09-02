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
      // Skip instant cache and use working get-unified-products directly
      const { data, error } = await supabase.functions.invoke('get-unified-products', {
        body: {
          collection_handle: collectionHandle,
          use_type: 'delivery',
          lightweight: true,
          preserve_order: true
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
    const promises = collectionHandles.map(handle => preloadCollection(handle));
    await Promise.all(promises);
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