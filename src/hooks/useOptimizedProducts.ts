import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProductCache } from './useProductCache';
import { ultraFastLoader } from '@/utils/ultraFastLoader';
import { advancedCacheManager } from '@/utils/advancedCacheManager';

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

interface UseOptimizedProductsOptions {
  initialLimit?: number;
  loadMoreLimit?: number;
}

export function useOptimizedProducts(options: UseOptimizedProductsOptions = {}) {
  const { initialLimit = 20, loadMoreLimit = 20 } = options;
  
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { getCachedData, setCachedData, clearCache, cacheHit } = useProductCache<ShopifyCollection[]>({
    cacheKey: 'cachedProducts',
    expiryMinutes: 5
  });

  const optimizeImageUrl = useCallback((url: string) => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=300&height=300`;
  }, []);

  const processCollections = useCallback((rawCollections: ShopifyCollection[], limit?: number) => {
    return rawCollections.map(collection => ({
      ...collection,
      products: (limit ? collection.products.slice(0, limit) : collection.products).map(product => ({
        ...product,
        image: optimizeImageUrl(product.image),
        images: product.images?.map(optimizeImageUrl)
      }))
    }));
  }, [optimizeImageUrl]);

  const fetchCollections = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('⚡ Ultra-fast product loading initiated...');
      const startTime = Date.now();

      // Use reliable collections API
      console.log('📦 Using get-all-collections API');
      const { data: collectionsData, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
      if (collectionsError) throw collectionsError;

      if (collectionsData?.success && collectionsData?.collections) {
        console.log(`✅ Collections loaded in ${Date.now() - startTime}ms`);
        
        // Process collections with initial limit
        const processedCollections = processCollections(collectionsData.collections, initialLimit);
        
        setCollections(processedCollections);
        setCachedData(processedCollections);
        
        // Check if there are more products to load
        const hasMoreProducts = collectionsData.collections.some((collection: ShopifyCollection) => 
          collection.products.length > initialLimit
        );
        setHasMore(hasMoreProducts);
        
        setLoading(false);
        return;
      }

      throw new Error('Failed to load collections');

    } catch (err) {
      console.error('Product loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [processCollections, initialLimit, setCachedData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      
      // Get fresh data and load more products for each collection
      const { data: moreCollectionsData, error: moreError } = await supabase.functions.invoke('get-all-collections');
      if (moreError) throw moreError;

      const currentMaxProducts = Math.max(
        ...collections.map(c => c.products.length)
      );
      const newLimit = currentMaxProducts + loadMoreLimit;

      const processedCollections = processCollections(moreCollectionsData.collections, newLimit);
      setCollections(processedCollections);
      setCachedData(processedCollections);

      // Check if there are still more products
      const stillHasMore = moreCollectionsData.collections.some((collection: ShopifyCollection) => 
        collection.products.length > newLimit
      );
      setHasMore(stillHasMore);

    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [collections, loadMoreLimit, processCollections, setCachedData, loadingMore, hasMore]);

  const refreshProducts = useCallback(() => {
    clearCache();
    fetchCollections(true);
  }, [clearCache, fetchCollections]);

  // Filter products by category
  const getProductsByCategory = useCallback((categoryHandle: string) => {
    const collection = collections.find(c => c.handle === categoryHandle);
    return collection?.products || [];
  }, [collections]);

  // Search products
  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    const allProducts = collections.flatMap(c => c.products);
    
    return allProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }, [collections]);

  useEffect(() => {
    fetchCollections();
  }, []);

  return {
    collections,
    loading,
    loadingMore,
    error,
    hasMore,
    cacheHit,
    loadMore,
    refreshProducts,
    getProductsByCategory,
    searchProducts
  };
}