import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  refreshInterval?: number; // Auto refresh interval
  fallbackEnabled?: boolean;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

export const useSmartCache = <T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    refreshInterval = 0, // No auto refresh by default
    fallbackEnabled = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Memory cache for instant access
  const memoryCache = new Map<string, CachedData<any>>();

  const isDataStale = useCallback((timestamp: number) => {
    return Date.now() - timestamp > ttl;
  }, [ttl]);

  const getFromMemoryCache = useCallback((key: string): T | null => {
    const cached = memoryCache.get(key);
    if (cached && !isDataStale(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }, [memoryCache, isDataStale]);

  const setToMemoryCache = useCallback((key: string, data: T) => {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
  }, [memoryCache]);

  const fetchData = useCallback(async (forceRefreshParam = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check memory cache first
      if (!forceRefreshParam) {
        const cachedData = getFromMemoryCache(cacheKey);
        if (cachedData) {
          console.log(`📦 SmartCache: Using memory cache for ${cacheKey}`);
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // Try instant product cache for products
      if (cacheKey.includes('products') && !forceRefreshParam) {
        try {
          const { data: cacheData, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
            body: { forceRefresh: false }
          });

          if (!cacheError && cacheData?.success && cacheData?.data) {
            console.log(`⚡ SmartCache: Using instant cache for ${cacheKey}`);
            const result = cacheData.data as T;
            setData(result);
            setToMemoryCache(cacheKey, result);
            setLastFetch(Date.now());
            setLoading(false);
            return result;
          }
        } catch (cacheErr) {
          console.log('Cache failed, falling back to fresh fetch');
        }
      }

      // Fallback to fresh fetch
      console.log(`🔄 SmartCache: Fresh fetch for ${cacheKey}`);
      const freshData = await fetchFunction();
      setData(freshData);
      setToMemoryCache(cacheKey, freshData);
      setLastFetch(Date.now());

      return freshData;
    } catch (err) {
      console.error(`❌ SmartCache: Error fetching ${cacheKey}:`, err);
      setError(err.message);
      
      // Try to return stale data if available and fallback is enabled
      if (fallbackEnabled) {
        const staleData = memoryCache.get(cacheKey);
        if (staleData) {
          console.log(`🔄 SmartCache: Using stale data for ${cacheKey}`);
          setData(staleData.data);
          return staleData.data;
        }
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFunction, getFromMemoryCache, setToMemoryCache, fallbackEnabled]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh interval with proper cleanup
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!loading && isDataStale(lastFetch)) {
          fetchData(true);
        }
      }, refreshInterval);
      
      // Cleanup on unmount or dependency change
      return () => {
        clearInterval(interval);
      };
    }
  }, [refreshInterval, loading, lastFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale: lastFetch > 0 && isDataStale(lastFetch),
    lastFetch: new Date(lastFetch)
  };
};

export default useSmartCache;