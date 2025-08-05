/**
 * Advanced Cache Manager with aggressive preloading and optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
  accessCount: number;
  lastAccess: number;
}

interface PrefetchStrategy {
  priority: number;
  endpoint: string;
  params?: any;
  interval: number; // ms
}

class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private prefetchQueue: PrefetchStrategy[] = [];
  private isPreloading = false;
  private maxCacheSize = 200;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupBackgroundSync();
    this.setupPrefetchStrategies();
    this.startAggressivePreloading();
  }

  // Ultra-fast get with predictive loading
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Trigger background fetch for missing data
      this.triggerBackgroundFetch(key);
      return null;
    }

    if (Date.now() > entry.expires) {
      // Stale data - return it but refresh in background
      this.triggerBackgroundRefresh(key);
      return entry.data;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    return entry.data;
  }

  // Set with intelligent TTL based on data type
  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.getOptimalTTL(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      accessCount: 1,
      lastAccess: Date.now()
    };

    this.cache.set(key, entry);
    this.optimizeCache();
  }

  // Predictive preloading based on user behavior
  private setupPrefetchStrategies(): void {
    this.prefetchQueue = [
      {
        priority: 1,
        endpoint: 'instant-product-cache',
        interval: 30000 // 30 seconds
      },
      {
        priority: 2,
        endpoint: 'get-all-collections',
        interval: 60000 // 1 minute
      },
      {
        priority: 3,
        endpoint: 'get-dashboard-data',
        params: { type: 'admin' },
        interval: 45000 // 45 seconds
      }
    ];
  }

  // Background sync with intelligent timing
  private setupBackgroundSync(): void {
    this.backgroundSyncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, 15000); // Every 15 seconds
  }

  // Aggressive preloading on app start
  private async startAggressivePreloading(): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    try {
      // Preload critical data in parallel
      await Promise.allSettled([
        this.preloadInstantCache(),
        this.preloadCollections(),
        this.preloadImages(),
        this.preloadCategories()
      ]);
    } catch (error) {
      console.warn('Preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  // Preload instant cache with extra optimization
  private async preloadInstantCache(): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('instant-product-cache');
      
      if (data?.collections) {
        this.set('instant-product-cache', data, 2 * 60 * 1000); // 2 minutes
        this.set('collections-primary', data.collections, 5 * 60 * 1000); // 5 minutes
        
        // Also cache individual collections for faster access
        data.collections.forEach((collection: any) => {
          this.set(`collection-${collection.handle}`, collection, 10 * 60 * 1000);
        });
      }
    } catch (error) {
      console.warn('Failed to preload instant cache:', error);
    }
  }

  // Preload collections with categorization
  private async preloadCollections(): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('get-all-collections');
      
      if (data?.collections) {
        this.set('all-collections', data.collections, 10 * 60 * 1000);
        
        // Cache by category for faster filtering
        const categorized = this.categorizeCollections(data.collections);
        Object.entries(categorized).forEach(([category, collections]) => {
          this.set(`category-${category}`, collections, 15 * 60 * 1000);
        });
      }
    } catch (error) {
      console.warn('Failed to preload collections:', error);
    }
  }

  // Intelligent image preloading
  private async preloadImages(): Promise<void> {
    const collections = this.get('collections-primary') as any;
    if (!collections || !Array.isArray(collections)) return;

    const imageUrls: string[] = [];
    collections.forEach((collection: any) => {
      if (collection.products && Array.isArray(collection.products)) {
        collection.products.forEach((product: any) => {
          if (product.image) {
            imageUrls.push(this.optimizeImageUrl(product.image));
          }
        });
      }
    });

    // Preload first 20 images
    imageUrls.slice(0, 20).forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  // Preload category data
  private async preloadCategories(): Promise<void> {
    const categories = [
      'spirits', 'beer', 'wine', 'cocktails', 'mixers', 'party-supplies'
    ];

    categories.forEach(category => {
      // Pre-warm category cache
      this.set(`category-meta-${category}`, { 
        name: category, 
        preloaded: true,
        timestamp: Date.now()
      }, 30 * 60 * 1000);
    });
  }

  // Background sync for frequently accessed data
  private async performBackgroundSync(): Promise<void> {
    const highPriorityKeys = [
      'instant-product-cache',
      'collections-primary', 
      'all-collections'
    ];

    for (const key of highPriorityKeys) {
      const entry = this.cache.get(key);
      if (entry && entry.accessCount > 5) {
        // Refresh popular data proactively
        const timeUntilExpiry = entry.expires - Date.now();
        if (timeUntilExpiry < 60000) { // Less than 1 minute left
          this.triggerBackgroundRefresh(key);
        }
      }
    }
  }

  // Smart cache optimization with LRU
  private optimizeCache(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        score: this.calculateCacheScore(value)
      }))
      .sort((a, b) => a.score - b.score);

    // Remove lowest scoring 25% of entries
    const toRemove = Math.floor(this.cache.size * 0.25);
    entries.slice(0, toRemove).forEach(entry => {
      this.cache.delete(entry.key);
    });
  }

  // Calculate cache score for LRU optimization
  private calculateCacheScore(entry: CacheEntry<any>): number {
    const age = Date.now() - entry.timestamp;
    const timeSinceAccess = Date.now() - entry.lastAccess;
    const accessFrequency = entry.accessCount / (age / 1000); // accesses per second
    
    // Lower score = higher priority to keep
    return timeSinceAccess / (accessFrequency + 1);
  }

  // Get optimal TTL based on data type
  private getOptimalTTL(key: string): number {
    if (key.includes('instant') || key.includes('product')) return 2 * 60 * 1000; // 2 minutes
    if (key.includes('collection')) return 5 * 60 * 1000; // 5 minutes
    if (key.includes('category')) return 10 * 60 * 1000; // 10 minutes
    if (key.includes('image')) return 30 * 60 * 1000; // 30 minutes
    return 5 * 60 * 1000; // Default 5 minutes
  }

  // Categorize collections for faster filtering
  private categorizeCollections(collections: any[]): Record<string, any[]> {
    const categories: Record<string, any[]> = {};
    
    collections.forEach(collection => {
      const category = this.inferCategory(collection.handle);
      if (!categories[category]) categories[category] = [];
      categories[category].push(collection);
    });

    return categories;
  }

  // Infer category from collection handle
  private inferCategory(handle: string): string {
    if (handle.includes('spirit') || handle.includes('vodka') || handle.includes('whiskey')) return 'spirits';
    if (handle.includes('beer') || handle.includes('brew')) return 'beer';
    if (handle.includes('wine') || handle.includes('champagne')) return 'wine';
    if (handle.includes('cocktail') || handle.includes('mixer')) return 'cocktails';
    if (handle.includes('party') || handle.includes('supplies')) return 'party-supplies';
    return 'other';
  }

  // Optimize image URLs for better loading
  private optimizeImageUrl(url: string): string {
    if (!url) return url;
    
    // Convert to WebP if possible and add optimal sizing
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=300&height=300&format=webp&quality=85`;
  }

  // Background fetch for missing data
  private async triggerBackgroundFetch(key: string): Promise<void> {
    if (key.includes('instant')) {
      setTimeout(() => this.preloadInstantCache(), 0);
    } else if (key.includes('collection')) {
      setTimeout(() => this.preloadCollections(), 0);
    }
  }

  // Background refresh for stale data
  private async triggerBackgroundRefresh(key: string): Promise<void> {
    // Non-blocking refresh
    setTimeout(async () => {
      try {
        if (key.includes('instant')) {
          await this.preloadInstantCache();
        } else if (key.includes('collection')) {
          await this.preloadCollections();
        }
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }, 0);
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // Simplified hit rate calculation
    const recentEntries = Array.from(this.cache.values())
      .filter(entry => Date.now() - entry.timestamp < 5 * 60 * 1000);
    return recentEntries.length / Math.max(1, this.cache.size);
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
  }

  // Cleanup on app exit
  destroy(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
    }
    this.clear();
  }
}

export const advancedCacheManager = new AdvancedCacheManager();
export { AdvancedCacheManager };
