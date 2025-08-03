import { useState, useEffect } from 'react';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UseProductCacheOptions {
  cacheKey: string;
  expiryMinutes?: number;
}

export function useProductCache<T>(options: UseProductCacheOptions) {
  const { cacheKey, expiryMinutes = 5 } = options;
  const [cacheHit, setCacheHit] = useState(false);

  const getCachedData = (): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: CachedData<T> = JSON.parse(cached);
      const now = Date.now();

      if (now > parsedCache.expiry) {
        localStorage.removeItem(cacheKey);
        setCacheHit(false);
        return null;
      }

      setCacheHit(true);
      return parsedCache.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      localStorage.removeItem(cacheKey);
      setCacheHit(false);
      return null;
    }
  };

  const setCachedData = (data: T) => {
    try {
      const now = Date.now();
      const cachedData: CachedData<T> = {
        data,
        timestamp: now,
        expiry: now + (expiryMinutes * 60 * 1000)
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      setCacheHit(false); // Reset for next fetch
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(cacheKey);
    setCacheHit(false);
  };

  return {
    getCachedData,
    setCachedData,
    clearCache,
    cacheHit
  };
}