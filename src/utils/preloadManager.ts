import { cacheManager } from './cacheManager';
import { ErrorHandler } from './errorHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * Manages preloading and background refresh of critical app data
 */
export class PreloadManager {
  private static instance: PreloadManager;
  private isPreloading = false;

  public static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager();
    }
    return PreloadManager.instance;
  }

  /**
   * Preload critical data when app starts
   */
  public async preloadCriticalData(): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('Starting critical data preload...');

    try {
      await Promise.allSettled([
        this.preloadShopifyCollections(),
        this.cleanupExpiredCache()
      ]);
    } catch (error) {
      ErrorHandler.logError(error, 'preloadCriticalData');
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload Shopify collections in background
   */
  private async preloadShopifyCollections(): Promise<void> {
    try {
      // Check if we have recent cached data
      const cached = cacheManager.getShopifyCollections();
      if (cached && cached.length > 0) {
        console.log('Shopify collections already cached');
        return;
      }

      console.log('Preloading Shopify collections...');
      
      const result = await ErrorHandler.withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('get-all-collections');
        if (error) throw error;
        return data;
      }, {
        maxAttempts: 2,
        delayMs: 2000,
        backoffMultiplier: 1.5
      });

      if (result?.collections && result.collections.length > 0) {
        cacheManager.setShopifyCollections(result.collections);
        console.log('Shopify collections preloaded successfully');
      }
    } catch (error) {
      console.warn('Failed to preload Shopify collections:', error);
      // Don't throw - this is background preloading
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      cacheManager.clearExpiredItems();
      console.log('Cache cleanup completed');
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Background refresh of data that might be stale
   */
  public async backgroundRefresh(): Promise<void> {
    // Only refresh if we have cached data that's getting old (45+ minutes)
    const cached = cacheManager.getShopifyCollections();
    if (cached && !cacheManager.isValid(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS, 45)) {
      console.log('Background refreshing Shopify collections...');
      try {
        await this.preloadShopifyCollections();
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }
  }

  /**
   * Initialize preloading when app starts
   */
  public initialize(): void {
    // Start preloading with idle callback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preloadCriticalData());
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.preloadCriticalData(), 100);
    }

    // Set up optimized background refresh (every 30 minutes)
    const refreshInterval = setInterval(() => {
      if (!document.hidden) { // Only refresh when page is visible
        this.backgroundRefresh();
      }
    }, 30 * 60 * 1000);

    // Cleanup interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(refreshInterval);
    });

    // Smart preload when user becomes active after being idle
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isPreloading) {
        // Use requestIdleCallback for non-critical refresh
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => this.backgroundRefresh());
        } else {
          setTimeout(() => this.backgroundRefresh(), 200);
        }
      }
    });
  }
}

export const preloadManager = PreloadManager.getInstance();