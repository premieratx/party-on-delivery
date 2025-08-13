/**
 * Search Performance Optimization Utility
 */

export class SearchOptimizer {
  private static searchCache = new Map<string, any[]>();
  private static indexCache = new Map<string, { p: any; t: string }[]>();
  private static lastCacheTime = 0;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  // Clear expired cache entries
  static clearExpiredCache() {
    const now = Date.now();
    if (now - this.lastCacheTime > this.CACHE_DURATION) {
      this.searchCache.clear();
      this.indexCache.clear();
      this.lastCacheTime = now;
    }
  }

  // Build optimized search index
  static buildSearchIndex(products: any[], cacheKey: string = 'default') {
    this.clearExpiredCache();
    
    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const index = products.map((p: any) => ({
      p,
      t: p.title.toLowerCase() // Only index title for consistent search
    }));
    
    this.indexCache.set(cacheKey, index);
    
    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`Search index build took ${duration.toFixed(2)}ms for ${products.length} products`);
    }
    
    return index;
  }

  // Optimized search with caching
  static searchProducts(query: string, index: { p: any; t: string }[], maxResults: number = 50) {
    const cacheKey = `${query.toLowerCase()}_${maxResults}`;
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return [];
    }

    // Use simple string includes for best performance
    const results = index
      .filter(item => item.t.includes(searchTerm))
      .slice(0, maxResults)
      .map(item => item.p);

    this.searchCache.set(cacheKey, results);
    
    const duration = performance.now() - startTime;
    if (duration > 10) {
      console.warn(`Search took ${duration.toFixed(2)}ms for query "${query}"`);
    }

    return results;
  }

  // Get search suggestions (titles starting with query)
  static getSearchSuggestions(query: string, index: { p: any; t: string }[], maxSuggestions: number = 5) {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm || searchTerm.length < 2) return [];

    return index
      .filter(item => item.t.startsWith(searchTerm))
      .slice(0, maxSuggestions)
      .map(item => item.p.title);
  }

  // Pre-warm cache with common searches
  static preWarmCache(commonQueries: string[], index: { p: any; t: string }[]) {
    commonQueries.forEach(query => {
      this.searchProducts(query, index);
    });
  }
}

// Search performance monitoring
export class SearchPerformanceMonitor {
  private static metrics: { query: string; duration: number; resultCount: number; timestamp: number }[] = [];

  static recordSearch(query: string, duration: number, resultCount: number) {
    this.metrics.push({
      query,
      duration,
      resultCount,
      timestamp: Date.now()
    });

    // Keep only last 100 searches
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  static getAverageSearchTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  static getSlowSearches(threshold: number = 50): typeof this.metrics {
    return this.metrics.filter(m => m.duration > threshold);
  }

  static logPerformanceReport() {
    if (this.metrics.length === 0) return;

    const avgTime = this.getAverageSearchTime();
    const slowSearches = this.getSlowSearches();
    
    console.group('Search Performance Report');
    console.log(`Average search time: ${avgTime.toFixed(2)}ms`);
    console.log(`Total searches: ${this.metrics.length}`);
    console.log(`Slow searches (>50ms): ${slowSearches.length}`);
    
    if (slowSearches.length > 0) {
      console.log('Slow searches:', slowSearches.map(s => `"${s.query}" (${s.duration.toFixed(2)}ms)`));
    }
    console.groupEnd();
  }
}
