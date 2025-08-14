interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  compressionEnabled: boolean;
}

class EnhancedCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private accessOrder = new Map<string, number>(); // For LRU eviction

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      compressionEnabled: true,
      ...config
    };
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.config.defaultTTL);
    
    // Clean expired entries before adding new one
    this.cleanExpired();
    
    // Evict LRU entries if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: this.config.compressionEnabled ? this.compress(data) : data,
      timestamp: Date.now(),
      expires
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessOrder.set(key, Date.now());
    
    return this.config.compressionEnabled ? this.decompress(entry.data) : entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires < Date.now()) {
      this.invalidate(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      config: this.config,
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(e => e.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(e => e.timestamp))
    };
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.size === 0) return;
    
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.invalidate(oldestKey);
    }
  }

  private compress<T>(data: T): T {
    // Simple compression - could be enhanced with actual compression algorithms
    if (typeof data === 'string' && data.length > 1000) {
      try {
        return JSON.parse(JSON.stringify(data)) as T;
      } catch {
        return data;
      }
    }
    return data;
  }

  private decompress<T>(data: T): T {
    return data; // Match the compress logic
  }

  // Force immediate sync override
  forceRefresh(key: string): void {
    this.invalidate(key);
    console.log(`🔄 Force refreshed cache for key: ${key}`);
  }

  // Immediate cache update (bypasses TTL)
  immediateUpdate<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data: this.config.compressionEnabled ? this.compress(data) : data,
      timestamp: Date.now(),
      expires: Date.now() + this.config.defaultTTL
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
    console.log(`⚡ Immediate cache update for key: ${key}`);
  }
}

// DISABLED - These were causing automatic preloading
export const productCache = {
  get: () => null,
  set: () => {},
  clear: () => {},
  has: () => false,
  size: () => 0,
  getStats: () => ({ size: 0, config: {}, oldestEntry: 0, newestEntry: 0 })
};

export const shopifyCache = {
  get: () => null,
  set: () => {},
  clear: () => {},
  has: () => false,
  size: () => 0,
  getStats: () => ({ size: 0, config: {}, oldestEntry: 0, newestEntry: 0 })
};

export const generalCache = {
  get: () => null,
  set: () => {},
  clear: () => {},
  has: () => false,
  size: () => 0,
  getStats: () => ({ size: 0, config: {}, oldestEntry: 0, newestEntry: 0 })
};

// COMPLETELY DISABLED - These functions were causing preloading issues
export const forceProductRefresh = () => {
  console.log('🚫 forceProductRefresh DISABLED');
};

export const forceShopifySync = () => {
  console.log('🚫 forceShopifySync DISABLED');
};