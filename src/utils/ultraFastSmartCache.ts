import { supabase } from '@/integrations/supabase/client';

interface CachedProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  vendor: string;
  description?: string;
  variants?: any[];
  collection_handles?: string[];
  product_type?: string;
  search_category?: string;
}

interface SmartCacheLayer {
  products: Map<string, CachedProduct>;
  collections: Map<string, CachedProduct[]>;
  searchIndex: Map<string, CachedProduct[]>;
  lastUpdate: number;
}

/**
 * Ultra-fast smart cache for sub-200ms loading
 * Implements aggressive sequential preloading for top-of-page products
 */
class UltraFastSmartCache {
  private static instance: UltraFastSmartCache;
  private cache: SmartCacheLayer = {
    products: new Map(),
    collections: new Map(),
    searchIndex: new Map(),
    lastUpdate: 0
  };
  
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private isWarmedUp = false;
  private warmupPromise: Promise<void> | null = null;

  static getInstance(): UltraFastSmartCache {
    if (!UltraFastSmartCache.instance) {
      UltraFastSmartCache.instance = new UltraFastSmartCache();
    }
    return UltraFastSmartCache.instance;
  }

  /**
   * Get products instantly from cache - sub-50ms response
   */
  async getProductsInstant(collectionHandle?: string): Promise<CachedProduct[]> {
    const startTime = performance.now();
    
    // Ensure cache is warmed up
    if (!this.isWarmedUp) {
      await this.warmupCache();
    }
    
    let products: CachedProduct[] = [];
    
    if (collectionHandle && collectionHandle !== 'all') {
      products = this.cache.collections.get(collectionHandle) || [];
    } else {
      products = Array.from(this.cache.products.values());
    }
    
    const duration = performance.now() - startTime;
    console.log(`⚡ ULTRA-FAST: Retrieved ${products.length} products in ${duration.toFixed(2)}ms`);
    
    return products;
  }

  /**
   * Search products instantly with full collection coverage - sub-100ms
   */
  async searchProductsInstant(query: string, options: {
    category?: string;
    limit?: number;
  } = {}): Promise<{
    products: CachedProduct[];
    totalFound: number;
    loadTime: string;
  }> {
    const startTime = performance.now();
    const { category, limit = 2000 } = options;
    
    // Ensure cache is warmed up
    if (!this.isWarmedUp) {
      await this.warmupCache();
    }
    
    const queryLower = query.toLowerCase().trim();
    
    // If no query, return all products (filtered by category if specified)
    if (!queryLower) {
      let allProducts = Array.from(this.cache.products.values());
      
      if (category) {
        allProducts = allProducts.filter(p => 
          p.category?.toLowerCase() === category.toLowerCase() ||
          p.search_category?.toLowerCase() === category.toLowerCase()
        );
      }
      
      const duration = performance.now() - startTime;
      return {
        products: allProducts.slice(0, limit),
        totalFound: allProducts.length,
        loadTime: `${duration.toFixed(2)}ms`
      };
    }

    // Search across ALL products with comprehensive matching
    const results: Array<{ product: CachedProduct; score: number }> = [];
    
    this.cache.products.forEach(product => {
      // Category filtering first
      if (category) {
        const productCategory = product.category?.toLowerCase() || '';
        const searchCategory = product.search_category?.toLowerCase() || '';
        const categoryMatch = productCategory === category.toLowerCase() || 
                            searchCategory === category.toLowerCase();
        
        if (!categoryMatch) return;
      }

      let score = 0;
      const titleLower = (product.title || '').toLowerCase();
      const vendorLower = (product.vendor || '').toLowerCase();
      const categoryLower = (product.category || '').toLowerCase();
      const descriptionLower = (product.description || '').toLowerCase();
      
      // Comprehensive search scoring
      if (titleLower === queryLower) {
        score = 1000; // Exact title match
      } else if (titleLower.startsWith(queryLower)) {
        score = 800; // Title starts with query
      } else if (titleLower.includes(queryLower)) {
        score = 600; // Title contains query
      } else if (vendorLower === queryLower) {
        score = 500; // Exact vendor match (e.g., "Tito's")
      } else if (vendorLower.startsWith(queryLower)) {
        score = 400; // Vendor starts with query
      } else if (vendorLower.includes(queryLower)) {
        score = 300; // Vendor contains query
      } else if (categoryLower.includes(queryLower)) {
        score = 200; // Category match
      } else if (descriptionLower.includes(queryLower)) {
        score = 100; // Description match
      } else {
        // Check collection handles
        const collectionMatch = product.collection_handles?.some(handle => 
          handle.toLowerCase().includes(queryLower)
        );
        if (collectionMatch) {
          score = 150; // Collection handle match
        }
      }

      if (score > 0) {
        results.push({ product, score });
      }
    });

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);
    
