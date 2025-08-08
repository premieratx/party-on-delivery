/**
 * Ultra Fast Data Loader with Aggressive Optimization
 */

import { supabase } from '@/integrations/supabase/client';
import { advancedCacheManager } from './advancedCacheManager';

interface LoadOptions {
  useCache?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  fallbackToStale?: boolean;
}

interface ProductData {
  collections: any[];
  products: any[];
  categories: any[];
  meta: {
    totalProducts: number;
    totalCollections: number;
    lastSync: string;
    cacheSource: string;
  };
}

class UltraFastLoader {
  private loadingPromises = new Map<string, Promise<any>>();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private maxConcurrent = 6;
  private activeRequests = 0;

  // Lightning-fast product loading with multiple fallbacks
  async loadProducts(options: LoadOptions = {}): Promise<ProductData> {
    const cacheKey = 'ultra-fast-products';
    const startTime = Date.now();

    try {
      // 1. Try memory cache first (fastest)
      if (options.useCache !== false) {
        const cached = advancedCacheManager.get(cacheKey);
        if (cached) {
          console.log(`⚡ Ultra-fast load from memory: ${Date.now() - startTime}ms`);
          return this.enrichProductData(cached, 'memory-cache');
        }
      }

      // 2. Try instant cache with aggressive timeout
      const instantResult = await this.withTimeout(
        this.loadFromInstantCache(),
        options.timeout || 2000
      );

      if (instantResult?.collections || instantResult?.products) {
        const enriched = this.enrichProductData(instantResult, 'instant-cache');
        advancedCacheManager.set(cacheKey, enriched, 90 * 1000); // 90 seconds
        console.log(`⚡ Ultra-fast load from instant cache: ${Date.now() - startTime}ms`);
        return enriched;
      }

      // 3. Fallback to regular collections endpoint
      console.log('📡 Falling back to regular collections endpoint...');
      const regularResult = await this.loadFromCollections();
      
      if (regularResult?.collections) {
        const enriched = this.enrichProductData(regularResult, 'collections-api');
        advancedCacheManager.set(cacheKey, enriched, 5 * 60 * 1000); // 5 minutes
        console.log(`⚡ Loaded from collections API: ${Date.now() - startTime}ms`);
        return enriched;
      }

      // 4. Last resort - return stale data if available
      if (options.fallbackToStale !== false) {
        const staleData = advancedCacheManager.get('stale-products');
        if (staleData) {
          console.log('⚠️ Using stale data as last resort');
          return this.enrichProductData(staleData, 'stale-cache');
        }
      }

      throw new Error('No product data available from any source');

    } catch (error) {
      console.error('Ultra-fast loader failed:', error);
      
      // Emergency fallback to any cached data
      const emergencyData = advancedCacheManager.get('emergency-products');
      if (emergencyData) {
        return this.enrichProductData(emergencyData, 'emergency-cache');
      }

      throw error;
    }
  }

  // Load from instant cache with optimization
  private async loadFromInstantCache(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('instant-product-cache');
    
    if (error) throw error;
    
    // Handle the nested data structure from instant cache
    const cacheResult = data?.data || data;
    if (!cacheResult?.collections && !cacheResult?.products) {
      throw new Error('No instant cache data');
    }

    // Transform to expected format if needed
    const transformedData = {
      collections: cacheResult.collections || [],
      products: cacheResult.products || [],
      cached_at: cacheResult.cached_at || new Date().toISOString(),
      total_products: cacheResult.total_products || 0,
      total_collections: cacheResult.total_collections || 0
    };

    // Store as emergency backup
    advancedCacheManager.set('emergency-products', transformedData, 24 * 60 * 60 * 1000); // 24 hours
    
    return transformedData;
  }

  // Load from collections endpoint with optimization
  private async loadFromCollections(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('get-all-collections');
    
    if (error) throw error;
    if (!data?.collections) throw new Error('No collections data');

    return data;
  }

  // Enrich product data with metadata and optimizations
  private enrichProductData(data: any, source: string): ProductData {
    // Handle different data structures from different sources
    const collections = data.collections || [];
    const directProducts = data.products || [];
    
    // Extract products from collections or use direct products
    let products: any[] = [];
    if (directProducts.length > 0) {
      // Use direct products if available (from instant cache)
      products = directProducts.map(product => ({
        ...product,
        category: this.inferProductCategory('', product.title || '')
      }));
    } else {
      // Extract from collections (from collections API)
      products = this.extractAllProducts(collections);
    }
    
    const categories = this.extractCategories(collections);

    // Pre-optimize images in background
    this.backgroundOptimizeImages(products);

    return {
      collections,
      products,
      categories,
      meta: {
        totalProducts: products.length,
        totalCollections: collections.length,
        lastSync: new Date().toISOString(),
        cacheSource: source
      }
    };
  }

