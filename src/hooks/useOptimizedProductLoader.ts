import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  vendor: string;
  description?: string;
  variants?: any[];
  collection_handles?: string[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  products: Product[];
}

interface LoaderOptions {
  app_slug?: string;
  lightweight?: boolean;
  auto_refresh?: boolean;
}

export function useOptimizedProductLoader(options: LoaderOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { app_slug, lightweight = true, auto_refresh = true } = options;

  const loadProducts = useCallback(async (force_refresh = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading optimized products...');

      const { data, error: functionError } = await supabase.functions.invoke('optimized-product-loader', {
        body: { 
          app_slug, 
          lightweight, 
          force_refresh 
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load products');
      }

      setProducts(data.products || []);
      setCollections(data.collections || []);
      setCached(data.cached || false);

      console.log(`✅ Loaded ${data.products?.length || 0} products from ${data.cached ? 'cache' : 'API'}`);

      // Reset retry count on successful load (even if 0 products)
      setRetryCount(0);

      // TEMPORARILY DISABLED: Only retry if refreshing AND we haven't exceeded retry limit
      // Commenting out to stop infinite loops
      /*
      if (data.refreshing && data.products?.length === 0 && retryCount < 3) {
        console.log(`🔄 Retrying product load (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadProducts(false), 3000 + (retryCount * 2000)); // Exponential backoff
      }
      */

    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [app_slug, lightweight, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refresh
    return loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-refresh every 5 minutes if enabled (but not during active retry attempts)
  useEffect(() => {
    if (!auto_refresh || retryCount > 0) return;

    const interval = setInterval(() => {
      if (!loading && retryCount === 0) {
        console.log('🔄 Auto-refreshing products...');
        loadProducts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [auto_refresh, loading, loadProducts, retryCount]);

  return {
    products,
    collections,
    loading,
    error,
    cached,
    refresh,
    reload: loadProducts,
    refreshProducts: refresh // alias for backward compatibility
  };
}