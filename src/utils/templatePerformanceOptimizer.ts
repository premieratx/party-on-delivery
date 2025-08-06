// Performance optimization utilities for white label template system
import { productCache, shopifyCache, generalCache } from './enhancedCacheManager';

export interface TemplatePerformanceConfig {
  enablePrefetch: boolean;
  cacheTimeout: number;
  maxConcurrentRequests: number;
  batchSize: number;
  enableServiceWorker: boolean;
}

export interface AppTemplate {
  id: string;
  slug: string;
  name: string;
  collections: string[];
  priority: 'high' | 'medium' | 'low';
  lastAccessed?: Date;
  accessCount?: number;
}

class TemplatePerformanceOptimizer {
  private static instance: TemplatePerformanceOptimizer;
  private config: TemplatePerformanceConfig;
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private prefetchedTemplates = new Set<string>();

  constructor() {
    this.config = {
      enablePrefetch: true,
      cacheTimeout: 300000, // 5 minutes
      maxConcurrentRequests: 3,
      batchSize: 10,
      enableServiceWorker: false
    };
  }

  static getInstance(): TemplatePerformanceOptimizer {
    if (!TemplatePerformanceOptimizer.instance) {
      TemplatePerformanceOptimizer.instance = new TemplatePerformanceOptimizer();
    }
    return TemplatePerformanceOptimizer.instance;
  }

  /**
   * Optimize template loading with intelligent caching and prefetching
   */
  async optimizeTemplateLoad(template: AppTemplate): Promise<any> {
    const cacheKey = `template_${template.slug}`;
    
    // Try cache first
    const cached = productCache.get(cacheKey);
    if (cached) {
      console.log(`🚀 Template ${template.slug} loaded from cache`);
      this.updateAccessStats(template);
      return cached;
    }

    // Check if already loading
    if (this.loadingQueue.has(template.slug)) {
      console.log(`⏳ Template ${template.slug} already loading, waiting...`);
      return this.loadingQueue.get(template.slug);
    }

    // Start loading
    const loadPromise = this.loadTemplateData(template);
    this.loadingQueue.set(template.slug, loadPromise);

    try {
      const result = await loadPromise;
      
      // Cache the result
      productCache.set(cacheKey, result, 300); // 5 min cache
      
      // Update access stats
      this.updateAccessStats(template);
      
      // Trigger prefetch for related templates
      if (this.config.enablePrefetch) {
        this.prefetchRelatedTemplates(template);
      }
      
      console.log(`✅ Template ${template.slug} loaded and cached`);
      return result;
      
    } finally {
      this.loadingQueue.delete(template.slug);
    }
  }

  /**
   * Load template data with collection optimization
   */
  private async loadTemplateData(template: AppTemplate): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Load collections in parallel batches for better performance
      const collectionBatches = this.batchArray(template.collections, this.config.batchSize);
      const allCollections = [];
      
