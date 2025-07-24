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
   * Preload Shopify collections in background with enhanced reliability and fallback
   */
  private async preloadShopifyCollections(): Promise<void> {
    try {
      // Check if we have recent cached data (extended to 48 hours since collections rarely change)
      const cached = cacheManager.getShopifyCollections();
      const isValid = cacheManager.isValid(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS, 48 * 60); // 48 hours
      
      if (cached && cached.length > 0 && isValid) {
        console.log(`Shopify collections cached and valid (${cached.length} collections)`);
        return;
      }

      // If we have any cache (even expired), use it while fetching fresh data
      const hasAnyCache = cacheManager.exists(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS);
      if (hasAnyCache) {
        console.log('Using existing cache while refreshing in background...');
      }

      console.log('Fetching fresh Shopify collections...');
      
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
        maxAttempts: 2, // Reduced attempts for faster fallback
        delayMs: 1500,
        backoffMultiplier: 1.5
      });

      if (result?.collections && result.collections.length > 0) {
        cacheManager.setShopifyCollections(result.collections);
        console.log(`✅ Fresh collections cached: ${result.collections.length} collections`);
      } else {
        console.warn('No collections received from fresh fetch');
      }
    } catch (error) {
      console.warn('Fresh fetch failed, using fallback strategy:', error);
      
      // Enhanced fallback: Use any available cache (even expired)
      const fallbackCache = cacheManager.getFallback(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS);
      if (fallbackCache && Array.isArray(fallbackCache) && fallbackCache.length > 0) {
        console.log(`🔄 Using fallback cache: ${fallbackCache.length} collections (may be stale)`);
        // Re-cache the fallback data with current timestamp for temporary use
        cacheManager.setShopifyCollections(fallbackCache);
      } else {
        console.error('❌ No fallback cache available - app may not function properly');
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
   * Intelligent background refresh (optimized for rare collection changes)
   */
  public async backgroundRefresh(): Promise<void> {
    // Since collections rarely change, be more conservative with refresh timing
    const cached = cacheManager.getShopifyCollections();
    const needsRefresh = !cacheManager.isValid(cacheManager.getCacheKeys().SHOPIFY_COLLECTIONS, 24 * 60); // 24 hours
    
    // Only refresh if data is old AND we're not currently preloading
    if (cached && needsRefresh && !this.isPreloading) {
      console.log('🔄 Background refresh: Collections are 24+ hours old');
      try {
        await this.preloadShopifyCollections();
      } catch (error) {
        console.warn('Background refresh failed, keeping existing cache:', error);
      }
    } else if (!cached && !this.isPreloading) {
      console.log('🔄 Background fetch: No cached data found');
      try {
        await this.preloadShopifyCollections();
      } catch (error) {
        console.warn('Background fetch failed:', error);
      }
    } else if (cached && !needsRefresh) {
      console.log('✅ Collections cache is fresh, no refresh needed');
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