/**
 * Search Performance Optimization Utility
 */

export class SearchOptimizer {
  private static searchCache = new Map<string, any[]>();
  private static indexCache = new Map<string, any[]>();
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

  // Build optimized search index with priority fields
  static buildSearchIndex(products: any[], cacheKey: string = 'default') {
    this.clearExpiredCache();
    
    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const index = products.map((p: any) => ({
      p,
      // Create searchable fields in priority order
      title: (p.title || '').toLowerCase(),
      category: (p.category || p.product_type || '').toLowerCase(), 
      collections: Array.isArray(p.collection_handles) 
        ? p.collection_handles.join(' ').toLowerCase()
        : (p.collections || '').toLowerCase(),
      productType: (p.product_type || '').toLowerCase(),
      // Combined search string for fallback
      combined: `${p.title || ''} ${p.category || p.product_type || ''} ${
        Array.isArray(p.collection_handles) ? p.collection_handles.join(' ') : (p.collections || '')
      } ${p.product_type || ''}`.toLowerCase()
    }));
    
    this.indexCache.set(cacheKey, index);
    
    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`Search index build took ${duration.toFixed(2)}ms for ${products.length} products`);
    }
    
    return index;
  }

  // Hierarchical search with specified priority: Product Name > Collection > Category > Product Type
  static searchProductsWithHierarchy(query: string, index: any[], maxResults: number = 50) {
    const cacheKey = `hierarchy_${query.toLowerCase()}_${maxResults}`;
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return [];
    }

    // Score matches with specified hierarchy: Product Name > Collection > Category > Product Type
    const scoredResults = index
      .map(item => {
        let score = 0;
        let matchedField = '';
        
        // Priority 1: Product name/title (highest score)
        if (item.title.includes(searchTerm)) {
          score = 1000;
          matchedField = 'title';
          // Bonus for exact match or starts with
          if (item.title === searchTerm) score += 500;
          else if (item.title.startsWith(searchTerm)) score += 250;
        }
        // Priority 2: Product collection (second priority)
        else if (item.collections.includes(searchTerm)) {
          score = 750;
          matchedField = 'collections';
        }
        // Priority 3: Category (third priority)
        else if (item.category.includes(searchTerm)) {
          score = 500;
          matchedField = 'category';
        }
        // Priority 4: Product type (lowest priority)
        else if (item.productType.includes(searchTerm)) {
          score = 250;
          matchedField = 'productType';
        }
        
        return score > 0 ? { ...item, score, matchedField } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, maxResults)
      .map((item: any) => item.p);

    this.searchCache.set(cacheKey, scoredResults);
    
    const duration = performance.now() - startTime;
    if (duration > 10) {
      console.warn(`Hierarchical search took ${duration.toFixed(2)}ms for query "${query}"`);
    }

    return scoredResults;
  }

  // Optimized search with priority scoring
  static searchProducts(query: string, index: any[], maxResults: number = 50) {
    const cacheKey = `${query.toLowerCase()}_${maxResults}`;
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return [];
    }

    // Score matches based on priority: Name > Category > Collection > Product Type
    const scoredResults = index
      .map(item => {
        let score = 0;
        let matchedField = '';
        
        // Priority 1: Product name/title (highest score)
        if (item.title.includes(searchTerm)) {
          score = 100;
          matchedField = 'title';
          // Bonus for exact match or starts with
          if (item.title === searchTerm) score += 50;
          else if (item.title.startsWith(searchTerm)) score += 25;
        }
        // Priority 2: Category
        else if (item.category.includes(searchTerm)) {
          score = 75;
          matchedField = 'category';
        }
        // Priority 3: Collections
        else if (item.collections.includes(searchTerm)) {
          score = 50;
          matchedField = 'collections';
        }
        // Priority 4: Product type
        else if (item.productType.includes(searchTerm)) {
          score = 25;
          matchedField = 'productType';
        }
        
        return score > 0 ? { ...item, score, matchedField } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, maxResults)
      .map((item: any) => item.p);

    this.searchCache.set(cacheKey, scoredResults);
    
    const duration = performance.now() - startTime;
    if (duration > 10) {
      console.warn(`Search took ${duration.toFixed(2)}ms for query "${query}"`);
    }

    return scoredResults;
  }

  // Get search suggestions with priority
  static getSearchSuggestions(query: string, index: any[], maxSuggestions: number = 5) {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm || searchTerm.length < 2) return [];

    // Prioritize title matches for suggestions
    const titleMatches = index
      .filter(item => item.title.startsWith(searchTerm))
      .slice(0, maxSuggestions)
      .map(item => item.p.title);
      
    // If we need more suggestions, add category/type matches
    if (titleMatches.length < maxSuggestions) {
      const categoryMatches = index
        .filter(item => 
          !item.title.startsWith(searchTerm) && 
          (item.category.startsWith(searchTerm) || item.productType.startsWith(searchTerm))
        )
        .slice(0, maxSuggestions - titleMatches.length)
        .map(item => item.p.title);
      
      return [...titleMatches, ...categoryMatches];
    }

    return titleMatches;
  }

  // Pre-warm cache with common searches
  static preWarmCache(commonQueries: string[], index: any[]) {
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
