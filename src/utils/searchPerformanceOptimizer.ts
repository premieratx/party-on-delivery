import { PerformanceMonitor } from './performanceOptimizer';

/**
 * Advanced search performance optimizer
 * Implements best practices for sub-50ms search response times
 */
export class SearchPerformanceOptimizer {
  private static instance: SearchPerformanceOptimizer;
  private searchMetrics: Map<string, number[]> = new Map();
  private slowSearchThreshold = 100; // ms

  static getInstance(): SearchPerformanceOptimizer {
    if (!SearchPerformanceOptimizer.instance) {
      SearchPerformanceOptimizer.instance = new SearchPerformanceOptimizer();
    }
    return SearchPerformanceOptimizer.instance;
  }

  /**
   * Track search performance and identify bottlenecks
   */
  trackSearch(query: string, duration: number, resultCount: number): void {
    // Store metrics for analysis
    if (!this.searchMetrics.has(query)) {
      this.searchMetrics.set(query, []);
    }
    this.searchMetrics.get(query)!.push(duration);

    // Log slow searches for optimization
    if (duration > this.slowSearchThreshold) {
      console.warn(`🐌 Slow search detected: "${query}" took ${duration.toFixed(2)}ms`);
      this.analyzeSlowSearch(query, duration, resultCount);
    }

    // Use PerformanceMonitor for comprehensive tracking
    PerformanceMonitor.measure('search-performance', () => duration);
  }

  /**
   * Analyze why a search was slow and suggest optimizations
   */
  private analyzeSlowSearch(query: string, duration: number, resultCount: number): void {
    const reasons: string[] = [];

    if (resultCount > 500) {
      reasons.push('Large result set');
    }

    if (query.length < 3) {
      reasons.push('Very short query (broad search)');
    }

    if (query.includes(' ')) {
      reasons.push('Multi-word query');
    }

    console.group(`🔍 Slow Search Analysis: "${query}"`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.log(`Results: ${resultCount}`);
    console.log(`Potential reasons:`, reasons);
    console.groupEnd();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageSearchTime: number;
    slowSearches: number;
    totalSearches: number;
    fastestSearch: number;
    slowestSearch: number;
  } {
    const allDurations: number[] = [];
    this.searchMetrics.forEach(durations => {
      allDurations.push(...durations);
    });

    if (allDurations.length === 0) {
      return {
        averageSearchTime: 0,
        slowSearches: 0,
        totalSearches: 0,
        fastestSearch: 0,
        slowestSearch: 0
      };
    }

    const average = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    const slowSearches = allDurations.filter(d => d > this.slowSearchThreshold).length;

    return {
      averageSearchTime: average,
      slowSearches,
      totalSearches: allDurations.length,
      fastestSearch: Math.min(...allDurations),
      slowestSearch: Math.max(...allDurations)
    };
  }

  /**
   * Optimize search query for better performance
   */
  optimizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 50); // Limit query length
  }

  /**
   * Check if search should be debounced based on query characteristics
   */
  shouldDebounce(query: string): boolean {
    // Debounce very short queries more aggressively
    if (query.length <= 2) return true;
    
    // Don't debounce exact product names
    if (query.length > 10) return false;
    
    return true;
  }

  /**
   * Get recommended debounce delay based on query
   */
  getRecommendedDebounce(query: string): number {
    if (query.length <= 1) return 500; // Longer delay for single chars
    if (query.length <= 2) return 300; // Medium delay for 2 chars
    if (query.length <= 3) return 200; // Shorter delay for 3 chars
    return 100; // Minimal delay for longer queries
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanupMetrics(): void {
    // Keep only the last 1000 search metrics
    if (this.searchMetrics.size > 1000) {
      const entries = Array.from(this.searchMetrics.entries());
      this.searchMetrics.clear();
      
      // Keep the most recent entries
      entries.slice(-500).forEach(([query, durations]) => {
        this.searchMetrics.set(query, durations.slice(-10)); // Keep last 10 results per query
      });
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): void {
    const stats = this.getPerformanceStats();
    
    console.group('🚀 Search Performance Report');
    console.log(`Total searches: ${stats.totalSearches}`);
    console.log(`Average time: ${stats.averageSearchTime.toFixed(2)}ms`);
    console.log(`Fastest search: ${stats.fastestSearch.toFixed(2)}ms`);
    console.log(`Slowest search: ${stats.slowestSearch.toFixed(2)}ms`);
    console.log(`Slow searches (>${this.slowSearchThreshold}ms): ${stats.slowSearches}`);
    
    if (stats.slowSearches > 0) {
      const slowPercentage = (stats.slowSearches / stats.totalSearches * 100).toFixed(1);
      console.warn(`⚠️ ${slowPercentage}% of searches are slow`);
    } else {
      console.log('✅ All searches are fast!');
    }
    console.groupEnd();
  }
}

// Export singleton instance
export const searchPerformanceOptimizer = SearchPerformanceOptimizer.getInstance();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchPerformanceOptimizer.cleanupMetrics();
  }, 5 * 60 * 1000);
}