      for (const batch of collectionBatches) {
        const batchPromises = batch.map(handle => this.loadOptimizedCollection(handle));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            allCollections.push(result.value);
          }
        });
      }

      const templateData = {
        id: template.id,
        slug: template.slug,
        name: template.name,
        collections: allCollections,
        loadTime: performance.now() - startTime,
        timestamp: Date.now()
      };

      console.log(`📊 Template ${template.slug} loaded in ${templateData.loadTime.toFixed(2)}ms`);
      return templateData;
      
    } catch (error) {
      console.error(`❌ Failed to load template ${template.slug}:`, error);
      throw error;
    }
  }

  /**
   * Load collection with smart caching and image optimization
   */
  private async loadOptimizedCollection(handle: string): Promise<any> {
    const cacheKey = `collection_${handle}`;
    
    // Check cache first
    const cached = shopifyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Import Supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('fetch-shopify-products-optimized', {
        body: {
          collection: handle,
          lightweight: true,
          includeImages: true,
          limit: 50,
          cacheBust: false
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to load collection');

      const optimizedCollection = {
        handle,
        title: data.collection?.title || handle,
        products: data.products.map((product: any) => this.optimizeProductData(product))
      };

      // Cache the result
      shopifyCache.set(cacheKey, optimizedCollection, 60); // 1 min cache
      
      return optimizedCollection;
      
    } catch (error) {
      console.error(`Failed to load collection ${handle}:`, error);
      return null;
    }
  }

  /**
   * Optimize product data for faster rendering
   */
  private optimizeProductData(product: any): any {
    return {
      id: product.id,
      title: product.title,
      price: product.price || 0,
      image: this.optimizeImageUrl(product.image),
      handle: product.handle,
      category: product.category,
      variants: product.variants?.slice(0, 3) || [], // Limit variants for performance
      // Skip heavy fields like full description
      description: product.description?.substring(0, 100) || ''
    };
  }

  /**
   * Optimize image URLs for better loading performance
   */
  private optimizeImageUrl(url: string): string {
    if (!url || !url.includes('shopify')) return url;
    
    // Add Shopify image optimization parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=400&quality=80&format=webp`;
  }

  /**
   * Prefetch related templates based on usage patterns
   */
  private async prefetchRelatedTemplates(currentTemplate: AppTemplate): Promise<void> {
    if (this.prefetchedTemplates.has(currentTemplate.slug)) return;
    
    try {
      // Mark as prefetched to avoid loops
      this.prefetchedTemplates.add(currentTemplate.slug);
      
      // Get related templates (simple heuristic: same collections)
      const relatedTemplates = await this.getRelatedTemplates(currentTemplate);
      
      // Prefetch top 2 related templates
      const topRelated = relatedTemplates.slice(0, 2);
      
      for (const template of topRelated) {
        // Prefetch in background without blocking
        setTimeout(() => {
          this.optimizeTemplateLoad(template).catch(err => {
            console.warn(`Prefetch failed for ${template.slug}:`, err);
          });
        }, 1000);
      }
      
    } catch (error) {
      console.warn('Template prefetch error:', error);
    }
  }

  /**
   * Get related templates (placeholder - implement based on your logic)
   */
  private async getRelatedTemplates(template: AppTemplate): Promise<AppTemplate[]> {
    // This would typically query your database for related templates
    // For now, return empty array
    return [];
  }

  /**
   * Update template access statistics for better optimization
   */
  private updateAccessStats(template: AppTemplate): void {
    try {
      const statsKey = `template_stats_${template.slug}`;
      const stats = generalCache.get(statsKey) as any || { 
        accessCount: 0, 
        lastAccessed: null 
      };
      
      stats.accessCount++;
      stats.lastAccessed = new Date();
      
      generalCache.set(statsKey, stats, 86400); // 24 hour cache
      
    } catch (error) {
      console.warn('Failed to update template stats:', error);
    }
  }

  /**
   * Batch array into smaller chunks for parallel processing
   */
  private batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Clear template caches and reset prefetch state
   */
  clearTemplateCache(): void {
    productCache.clear();
    shopifyCache.clear();
    this.prefetchedTemplates.clear();
    this.loadingQueue.clear();
    console.log('🧹 Template cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): any {
    return {
      productCache: productCache.getStats(),
      shopifyCache: shopifyCache.getStats(),
      generalCache: generalCache.getStats(),
      loadingQueue: this.loadingQueue.size,
      prefetchedCount: this.prefetchedTemplates.size
    };
  }

  /**
   * Configure performance settings
   */
  updateConfig(newConfig: Partial<TemplatePerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Template performance config updated:', this.config);
  }
}

// Export singleton instance
export const templatePerformanceOptimizer = TemplatePerformanceOptimizer.getInstance();

// Export utility functions
export const optimizeWhiteLabelTemplate = templatePerformanceOptimizer.optimizeTemplateLoad.bind(templatePerformanceOptimizer);
export const clearTemplateCache = templatePerformanceOptimizer.clearTemplateCache.bind(templatePerformanceOptimizer);
export const getTemplateCacheStats = templatePerformanceOptimizer.getCacheStats.bind(templatePerformanceOptimizer);