  // Extract all products from collections with proper category inference
  private extractAllProducts(collections: any[]): any[] {
    const products: any[] = [];
    const seenIds = new Set();

    collections.forEach(collection => {
      collection.products?.forEach((product: any) => {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          
          // Enrich product with collection and category info
          const enrichedProduct = {
            ...product,
            collectionHandle: collection.handle,
            collectionId: collection.id,
            collections: [{ id: collection.id, title: collection.title, handle: collection.handle }],
            category: this.inferCategoryFromCollections([collection.handle]),
            productType: product.product_type || this.inferTypeFromProduct(product)
          };
          
          products.push(enrichedProduct);
        } else {
          // If product already exists, merge collection info
          const existingProduct = products.find(p => p.id === product.id);
          if (existingProduct) {
            const existingCollections = existingProduct.collections || [];
            const newCollection = { id: collection.id, title: collection.title, handle: collection.handle };
            
            if (!existingCollections.find(c => c.id === collection.id)) {
              existingCollections.push(newCollection);
              existingProduct.collections = existingCollections;
              existingProduct.category = this.inferCategoryFromCollections(existingCollections.map(c => c.handle));
            }
          }
        }
      });
    });

    return products;
  }

  // Helper method to infer category from collection handles
  private inferCategoryFromCollections(handles: string[]): string {
    for (const handle of handles) {
      const lowerHandle = handle.toLowerCase();
      if (lowerHandle.includes('beer') || lowerHandle.includes('tailgate')) return 'beer';
      if (lowerHandle.includes('wine') || lowerHandle.includes('champagne')) return 'wine';
      if (lowerHandle.includes('spirit') || lowerHandle.includes('whiskey') || lowerHandle.includes('vodka') || 
          lowerHandle.includes('gin') || lowerHandle.includes('rum') || lowerHandle.includes('tequila')) return 'spirits';
      if (lowerHandle.includes('cocktail') || lowerHandle.includes('mixer') || lowerHandle.includes('ready-to-drink')) return 'cocktails';
      if (lowerHandle.includes('seltzer')) return 'seltzers';
      if (lowerHandle.includes('party') || lowerHandle.includes('supplies') || lowerHandle.includes('decoration')) return 'party-supplies';
    }
    return 'other';
  }

  // Helper method to infer product type
  private inferTypeFromProduct(product: any): string {
    const title = product.title?.toLowerCase() || '';
    const handle = product.handle?.toLowerCase() || '';
    
    if (title.includes('lager') || title.includes('ale') || title.includes('ipa')) return 'beer';
    if (title.includes('red wine') || title.includes('white wine') || title.includes('champagne')) return 'wine';
    if (title.includes('vodka')) return 'vodka';
    if (title.includes('whiskey') || title.includes('bourbon')) return 'whiskey';
    if (title.includes('tequila')) return 'tequila';
    if (title.includes('rum')) return 'rum';
    if (title.includes('gin')) return 'gin';
    
    return product.product_type || 'unknown';
  }

  // Extract category information
  private extractCategories(collections: any[]): any[] {
    if (!Array.isArray(collections)) return [];
    
    const categoryMap = new Map();

    collections.forEach(collection => {
      const category = this.inferProductCategory(collection.handle, collection.title);
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          id: category,
          name: this.formatCategoryName(category),
          handle: category,
          collections: [],
          productCount: 0
        });
      }

      const categoryData = categoryMap.get(category);
      categoryData.collections.push(collection.handle);
      categoryData.productCount += collection.products?.length || 0;
    });

    return Array.from(categoryMap.values());
  }

  // Infer product category with better logic
  private inferProductCategory(handle: string, title: string): string {
    const text = `${handle} ${title}`.toLowerCase();
    
    if (text.includes('spirit') || text.includes('vodka') || text.includes('whiskey') || text.includes('gin') || text.includes('rum')) return 'spirits';
    if (text.includes('beer') || text.includes('lager') || text.includes('ale') || text.includes('brew')) return 'beer';
    if (text.includes('wine') || text.includes('champagne') || text.includes('prosecco')) return 'wine';
    if (text.includes('cocktail') || text.includes('mix') || text.includes('margarita')) return 'cocktails';
    if (text.includes('seltzer') || text.includes('cider') || text.includes('kombucha')) return 'seltzers';
    if (text.includes('party') || text.includes('supplies') || text.includes('decoration')) return 'party-supplies';
    if (text.includes('snack') || text.includes('food') || text.includes('chip')) return 'snacks';
    
    return 'other';
  }

  // Format category name for display
  private formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      spirits: 'Premium Spirits',
      beer: 'Craft Beer',
      wine: 'Fine Wine',
      cocktails: 'Cocktails & Mixers',
      seltzers: 'Seltzers & Ciders',
      'party-supplies': 'Party Supplies',
      snacks: 'Snacks & Food',
      other: 'Other'
    };
    
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Background image optimization
  private backgroundOptimizeImages(products: any[]): void {
    setTimeout(() => {
      const imageUrls = products
        .filter(p => p.image)
        .slice(0, 50) // First 50 products
        .map(p => this.optimizeImageUrl(p.image));

      // Preload critical images
      imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
        // Store in image cache
        advancedCacheManager.set(`image-${url}`, true, 60 * 60 * 1000);
      });
    }, 0);
  }

  // Optimize image URLs for better performance
  private optimizeImageUrl(url: string): string {
    if (!url) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=400&height=400&format=webp&quality=80&crop=center`;
  }

  // Load specific collection super fast
  async loadCollection(handle: string, options: LoadOptions = {}): Promise<any> {
    const cacheKey = `collection-${handle}`;
    
    // Try cache first
    if (options.useCache !== false) {
      const cached = advancedCacheManager.get(cacheKey);
      if (cached) return cached;
    }

    // Load all collections and filter
    const allData = await this.loadProducts(options);
    const collection = allData.collections.find(c => c.handle === handle);
    
    if (collection) {
      advancedCacheManager.set(cacheKey, collection, 10 * 60 * 1000);
      return collection;
    }

    throw new Error(`Collection ${handle} not found`);
  }

  // Load products by category super fast
  async loadProductsByCategory(category: string, options: LoadOptions = {}): Promise<any[]> {
    const cacheKey = `category-products-${category}`;
    
    // Try cache first
    if (options.useCache !== false) {
      const cached = advancedCacheManager.get(cacheKey) as any[];
      if (cached && Array.isArray(cached)) return cached;
    }

    // Load all products and filter
    const allData = await this.loadProducts(options);
    const categoryProducts = allData.products.filter(p => p.category === category);
    
    advancedCacheManager.set(cacheKey, categoryProducts, 5 * 60 * 1000);
    return categoryProducts;
  }

  // Preload everything for maximum speed
  async preloadEverything(): Promise<void> {
    console.log('🚀 Starting aggressive preloading...');
    
    try {
      // Preload main data with better timeout
      const loadPromise = this.loadProducts({ priority: 'critical', timeout: 15000 }).catch(err => {
        console.warn('Main preload failed:', err.message);
        return null;
      });
      
      // Preload categories with staggered timing to avoid rate limits
      const categories = ['beer', 'wine', 'spirits'];
      const categoryPromises = categories.map((cat, index) => 
        new Promise(resolve => {
          setTimeout(() => {
            this.loadProductsByCategory(cat, { priority: 'high', timeout: 15000 })
              .catch(err => {
                console.warn(`Category ${cat} preload failed:`, err.message);
                return null;
              })
              .then(resolve);
          }, index * 1000);
        })
      );

      await Promise.allSettled([loadPromise, ...categoryPromises]);
      
      console.log('✅ Aggressive preloading completed');
    } catch (error) {
      console.warn('Preloading failed:', error);
    }
  }

  // Utility: Promise with timeout (soft by default: returns null on timeout)
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timeoutId: any;
    let timedOut = false;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, timeoutMs);
    });

    try {
      const result = await Promise.race<[T | null]>([promise as any, timeoutPromise as any]) as unknown as T | null;
      return result ?? null;
    } finally {
      clearTimeout(timeoutId);
      if (timedOut) {
        // Soft timeout notice without throwing to avoid noisy errors during preload
        console.warn(`Operation exceeded ${timeoutMs}ms; continuing with fallback if available`);
      }
    }
  }

  // Get loader statistics
  getStats() {
    return {
      cacheStats: advancedCacheManager.getStats(),
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      loadingPromises: this.loadingPromises.size
    };
  }
}

export const ultraFastLoader = new UltraFastLoader();
export { UltraFastLoader };