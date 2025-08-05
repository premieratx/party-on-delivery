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

// ⚡ INSTANT product loader for sub-1-second loading
const preloadCriticalData = async () => {
  const cacheKey = 'instant_products_cache_v3';
  const cached = localStorage.getItem(cacheKey);
  const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
  
  // Use cache if available and fresh (30 seconds)
  if (cached && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
    return JSON.parse(cached);
  }
  
  try {
    // Use instant cache function for maximum speed
    const { data, error } = await supabase.functions.invoke('instant-product-cache');
    
    if (!error && data?.success) {
      const productData = data.data;
      localStorage.setItem(cacheKey, JSON.stringify(productData));
      localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 30 * 1000).toString()); // 30 second cache
      return productData;
    }
  } catch (error) {
    console.warn('Instant cache failed, using fallback:', error);
  }
  
  // Fallback to regular collections call
  const { data, error } = await supabase.functions.invoke('get-all-collections', {
    body: { limit: 20, fields: 'id,title,price,image,handle,variants' }
  });
  
  if (!error && data?.collections) {
    const criticalData = {
      collections: data.collections.slice(0, 10).map((collection: ShopifyCollection) => ({
        ...collection,
        products: collection.products.slice(0, 8).map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image?.includes('?') 
            ? `${product.image}&width=300&height=300` 
            : `${product.image}?width=300&height=300`,
          handle: product.handle,
          variants: product.variants.slice(0, 1)
        }))
      })),
      products: data.collections.flatMap((c: ShopifyCollection) => 
        c.products.slice(0, 8).map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image?.includes('?') 
            ? `${product.image}&width=300&height=300` 
            : `${product.image}?width=300&height=300`,
          handle: product.handle,
          variants: product.variants.slice(0, 1)
        }))
      )
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(criticalData));
    localStorage.setItem(`${cacheKey}_expiry`, (Date.now() + 30 * 1000).toString());
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

  // Smart data fetching with instant loading
  const fetchProducts = useCallback(async (offset = 0, useCache = true) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setError(null);

        // ALWAYS use instant cache for maximum speed
        const { data: instantData } = await supabase.functions.invoke('instant-product-cache');
        
        if (instantData?.success && instantData?.data) {
          console.log('⚡ Using instant cache for ultra-fast loading');
          
          // Extract products from instant cache
          let products = [];
          if (instantData.data.products) {
            products = instantData.data.products;
          } else if (instantData.data.collections) {
            products = instantData.data.collections.flatMap((collection: any) => collection.products || []);
          }
          
          setAllProducts(products);
          setLoading(false);
          return;
        }
      }

      // This should rarely happen - instant cache should always be available
      console.warn('📦 Instant cache miss - falling back to collections API');
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { offset, limit }
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
    // Clear all instant cache versions
    localStorage.removeItem('instant_products_cache_v3');
    localStorage.removeItem('instant_products_cache_v3_expiry');
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