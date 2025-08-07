import { productCache, shopifyCache, forceProductRefresh, forceShopifySync } from './enhancedCacheManager';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  cacheHitRate: number;
  errorRate: number;
}

class PerformanceManager {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  };

  private startTimes = new Map<string, number>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;
  private totalRequests = 0;

  // Measurement methods
  startTimer(key: string): void {
    this.startTimes.set(key, performance.now());
  }

  endTimer(key: string): number {
    const startTime = this.startTimes.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.startTimes.delete(key);
      return duration;
    }
    return 0;
  }

  recordCacheHit(): void {
    this.cacheHits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateCacheHitRate();
  }

  recordError(): void {
    this.errors++;
    this.totalRequests++;
    this.updateErrorRate();
  }

  recordSuccess(): void {
    this.totalRequests++;
    this.updateErrorRate();
  }

  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  private updateErrorRate(): void {
    this.metrics.errorRate = this.totalRequests > 0 ? (this.errors / this.totalRequests) * 100 : 0;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // INSTANT APP-TO-APP SWITCHING OPTIMIZATION
  async optimizeAppSwitching(): Promise<void> {
    console.log('⚡ Optimizing app-to-app switching...');
    
    // Preload critical app resources
    this.preloadCriticalApps();
    
    // Aggressive cache warming
    this.warmAppCache();
    
    // Background resource preloading
    this.backgroundPreloadResources();
  }

  // Performance optimization methods
  async optimizeProductLoading(): Promise<void> {
    console.log('🚀 Starting product loading optimization...');
    
    // Force refresh product cache
    forceProductRefresh();
    
    // Preload critical resources
    this.preloadCriticalImages();
    
    // Optimize network requests
    this.batchNetworkRequests();
  }

  async optimizeShopifySync(): Promise<void> {
    console.log('🔄 Optimizing Shopify sync process...');
    
    // Force immediate Shopify sync
    forceShopifySync();
    
    // Clear any stale data
    localStorage.removeItem('shopify_products_cache');
    
    // Trigger immediate refresh
    window.dispatchEvent(new CustomEvent('force-shopify-refresh'));
  }

  private preloadCriticalImages(): void {
    const criticalImages = [
      // Add critical image URLs here
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  private preloadCriticalApps(): void {
    console.log('🚀 Preloading critical delivery apps...');
    
    // Preload common delivery app configurations
    const criticalApps = [
      'premier-party-cruises---official-alcohol-delivery-service',
      'standard-delivery',
      'party-planner'
    ];
    
    criticalApps.forEach(appSlug => {
      this.preloadAppData(appSlug);
    });
  }

  private async preloadAppData(appSlug: string): Promise<void> {
    try {
      // Cache app configuration
      const appConfig = localStorage.getItem(`app_config_${appSlug}`);
      if (!appConfig) {
        console.log(`📱 Preloading config for ${appSlug}`);
        // In real implementation, would fetch and cache app config
      }
    } catch (error) {
      console.warn('Failed to preload app data:', error);
    }
  }

  private warmAppCache(): void {
    console.log('🔥 Warming app cache for instant switching...');
    
    // Warm product cache
    if (productCache.size() === 0) {
      forceProductRefresh();
    }
    
    // Warm Shopify cache
    if (shopifyCache.size() === 0) {
      forceShopifySync();
    }
  }

  private backgroundPreloadResources(): void {
    console.log('🔄 Background preloading resources...');
    
    // Preload critical scripts and assets
    const criticalResources = [
      // Common product images would go here
    ];
    
    criticalResources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  private batchNetworkRequests(): void {
    // Implement request batching logic
    console.log('📦 Batching network requests for optimal performance');
  }

  // Memory optimization
  optimizeMemoryUsage(): void {
    // Clear unused caches
    if (productCache.size() > 30) {
      productCache.clear();
    }
    
    if (shopifyCache.size() > 10) {
      shopifyCache.clear();
    }

    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }

  // Group order optimization
  optimizeGroupOrderFlow(): void {
    console.log('👥 Optimizing group order flow...');
    
    // Clear any stale group order data
    const groupOrderKeys = [
      'groupOrderToken',
      'groupOrderData',
      'partyondelivery_group_joining',
      'partyondelivery_group_token'
    ];

    groupOrderKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Reset group order state
    window.dispatchEvent(new CustomEvent('reset-group-order-state'));
  }

  // Comprehensive cleanup
  performComprehensiveCleanup(): void {
    console.log('🧹 Performing comprehensive cleanup...');
    
    // Clear all caches
    productCache.clear();
    shopifyCache.clear();
    
    // Clear localStorage items that might be stale
    const staleKeys = [
      'shopify_products_cache',
      'product_cache_timestamp',
      'delivery_cache_old',
      'old_cart_data'
    ];

    staleKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Optimize memory
    this.optimizeMemoryUsage();

    // Reset metrics
    this.resetMetrics();
  }

  private resetMetrics(): void {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.totalRequests = 0;
  }

  // Real-time monitoring
  startMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.loadTime = loadTime;
      console.log(`📊 Page load time: ${loadTime}ms`);
    });

    // Monitor user interactions
    ['click', 'touch', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.startTimer('interaction');
        requestAnimationFrame(() => {
          const interactionTime = this.endTimer('interaction');
          this.metrics.interactionTime = interactionTime;
        });
      });
    });
  }

  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    return `
🚀 Performance Report:
- Load Time: ${metrics.loadTime.toFixed(2)}ms
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Interaction Time: ${metrics.interactionTime.toFixed(2)}ms
- Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%
- Error Rate: ${metrics.errorRate.toFixed(1)}%
- Product Cache Size: ${productCache.size()}
- Shopify Cache Size: ${shopifyCache.size()}
    `;
  }
}

// Global performance manager instance
export const performanceManager = new PerformanceManager();

// Auto-start monitoring
performanceManager.startMonitoring();

// Export utility functions
export const optimizeApp = async () => {
  await performanceManager.optimizeAppSwitching();
  await performanceManager.optimizeProductLoading();
  await performanceManager.optimizeShopifySync();
  performanceManager.optimizeGroupOrderFlow();
  performanceManager.performComprehensiveCleanup();
};

export const getPerformanceReport = () => performanceManager.getPerformanceReport();