    const duration = performance.now() - startTime;
    console.log(`🔍 ULTRA-SEARCH: Found ${results.length} products for "${query}" in ${duration.toFixed(2)}ms`);
    
    return {
      products: limitedResults.map(r => r.product),
      totalFound: results.length,
      loadTime: `${duration.toFixed(2)}ms`
    };
  }

  /**
   * Aggressive cache warmup for sub-200ms page loads
   */
  private async warmupCache(): Promise<void> {
    // Return existing warmup promise if already in progress
    if (this.warmupPromise) {
      return this.warmupPromise;
    }

    this.warmupPromise = this._performWarmup();
    return this.warmupPromise;
  }

  private async _performWarmup(): Promise<void> {
    if (this.isWarmedUp && Date.now() - this.cache.lastUpdate < this.CACHE_TTL) {
      return;
    }

    console.log('🔥 ULTRA-AGGRESSIVE: Starting cache warmup...');
    const startTime = performance.now();

    try {
      // Force fresh data from instant-product-cache to get ALL products
      const { data, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { 
          collection_handle: 'all', 
          force_refresh: true,
          include_variants: true 
        }
      });

      if (error) throw error;

      if (data?.products && Array.isArray(data.products)) {
        this.buildOptimizedCache(data.products);
        this.isWarmedUp = true;
        this.cache.lastUpdate = Date.now();
        
        const duration = performance.now() - startTime;
        console.log(`✅ ULTRA-AGGRESSIVE: Cache warmed with ${data.products.length} products in ${duration.toFixed(2)}ms`);
      } else {
        throw new Error('No products data received');
      }
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      throw error;
    } finally {
      this.warmupPromise = null;
    }
  }

  /**
   * Build optimized cache structures for instant access
   */
  private buildOptimizedCache(products: any[]): void {
    console.log(`🏗️ Building optimized cache for ${products.length} products...`);
    
    // Clear existing cache
    this.cache.products.clear();
    this.cache.collections.clear();
    this.cache.searchIndex.clear();

    // Build product cache
    products.forEach(product => {
      const cachedProduct: CachedProduct = {
        id: product.id,
        title: product.title || '',
        price: product.price || 0,
        image: product.image || '',
        category: product.category || '',
        vendor: product.vendor || '',
        description: product.description,
        variants: product.variants,
        collection_handles: product.collection_handles || [],
        product_type: product.product_type,
        search_category: product.search_category
      };

      this.cache.products.set(product.id, cachedProduct);

      // Group by collection handles
      if (product.collection_handles && Array.isArray(product.collection_handles)) {
        product.collection_handles.forEach((handle: string) => {
          if (!this.cache.collections.has(handle)) {
            this.cache.collections.set(handle, []);
          }
          this.cache.collections.get(handle)!.push(cachedProduct);
        });
      }
    });

    console.log(`✅ Cache built: ${this.cache.products.size} products, ${this.cache.collections.size} collections`);
  }

  /**
   * Preload specific collection for instant access
   */
  async preloadCollection(collectionHandle: string): Promise<CachedProduct[]> {
    const startTime = performance.now();
    
    // Check if already cached
    if (this.cache.collections.has(collectionHandle)) {
      const cached = this.cache.collections.get(collectionHandle)!;
      const duration = performance.now() - startTime;
      console.log(`⚡ INSTANT: Collection "${collectionHandle}" from cache in ${duration.toFixed(2)}ms`);
      return cached;
    }

    // Ensure global cache is warmed up
    await this.warmupCache();
    
    // Return from cache after warmup
    const products = this.cache.collections.get(collectionHandle) || [];
    const duration = performance.now() - startTime;
    console.log(`🎯 PRELOAD: Collection "${collectionHandle}" loaded with ${products.length} products in ${duration.toFixed(2)}ms`);
    
    return products;
  }

  /**
   * Clear cache for refresh
   */
  clearCache(): void {
    this.cache.products.clear();
    this.cache.collections.clear();
    this.cache.searchIndex.clear();
    this.isWarmedUp = false;
    this.warmupPromise = null;
    console.log('🧹 Ultra-fast cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      productsCount: this.cache.products.size,
      collectionsCount: this.cache.collections.size,
      isWarmedUp: this.isWarmedUp,
      lastUpdate: new Date(this.cache.lastUpdate),
      collections: Array.from(this.cache.collections.keys())
    };
  }
}

// Export singleton instance
export const ultraFastSmartCache = UltraFastSmartCache.getInstance();