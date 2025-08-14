import { useState, useEffect, useCallback } from 'react';

interface CacheOptions<T> {
  key: string;
  ttl?: number; // Time to live in milliseconds
  storage?: 'memory' | 'session' | 'local';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OptimizedCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get<T>(key: string, storage: 'memory' | 'session' | 'local' = 'memory'): T | null {
    try {
      if (storage === 'memory') {
        const entry = this.memoryCache.get(key);
        if (entry && Date.now() - entry.timestamp < entry.ttl) {
          return entry.data;
        }
        this.memoryCache.delete(key);
        return null;
      }

      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const cached = storageObj.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() - entry.timestamp < entry.ttl) {
        return entry.data;
      }
      
      storageObj.removeItem(key);
      return null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T, ttl: number, storage: 'memory' | 'session' | 'local' = 'memory'): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };

      if (storage === 'memory') {
        this.memoryCache.set(key, entry);
        return;
      }

      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      storageObj.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  delete(key: string, storage: 'memory' | 'session' | 'local' = 'memory'): void {
    if (storage === 'memory') {
      this.memoryCache.delete(key);
      return;
    }

    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    storageObj.removeItem(key);
  }

  clear(storage: 'memory' | 'session' | 'local' = 'memory'): void {
    if (storage === 'memory') {
      this.memoryCache.clear();
      return;
    }

    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    storageObj.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

const globalCache = new OptimizedCache();

export function useOptimizedCaching<T>(options: CacheOptions<T>) {
  const { key, ttl = 5 * 60 * 1000, storage = 'memory' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const getCached = useCallback((): T | null => {
    return globalCache.get<T>(key, storage);
  }, [key, storage]);

  const setCached = useCallback((newData: T): void => {
    globalCache.set(key, newData, ttl, storage);
    setData(newData);
  }, [key, ttl, storage]);

  const deleteCached = useCallback((): void => {
    globalCache.delete(key, storage);
    setData(null);
  }, [key, storage]);

  const fetchWithCache = useCallback(async <R>(
    fetcher: () => Promise<R>,
    transform?: (result: R) => T
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      // Check cache first
      const cached = getCached();
      if (cached) {
        setData(cached);
        setLoading(false);
        return cached;
      }

      // Fetch fresh data
      const result = await fetcher();
      const transformedData = transform ? transform(result) : (result as unknown as T);
      
      setCached(transformedData);
      setLoading(false);
      return transformedData;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [getCached, setCached]);

  // Load cached data on mount
  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setData(cached);
    }
  }, [getCached]);

  return {
    data,
    loading,
    getCached,
    setCached,
    deleteCached,
    fetchWithCache
  };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCache.destroy();
  });
}