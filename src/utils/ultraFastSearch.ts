import { supabase } from '@/integrations/supabase/client';

// Ultra-fast search client with aggressive caching
class UltraFastSearchClient {
  private static instance: UltraFastSearchClient;
  private searchCache = new Map<string, any>();
  private isWarmedUp = false;
  private lastWarmUp = 0;
  private readonly WARMUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UltraFastSearchClient {
    if (!UltraFastSearchClient.instance) {
      UltraFastSearchClient.instance = new UltraFastSearchClient();
    }
    return UltraFastSearchClient.instance;
  }

  async warmUpCache(): Promise<void> {
    if (this.isWarmedUp && Date.now() - this.lastWarmUp < this.WARMUP_INTERVAL) {
      console.log('🔥 Cache already warmed up');
      return;
    }

    console.log('🔥 Warming up ultra-fast search cache...');
    const startTime = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke('ultra-fast-search', {
        body: { action: 'preload' }
      });

      if (error) throw error;

      this.isWarmedUp = true;
      this.lastWarmUp = Date.now();
      
      const endTime = performance.now();
      console.log(`✅ Cache warmed up in ${(endTime - startTime).toFixed(2)}ms`);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to warm up cache:', error);
      throw error;
    }
  }

  async searchProducts(query: string, options: {
    category?: string;
    limit?: number;
    useCache?: boolean;
  } = {}): Promise<{
    products: any[];
    totalFound: number;
    loadTime: string;
    fromCache: boolean;
  }> {
    const startTime = performance.now();
    const { category, limit = 2000, useCache = true } = options;
    
    // Create cache key
    const cacheKey = `${query}_${category || 'all'}_${limit}`;
    
    // Check local cache first for instant results
    if (useCache && this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      const endTime = performance.now();
      
      console.log(`⚡ INSTANT: Cache hit for "${query}" - ${(endTime - startTime).toFixed(2)}ms`);
      
      return {
        ...cached,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        fromCache: true
      };
    }

    // Ensure cache is warmed up
    if (!this.isWarmedUp) {
      await this.warmUpCache();
    }

    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      const { data, error } = await supabase.functions.invoke('ultra-fast-search', {
        body: {
          query,
          category,
          limit,
          action: 'search'
        }
      });

      if (error) throw error;

      // Cache the results locally for instant access
      if (useCache) {
        this.searchCache.set(cacheKey, {
          products: data.products,
          totalFound: data.totalFound
        });

        // Limit cache size
        if (this.searchCache.size > 500) {
          const firstKey = this.searchCache.keys().next().value;
          this.searchCache.delete(firstKey);
        }
      }

      const endTime = performance.now();
      console.log(`🎯 Search completed: "${query}" - ${data.products?.length || 0} results in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        products: data.products || [],
        totalFound: data.totalFound || 0,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Ultra-fast search error:', error);
      
      return {
        products: [],
        totalFound: 0,
        loadTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        fromCache: false
      };
    }
  }

  async getAllProducts(category?: string): Promise<any[]> {
    return this.searchProducts('', { category, limit: 2000 }).then(result => result.products); // Increased limit to handle full catalog
  }

  clearCache(): void {
    this.searchCache.clear();
    this.isWarmedUp = false;
    console.log('🧹 Search cache cleared');
  }

  getCacheStats(): {
    cacheSize: number;
    isWarmedUp: boolean;
    lastWarmUp: number;
  } {
    return {
      cacheSize: this.searchCache.size,
      isWarmedUp: this.isWarmedUp,
      lastWarmUp: this.lastWarmUp
    };
  }
}

// Export singleton instance
export const ultraFastSearch = UltraFastSearchClient.getInstance();

// Lazy warm-up - only warm up cache when actually needed for search
// This prevents unnecessary 1+ second delays on app startup
// Cache will be warmed up automatically on first search if needed