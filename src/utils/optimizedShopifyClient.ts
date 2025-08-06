// src/utils/optimizedShopifyClient.ts
import { supabase } from '@/integrations/supabase/client';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expires: number;
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  image: string;
  images?: string[];
  vendor: string;
  category: string;
  productType: string;
  tags: string[];
  collections: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ShopifyProduct[];
}

class OptimizedShopifyClient {
  private cache = new Map<string, CachedData<any>>();
  private readonly CACHE_DURATIONS = {
    products: 10 * 60 * 1000, // 10 minutes
    collections: 15 * 60 * 1000, // 15 minutes
    categories: 30 * 60 * 1000, // 30 minutes
  };

  private isValidCache<T>(cached: CachedData<T> | undefined): cached is CachedData<T> {
    return !!cached && Date.now() < cached.expires;
  }

  private setCache<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration,
    });
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key) as CachedData<T> | undefined;
    if (this.isValidCache(cached)) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Optimized product fetching with intelligent caching
  async getProducts(forceRefresh = false): Promise<ShopifyProduct[]> {
    const cacheKey = 'shopify_products';
    
    if (!forceRefresh) {
      const cachedProducts = this.getCache<ShopifyProduct[]>(cacheKey);
      if (cachedProducts) {
        console.log('✅ Returning cached products');
        return cachedProducts;
      }
    }

    try {
      console.log('🔄 Fetching fresh products from Shopify...');
      
      const { data, error } = await supabase.functions.invoke('fetch-shopify-products-optimized', {
        body: { 
          lightweight: true, // Only fetch essential fields
          includeImages: false, // Skip extra images for performance
          limit: 100 // Reasonable limit for initial load
        }
      });

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      const products = data?.products || [];
      this.setCache(cacheKey, products, this.CACHE_DURATIONS.products);
      
      console.log(`✅ Cached ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Exception fetching products:', error);
      return [];
    }
  }

  // Optimized collection fetching with product lazy loading
  async getCollections(includeProducts = false): Promise<ShopifyCollection[]> {
    const cacheKey = `shopify_collections_${includeProducts ? 'with_products' : 'lightweight'}`;
    
    const cachedCollections = this.getCache<ShopifyCollection[]>(cacheKey);
    if (cachedCollections) {
      console.log('✅ Returning cached collections');
      return cachedCollections;
    }

    try {
      console.log('🔄 Fetching collections...');
      
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { 
          includeProducts,
          lightweight: !includeProducts
        }
      });

      if (error) {
        console.error('Error fetching collections:', error);
        return [];
      }

      const collections = data?.collections || [];
      this.setCache(cacheKey, collections, this.CACHE_DURATIONS.collections);
      
      return collections;
    } catch (error) {
      console.error('Exception fetching collections:', error);
      return [];
    }
  }

  // Smart category extraction with caching
  async getCategories(): Promise<string[]> {
    const cacheKey = 'shopify_categories';
    
    const cachedCategories = this.getCache<string[]>(cacheKey);
    if (cachedCategories) {
      console.log('✅ Returning cached categories');
      return cachedCategories;
    }

    try {
      console.log('🔄 Extracting categories from products...');
      
      // Get products without forcing a refresh (use cache if available)
      const products = await this.getProducts(false);
      
      const categories = new Set<string>();
      
      products.forEach(product => {
        // Add product type as category
        if (product.productType) {
          categories.add(product.productType);
        }
        
        // Extract alcohol-related categories from tags
        if (product.tags) {
          product.tags.forEach(tag => {
            const lowercaseTag = tag.toLowerCase();
            if (this.isAlcoholRelated(lowercaseTag)) {
              categories.add(tag);
            }
          });
        }
      });
      
      const categoryArray = Array.from(categories).sort();
      this.setCache(cacheKey, categoryArray, this.CACHE_DURATIONS.categories);
      
      console.log(`✅ Extracted ${categoryArray.length} categories`);
      return categoryArray;
    } catch (error) {
      console.error('Exception extracting categories:', error);
      return [];
    }
  }

  // Lazy load products for a specific collection
  async getCollectionProducts(collectionHandle: string): Promise<ShopifyProduct[]> {
    const cacheKey = `collection_products_${collectionHandle}`;
    
    const cachedProducts = this.getCache<ShopifyProduct[]>(cacheKey);
    if (cachedProducts) {
      console.log(`✅ Returning cached products for ${collectionHandle}`);
      return cachedProducts;
    }

    try {
      console.log(`🔄 Fetching products for collection: ${collectionHandle}`);
      
      const { data, error } = await supabase.functions.invoke('get-collection-products', {
        body: { 
          collectionHandle,
          limit: 50 // Reasonable limit per collection
        }
      });

      if (error) {
        console.error(`Error fetching products for ${collectionHandle}:`, error);
        return [];
      }

      const products = data?.products || [];
      this.setCache(cacheKey, products, this.CACHE_DURATIONS.products);
      
      return products;
    } catch (error) {
      console.error(`Exception fetching products for ${collectionHandle}:`, error);
      return [];
    }
  }

  // Search products with caching
  async searchProducts(query: string, filters?: {
    category?: string;
    priceRange?: [number, number];
    vendor?: string;
  }): Promise<ShopifyProduct[]> {
    const cacheKey = `search_${query}_${JSON.stringify(filters || {})}`;
    
    const cachedResults = this.getCache<ShopifyProduct[]>(cacheKey);
    if (cachedResults) {
      console.log(`✅ Returning cached search results for: ${query}`);
      return cachedResults;
    }

    try {
      console.log(`🔍 Searching products: ${query}`);
      
      // First get cached products to search locally (much faster)
      const allProducts = await this.getProducts(false);
      
      const searchTerms = query.toLowerCase().split(' ');
      let results = allProducts.filter(product => {
        const searchText = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });

      // Apply filters
      if (filters) {
        if (filters.category) {
          results = results.filter(p => 
            p.category?.toLowerCase() === filters.category?.toLowerCase() ||
            p.productType?.toLowerCase() === filters.category?.toLowerCase()
          );
        }
        
        if (filters.priceRange) {
          const [min, max] = filters.priceRange;
          results = results.filter(p => {
            const price = parseFloat(p.price);
            return price >= min && price <= max;
          });
        }
        
        if (filters.vendor) {
          results = results.filter(p => 
            p.vendor?.toLowerCase() === filters.vendor?.toLowerCase()
          );
        }
      }

      // Cache results for 5 minutes (shorter for search)
      this.setCache(cacheKey, results, 5 * 60 * 1000);
      
      console.log(`✅ Found ${results.length} products for: ${query}`);
      return results;
    } catch (error) {
      console.error(`Exception searching products:`, error);
      return [];
    }
  }

  // Utility method to check if a tag is alcohol-related
  private isAlcoholRelated(tag: string): boolean {
    const alcoholKeywords = [
      'whiskey', 'vodka', 'gin', 'rum', 'tequila', 'beer', 'wine', 
      'champagne', 'bourbon', 'scotch', 'brandy', 'cognac', 'liqueur',
      'spirits', 'cocktail', 'mixer'
    ];
    
    return alcoholKeywords.some(keyword => tag.includes(keyword));
  }

  // Clear specific cache entries
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
      console.log(`🗑️ Cleared cache entries matching: ${pattern}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const shopifyClient = new OptimizedShopifyClient();

// Export optimized hook for React components
export const useOptimizedShopify = () => {
  return {
    getProducts: shopifyClient.getProducts.bind(shopifyClient),
    getCollections: shopifyClient.getCollections.bind(shopifyClient),
    getCategories: shopifyClient.getCategories.bind(shopifyClient),
    getCollectionProducts: shopifyClient.getCollectionProducts.bind(shopifyClient),
    searchProducts: shopifyClient.searchProducts.bind(shopifyClient),
    clearCache: shopifyClient.clearCache.bind(shopifyClient),
    getCacheStats: shopifyClient.getCacheStats.bind(shopifyClient),
  };
};

// Export optimized categories function (replaces getShopifyCategories.ts)
export const getOptimizedShopifyCategories = async (): Promise<string[]> => {
  return shopifyClient.getCategories();
};