/**
 * Centralized cache cleanup utility to prevent cache key collisions and manage storage
 */

interface CacheConfig {
  key: string;
  maxAge: number; // in minutes
  maxSize?: number; // max number of items
}

class CacheCleanupManager {
  private static instance: CacheCleanupManager;
  
  // Standardized cache configurations
  private cacheConfigs: CacheConfig[] = [
    { key: 'shopify-collections', maxAge: 60 * 24 }, // 24 hours
    { key: 'delivery-pricing', maxAge: 30 }, // 30 minutes
    { key: 'product-cache', maxAge: 60 }, // 1 hour
    { key: 'customer-info', maxAge: 60 * 24 * 7 }, // 1 week
    { key: 'cart-items', maxAge: 60 * 24 }, // 24 hours
  ];

  public static getInstance(): CacheCleanupManager {
    if (!CacheCleanupManager.instance) {
      CacheCleanupManager.instance = new CacheCleanupManager();
    }
    return CacheCleanupManager.instance;
  }

  /**
   * Clean up expired cache items and resolve key collisions
   */
  public performCleanup(): void {
    console.log('🧹 Starting cache cleanup...');
    
    this.removeExpiredItems();
    this.removeDuplicateKeys();
    this.removeCorruptedData();
    this.optimizeStorage();
    
    console.log('✅ Cache cleanup completed');
  }

  /**
   * Remove expired cache items
   */
  private removeExpiredItems(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        const parsedItem = JSON.parse(item);
        
        // Check if item has expiration
        if (parsedItem.expiresAt && Date.now() > parsedItem.expiresAt) {
          keysToRemove.push(key);
        }
        
        // Check timestamp-based expiration for legacy items
        if (parsedItem.timestamp) {
          const config = this.cacheConfigs.find(c => key.includes(c.key));
          if (config) {
            const age = Date.now() - parsedItem.timestamp;
            const maxAge = config.maxAge * 60 * 1000;
            if (age > maxAge) {
              keysToRemove.push(key);
            }
          }
        }
      } catch {
        // Corrupted data - mark for removal
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Removed ${keysToRemove.length} expired items`);
  }

  /**
   * Remove duplicate cache keys that might cause conflicts
   */
  private removeDuplicateKeys(): void {
    const keyGroups = new Map<string, string[]>();
    
    // Group similar keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const baseKey = key.split('_')[0]; // Get base key before underscore
      if (!keyGroups.has(baseKey)) {
        keyGroups.set(baseKey, []);
      }
      keyGroups.get(baseKey)!.push(key);
    }
    
    // Keep only the most recent version of duplicate keys
    keyGroups.forEach((keys, baseKey) => {
      if (keys.length > 1) {
        const sortedKeys = keys.sort((a, b) => {
          try {
            const aData = JSON.parse(localStorage.getItem(a) || '{}');
            const bData = JSON.parse(localStorage.getItem(b) || '{}');
            return (bData.timestamp || 0) - (aData.timestamp || 0);
          } catch {
            return 0;
          }
        });
        
        // Remove all but the first (most recent)
        sortedKeys.slice(1).forEach(key => localStorage.removeItem(key));
      }
    });
  }

  /**
   * Remove corrupted data that can't be parsed
   */
  private removeCorruptedData(): void {
    const corruptedKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = localStorage.getItem(key);
        if (item) {
          JSON.parse(item); // Test if it's valid JSON
        }
      } catch {
        corruptedKeys.push(key);
      }
    }
    
    corruptedKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Removed ${corruptedKeys.length} corrupted items`);
  }

  /**
   * Optimize storage usage
   */
  private optimizeStorage(): void {
    // Check storage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    }
    
    // If storage is getting full (> 4MB), remove oldest items
    const maxSize = 4 * 1024 * 1024; // 4MB limit for localStorage
    if (totalSize > maxSize * 0.8) { // Clean up when 80% full
      console.log('Storage optimization needed - removing oldest items');
      this.removeOldestItems(Math.floor(localStorage.length * 0.2)); // Remove 20% of items
    }
  }

  /**
   * Remove the oldest cache items
   */
  private removeOldestItems(count: number): void {
    const items: { key: string; timestamp: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          items.push({
            key,
            timestamp: parsedItem.timestamp || 0
          });
        }
      } catch {
        // If we can't parse it, consider it very old
        items.push({ key, timestamp: 0 });
      }
    }
    
    // Sort by timestamp and remove oldest
    items.sort((a, b) => a.timestamp - b.timestamp);
    items.slice(0, count).forEach(item => localStorage.removeItem(item.key));
  }

  /**
   * Get storage statistics
   */
  public getStorageStats(): { totalItems: number; totalSize: number; configs: number } {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    }
    
    return {
      totalItems: localStorage.length,
      totalSize,
      configs: this.cacheConfigs.length
    };
  }
}

export const cacheCleanup = CacheCleanupManager.getInstance();

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => cacheCleanup.performCleanup(), 1000);
  });
}
