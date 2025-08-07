import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  handle: string;
  variants?: any[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  products: Product[];
}

interface CachedProductData {
  collections: Collection[];
  products: Product[];
  categories: any[];
  cached_at: number;
}

// In-memory cache and request deduplication (frontend-only)
let __memoryCache: CachedProductData | null = null;
let __memoryCacheAt = 0;
let __inflightPromise: Promise<void> | null = null;
const __CACHE_TTL_MS = 2 * 60 * 1000;

export const useOptimizedProductLoader = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      if (!forceRefresh && __memoryCache && (now - __memoryCacheAt) < __CACHE_TTL_MS) {
        setProducts(__memoryCache.products || []);
        setCollections(__memoryCache.collections || []);
        setCategories(__memoryCache.categories || []);
        return;
      }

      if (!forceRefresh && __inflightPromise) {
        await __inflightPromise;
        if (__memoryCache) {
          setProducts(__memoryCache.products || []);
          setCollections(__memoryCache.collections || []);
          setCategories(__memoryCache.categories || []);
        }
        return;
      }

      __inflightPromise = (async () => {
        const { data, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
          body: { forceRefresh }
        });

        if (cacheError) {
          console.error('Cache error:', cacheError);
          throw cacheError;
        }

        if (data?.success && data?.data) {
          const productData: CachedProductData = data.data;
          __memoryCache = productData;
          __memoryCacheAt = Date.now();
          setProducts(productData.products || []);
          setCollections(productData.collections || []);
          setCategories(productData.categories || []);
        } else {
          throw new Error('Failed to load product data');
        }
      })();

      await __inflightPromise;
    } catch (err: any) {
      console.error('Product loading error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      __inflightPromise = null;
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts(false);
  }, [loadProducts]);

  return {
    products,
    collections,
    categories,
    loading,
    error,
    refreshProducts
  };
};