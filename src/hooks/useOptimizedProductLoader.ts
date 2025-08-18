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

      // If we got empty results but refreshing is in progress, check again in a moment
      if (data.refreshing && data.products?.length === 0) {
        setTimeout(() => loadProducts(false), 2000);
      }

    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [app_slug, lightweight]);

  const refresh = useCallback(() => {
    return loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!auto_refresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        loadProducts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [auto_refresh, loading, loadProducts]);

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