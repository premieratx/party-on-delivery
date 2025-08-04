import { useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualList } from './useVirtualList';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
}

interface UseVirtualizedProductsOptions {
  containerHeight: number;
  itemHeight?: number;
  category?: string;
  cacheKey?: string;
  limit?: number;
}

// Smart preloader for critical product data
const preloadCriticalData = async () => {
  const cacheKey = 'critical_products_v2';
  const cached = localStorage.getItem(cacheKey);
  const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
  
  if (cached && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
    return JSON.parse(cached);
  }
  
  // Fetch only essential product data for the first 30 products
  const { data, error } = await supabase.functions.invoke('get-all-collections', {
    body: { limit: 30, fields: 'id,title,price,image,handle,variants' }
  });
  
  if (!error && data?.collections) {
    const criticalData = data.collections.map((collection: ShopifyCollection) => ({
      ...collection,
      products: collection.products.slice(0, 10).map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image?.includes('?') 
          ? `${product.image}&width=300&height=300` 
          : `${product.image}?width=300&height=300`,
        handle: product.handle,
        variants: product.variants.slice(0, 1) // Only first variant for speed
      }))
    }));
    
    localStorage.setItem(cacheKey, JSON.stringify(criticalData));
    localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 2 * 60 * 1000).toString()); // 2 minutes
    return criticalData;
  }
  
  return null;
};

export function useVirtualizedProducts({
  containerHeight,
  itemHeight = 280,
  category,
  cacheKey = 'virtualized_products',
  limit = 100
}: UseVirtualizedProductsOptions) {
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!category || category === 'all') return allProducts;
    return allProducts.filter(product => {
      // Simple category matching based on product title/handle
      const searchTerm = category.toLowerCase();
      return product.title.toLowerCase().includes(searchTerm) ||
             product.handle.toLowerCase().includes(searchTerm);
    });
  }, [allProducts, category]);

  // Virtual list for performance
  const {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  } = useVirtualList(filteredProducts, {
    itemHeight,
    containerHeight,
    overscan: 5
  });

  // Smart data fetching with progressive loading
  const fetchProducts = useCallback(async (offset = 0, useCache = true) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setError(null);

        // Try to get critical data first for instant loading
        const criticalData = await preloadCriticalData();
        if (criticalData) {
          const products = criticalData.flatMap((collection: ShopifyCollection) => collection.products);
          setAllProducts(products);
          setLoading(false);
          
          // Load full data in background
          setTimeout(() => fetchFullData(), 100);
          return;
        }
      }

      // Fetch full data with pagination
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { 
          offset, 
          limit,
          forceRefresh: !useCache && offset === 0
        }
      });

      if (error) throw error;
      if (!data?.collections) throw new Error('No data received');

      const products = data.collections.flatMap((collection: ShopifyCollection) => 
        collection.products.map(product => ({
          ...product,
          image: product.image?.includes('?') 
            ? `${product.image}&width=300&height=300` 
            : `${product.image}?width=300&height=300`
        }))
      );

      if (offset === 0) {
        setAllProducts(products);
      } else {
        setAllProducts(prev => [...prev, ...products]);
      }

      setHasMore(products.length === limit);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Load full data in background
  const fetchFullData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh: true }
      });

      if (!error && data?.collections) {
        const products = data.collections.flatMap((collection: ShopifyCollection) => 
          collection.products.map(product => ({
            ...product,
            image: product.image?.includes('?') 
              ? `${product.image}&width=300&height=300` 
              : `${product.image}?width=300&height=300`
          }))
        );
        setAllProducts(products);
      }
    } catch (err) {
      console.error('Background fetch error:', err);
    }
  }, []);

  // Load more products when scrolled near bottom
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(allProducts.length, false);
    }
  }, [loading, hasMore, allProducts.length, fetchProducts]);

  // Check if we need to load more based on scroll position
  useEffect(() => {
    const { endIndex } = visibleRange;
    if (endIndex >= filteredProducts.length - 10 && hasMore && !loading) {
      loadMore();
    }
  }, [visibleRange, filteredProducts.length, hasMore, loading, loadMore]);

  // Initial load
  useEffect(() => {
    fetchProducts(0, true);
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    // Clear cache
    localStorage.removeItem('critical_products_v2');
    localStorage.removeItem('critical_products_v2_expiry');
    
    setAllProducts([]);
    setHasMore(true);
    fetchProducts(0, false);
  }, [fetchProducts]);

  return {
    products: allProducts,
    filteredProducts,
    visibleItems,
    totalHeight,
    handleScroll,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    visibleRange
  };
}