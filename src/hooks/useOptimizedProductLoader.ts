import { useState, useEffect, useCallback, useRef } from 'react';
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
  product_type?: string; // Shopify productType for search
  search_category?: string; // Normalized category for search
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
  use_type?: 'search' | 'delivery'; // Determines filtering method
  search_category?: string; // For search functionality
  category?: string; // For delivery app tabs
  collection_handle?: string; // For delivery app tabs
}

export function useOptimizedProductLoader(options: LoaderOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { 
    app_slug, 
    lightweight = true, 
    auto_refresh = true,
    use_type = 'delivery',
    search_category,
    category,
    collection_handle
  } = options;

  const loadProducts = useCallback(async (force_refresh = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Loading products by collection only`);

      // Load products directly from Supabase cache by collection
      const { data, error: functionError } = await supabase.functions.invoke('get-unified-products', {
        body: { 
          collection_handle,
          force_refresh,
          lightweight,
          use_type: 'delivery'
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

      console.log(`✅ Loaded ${data.products?.length || 0} products from Supabase cache`);

      // Reset retry count on successful load
      setRetryCount(0);

    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [collection_handle, lightweight, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refresh
    return loadProducts(true);
  }, [loadProducts]);

  // Load products once on mount and listen for refresh events
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      loadProducts();
    }
    
    // Listen for custom refresh events
    const handleRefresh = () => {
      console.log('🔄 Refreshing products due to external event');
      loadProducts(true);
    };
    
    window.addEventListener('collectionsUpdated', handleRefresh);
    window.addEventListener('forceProductRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('collectionsUpdated', handleRefresh);
      window.removeEventListener('forceProductRefresh', handleRefresh);
    };
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