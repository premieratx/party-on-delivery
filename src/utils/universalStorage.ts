/**
 * Universal Storage Utility
 * Works across ALL browsers, devices, and conditions including:
 * - Regular browsing mode
 * - Incognito/private mode  
 * - Disabled cookies/storage
 * - Storage quota exceeded
 * - Cross-platform compatibility
 */

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

class UniversalStorage {
  private memoryCache = new Map<string, any>();
  private isLocalStorageAvailable = false;
  private isSessionStorageAvailable = false;

  constructor() {
    this.checkStorageAvailability();
  }

  private checkStorageAvailability() {
    // Test localStorage
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch (e) {
      this.isLocalStorageAvailable = false;
    }

    // Test sessionStorage
    try {
      const testKey = '__test_session__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.isSessionStorageAvailable = true;
    } catch (e) {
      this.isSessionStorageAvailable = false;
    }

    console.log('🔍 Storage availability:', {
      localStorage: this.isLocalStorageAvailable,
      sessionStorage: this.isSessionStorageAvailable
    });
  }

  setItem<T>(key: string, value: T, expirationMinutes?: number): boolean {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : undefined
    };

    const serialized = JSON.stringify(item);
    let saved = false;

    // Strategy 1: Try localStorage first (persistent)
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, serialized);
        saved = true;
        console.log(`✅ Saved to localStorage: ${key}`);
      } catch (e) {
        console.warn(`⚠️ localStorage failed for ${key}:`, e);
        this.isLocalStorageAvailable = false; // Update availability
      }
    }

    // Strategy 2: Fallback to sessionStorage
    if (!saved && this.isSessionStorageAvailable) {
      try {
        sessionStorage.setItem(key, serialized);
        saved = true;
        console.log(`✅ Saved to sessionStorage: ${key}`);
      } catch (e) {
        console.warn(`⚠️ sessionStorage failed for ${key}:`, e);
        this.isSessionStorageAvailable = false; // Update availability
      }
    }

    // Strategy 3: Always save to memory cache as final fallback
    this.memoryCache.set(key, item);
    if (!saved) {
      console.log(`✅ Saved to memory cache only: ${key}`);
    }

    return true; // Always return true since we guarantee storage in memory
  }

  getItem<T>(key: string): T | null {
    let item: StorageItem<T> | null = null;

    // Strategy 1: Try localStorage first
    if (this.isLocalStorageAvailable) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          item = JSON.parse(stored);
          console.log(`📖 Loaded from localStorage: ${key}`);
        }
      } catch (e) {
        console.warn(`⚠️ localStorage read failed for ${key}:`, e);
        this.isLocalStorageAvailable = false;
      }
    }

    // Strategy 2: Fallback to sessionStorage
    if (!item && this.isSessionStorageAvailable) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          item = JSON.parse(stored);
          console.log(`📖 Loaded from sessionStorage: ${key}`);
        }
      } catch (e) {
        console.warn(`⚠️ sessionStorage read failed for ${key}:`, e);
        this.isSessionStorageAvailable = false;
      }
    }

    // Strategy 3: Fallback to memory cache
    if (!item) {
      item = this.memoryCache.get(key) || null;
      if (item) {
        console.log(`📖 Loaded from memory cache: ${key}`);
      }
    }

    // Check expiration
    if (item) {
      if (item.expiresAt && Date.now() > item.expiresAt) {
        console.log(`⏰ Item expired: ${key}`);
        this.removeItem(key);
        return null;
      }
      return item.value;
    }

    return null;
  }

  removeItem(key: string): void {
    // Remove from all possible storage locations
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`⚠️ localStorage removal failed for ${key}:`, e);
      }
    }

    if (this.isSessionStorageAvailable) {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`⚠️ sessionStorage removal failed for ${key}:`, e);
      }
    }

    this.memoryCache.delete(key);
    console.log(`🗑️ Removed from all storage: ${key}`);
  }

  clear(): void {
    // Clear all checkout-related data
    const keysToRemove = [
      'partyondelivery_customer',
      'partyondelivery_address', 
      'partyondelivery_checkout_state',
      'persistent-checkout-info',
      'partyondelivery_customer_persistent',
      'partyondelivery_address_persistent'
    ];

    keysToRemove.forEach(key => this.removeItem(key));
    console.log('🗑️ Cleared all checkout data from universal storage');
  }

  // Get storage status for debugging
  getStorageStatus() {
    return {
      localStorage: this.isLocalStorageAvailable,
      sessionStorage: this.isSessionStorageAvailable,
      memoryCache: this.memoryCache.size,
      capabilities: {
        persistent: this.isLocalStorageAvailable,
        session: this.isSessionStorageAvailable,
        memory: true
      }
    };
  }
}

// Export singleton instance
export const universalStorage = new UniversalStorage();

// Helper functions for common checkout operations
export const checkoutStorage = {
  saveCustomerInfo: (info: any) => {
    return universalStorage.setItem('partyondelivery_customer', info, 60); // 1 hour
  },
  
  loadCustomerInfo: () => {
    return universalStorage.getItem('partyondelivery_customer');
  },
  
  saveAddressInfo: (info: any) => {
    return universalStorage.setItem('partyondelivery_address', info, 60); // 1 hour
  },
  
  loadAddressInfo: () => {
    return universalStorage.getItem('partyondelivery_address');
  },
  
  saveCheckoutState: (state: any) => {
    return universalStorage.setItem('partyondelivery_checkout_state', state, 1440); // 24 hours
  },
  
  loadCheckoutState: () => {
    return universalStorage.getItem('partyondelivery_checkout_state');
  },
  
  savePersistentData: (data: any) => {
    return universalStorage.setItem('persistent-checkout-info', data, 43200); // 30 days
  },
  
  loadPersistentData: () => {
    return universalStorage.getItem('persistent-checkout-info');
  },
  
  clearAll: () => {
    universalStorage.clear();
  },
  
  getStatus: () => {
    return universalStorage.getStorageStatus();
  }
};