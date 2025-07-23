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
   * Preload Shopify collections in background with enhanced reliability
   */
  private async preloadShopifyCollections(): Promise<void> {
    try {
      // Check if we have recent cached data (valid for 24 hours)
      const cached = cacheManager.getShopifyCollections();
      const isValid = cacheManager.isValid(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS, 24 * 60); // 24 hours
      
      if (cached && cached.length > 0 && isValid) {
        console.log('Shopify collections already cached and valid');
        return;
      }

      console.log('Preloading Shopify collections...');
      
      const result = await ErrorHandler.withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('get-all-collections');
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (!data?.collections || !Array.isArray(data.collections)) {
          throw new Error('Invalid response format from Shopify API');
        }
        
        if (data.collections.length === 0) {
          throw new Error('No collections returned from Shopify');
        }
        
        return data;
      }, {
        maxAttempts: 3,
        delayMs: 2000,
        backoffMultiplier: 1.5
      });

      if (result?.collections && result.collections.length > 0) {
        cacheManager.setShopifyCollections(result.collections);
        console.log(`Shopify collections preloaded successfully: ${result.collections.length} collections`);
      } else {
        console.warn('No collections received from preload attempt');
      }
    } catch (error) {
      console.warn('Failed to preload Shopify collections:', error);
      
      // Try to use existing cache as fallback even if expired
      const fallbackCache = cacheManager.getShopifyCollections();
      if (fallbackCache && fallbackCache.length > 0) {
        console.log('Using expired cache as fallback for Shopify collections');
      }
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
   * Background refresh of data that might be stale (optimized for 30-day cache)
   */
  public async backgroundRefresh(): Promise<void> {
    // Check if cached data needs refresh (refresh after 6 hours, but cache lasts 30 days)
    const cached = cacheManager.getShopifyCollections();
    const needsRefresh = !cacheManager.isValid(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS, 6 * 60); // 6 hours
    
    if (cached && needsRefresh) {
      console.log('Background refreshing Shopify collections (6+ hours old)...');
      try {
        await this.preloadShopifyCollections();
      } catch (error) {
        console.warn('Background refresh failed, keeping existing cache:', error);
      }
    } else if (!cached) {
      console.log('No cached data found, attempting background fetch...');
      try {
        await this.preloadShopifyCollections();
      } catch (error) {
        console.warn('Background fetch failed:', error);
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

    // Set up intelligent background refresh (every 2 hours, but only refresh if data is 6+ hours old)
    const refreshInterval = setInterval(() => {
      if (!document.hidden && !this.isPreloading) { // Only refresh when page is visible and not already preloading
        this.backgroundRefresh();
      }
    }, 2 * 60 * 60 * 1000); // Check every 2 hours

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