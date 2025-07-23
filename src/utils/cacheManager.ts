/**
 * Centralized cache management for reliable data persistence and retrieval
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cacheKeys = {
    SHOPIFY_COLLECTIONS: 'shopify-collections',
    DELIVERY_PRICING: 'delivery-pricing',
    CUSTOMER_INFO: 'partyondelivery_customer',
    ADDRESS_INFO: 'partyondelivery_address',
    LAST_ORDER: 'partyondelivery_last_order',
    CART_ITEMS: 'partyondelivery_cart',
    DELIVERY_INFO: 'partyondelivery_delivery_info'
  };

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      // Test write/read to ensure it's working
      const testKey = '__cache_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public set<T>(key: string, data: T, ttlMinutes?: number): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: ttlMinutes ? Date.now() + (ttlMinutes * 60 * 1000) : undefined
      };

      localStorage.setItem(key, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, cleaning up expired items...');
        this.clearExpiredItems();
        try {
          const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: ttlMinutes ? Date.now() + (ttlMinutes * 60 * 1000) : undefined
          };
          localStorage.setItem(key, JSON.stringify(cacheItem));
          return true;
        } catch {
          console.warn('Failed to cache data after cleanup - storage still full');
          return false;
        }
      }
      console.debug(`Cache storage failed for key: ${key}`, error.message);
      return false;
    }
  }

  public get<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      
      // Check if expired
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch {
      return null;
    }
  }

  public remove(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`Failed to remove cache key: ${key}`);
    }
  }

  public isValid(key: string, maxAgeMinutes: number): boolean {
    if (!this.isLocalStorageAvailable()) return false;

    try {
      const item = localStorage.getItem(key);
      if (!item) return false;

      const cacheItem: CacheItem<any> = JSON.parse(item);
      const age = Date.now() - cacheItem.timestamp;
      const maxAge = maxAgeMinutes * 60 * 1000;

      return age < maxAge;
    } catch {
      return false;
    }
  }

  public clearExpiredItems(): void {
    if (!this.isLocalStorageAvailable()) return;

    const keysToRemove: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const item = localStorage.getItem(key);
          if (item) {
            const cacheItem: CacheItem<any> = JSON.parse(item);
            if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // If we can't parse it, it might be corrupted, remove it
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} expired cache items`);
    } catch (error) {
      console.warn('Error during cache cleanup:', error);
    }
  }

  public getCacheKeys() {
    return this.cacheKeys;
  }

  // Specific helper methods for common operations
  public setShopifyCollections(collections: any[]): boolean {
    return this.set(this.cacheKeys.SHOPIFY_COLLECTIONS, collections, 60); // 1 hour TTL
  }

  public getShopifyCollections(): any[] | null {
    return this.get(this.cacheKeys.SHOPIFY_COLLECTIONS);
  }

  public setDeliveryPricing(address: string, pricing: any): boolean {
    const key = `${this.cacheKeys.DELIVERY_PRICING}_${btoa(address)}`;
    return this.set(key, pricing, 30); // 30 minutes TTL
  }

  public getDeliveryPricing(address: string): any | null {
    const key = `${this.cacheKeys.DELIVERY_PRICING}_${btoa(address)}`;
    return this.get(key);
  }
}

export const cacheManager = CacheManager.getInstance();