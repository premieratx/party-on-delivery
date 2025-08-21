import { supabase } from '@/integrations/supabase/client';

interface HierarchicalSearchOptions {
  category?: string;
  subcategory?: string;
  limit?: number;
  query?: string;
}

interface SearchResult {
  products: any[];
  totalFound: number;
  loadTime: string;
  fromCache: boolean;
}

class HierarchicalSearchClient {
  private static instance: HierarchicalSearchClient;
  private searchCache = new Map<string, any>();
  private categoriesCache: any[] = [];
  private lastCategoryLoad = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): HierarchicalSearchClient {
    if (!HierarchicalSearchClient.instance) {
      HierarchicalSearchClient.instance = new HierarchicalSearchClient();
    }
    return HierarchicalSearchClient.instance;
  }

  async getCategories(): Promise<{ id: string; label: string; count: number }[]> {
    const now = Date.now();
    
    if (this.categoriesCache.length > 0 && now - this.lastCategoryLoad < this.CACHE_DURATION) {
      return this.categoriesCache;
    }

    try {
      const { data, error } = await supabase
        .from('product_hierarchical_categories')
        .select('categories, COUNT(*) as count')
        .neq('categories', ['other']);

      if (error) throw error;

      const categoryMap = new Map();
      categoryMap.set('all', { id: 'all', label: 'All Products', count: 0 });

      data?.forEach((item: any) => {
        if (item.categories && item.categories.length > 0) {
          const mainCategory = item.categories[0];
          const friendlyName = this.getCategoryDisplayName(mainCategory);
          
          if (!categoryMap.has(mainCategory)) {
            categoryMap.set(mainCategory, { 
              id: mainCategory, 
              label: friendlyName,
              count: 0 
            });
          }
          categoryMap.get(mainCategory).count += item.count || 0;
        }
      });

      this.categoriesCache = Array.from(categoryMap.values());
      this.lastCategoryLoad = now;
      
      return this.categoriesCache;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [{ id: 'all', label: 'All Products', count: 0 }];
    }
  }

  async getSubcategories(category: string): Promise<{ id: string; label: string; count: number }[]> {
    if (category === 'all') {
      return [{ id: 'all', label: 'All', count: 0 }];
    }

    try {
      const { data, error } = await supabase
        .from('product_hierarchical_categories')
        .select('product_type, COUNT(*) as count')
        .contains('categories', [category])
        .not('product_type', 'is', null)
        .neq('product_type', '');

      if (error) throw error;

      const subcategoryMap = new Map();
      subcategoryMap.set('all', { id: 'all', label: 'All', count: 0 });

      data?.forEach((item: any) => {
        if (item.product_type) {
          const cleanName = this.getProductTypeDisplayName(item.product_type);
          subcategoryMap.set(item.product_type, {
            id: item.product_type,
            label: cleanName,
            count: item.count || 0
          });
        }
      });

      return [
        { id: 'all', label: 'All', count: 0 },
        ...Array.from(subcategoryMap.values())
          .filter(sub => sub.id !== 'all')
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      ];
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      return [{ id: 'all', label: 'All', count: 0 }];
    }
  }

  async searchProducts(options: HierarchicalSearchOptions): Promise<SearchResult> {
    const startTime = performance.now();
    const { category = 'all', subcategory = 'all', limit = 50, query } = options;
    
    const cacheKey = `${query || 'browse'}_${category}_${subcategory}_${limit}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      const endTime = performance.now();
      return {
        ...cached,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        fromCache: true
      };
    }

    try {
      const { data, error } = await supabase.rpc('hierarchical_product_search', {
        search_query: query || '',
        max_results: limit
      });

      if (error) throw error;

      let filteredProducts = data || [];

      // Apply category filter
      if (category !== 'all') {
        filteredProducts = filteredProducts.filter((p: any) => 
          p.categories && p.categories.includes(category)
        );
      }

      // Apply subcategory filter
      if (subcategory !== 'all') {
        filteredProducts = filteredProducts.filter((p: any) => {
          const productType = (p.product_type || '').toLowerCase();
          const selectedType = subcategory.toLowerCase();
          return productType === selectedType || productType.includes(selectedType);
        });
      }

      const result = {
        products: filteredProducts.slice(0, limit),
        totalFound: filteredProducts.length
      };

      // Cache the results
      this.searchCache.set(cacheKey, result);

      // Limit cache size
      if (this.searchCache.size > 100) {
        const firstKey = this.searchCache.keys().next().value;
        this.searchCache.delete(firstKey);
      }

      const endTime = performance.now();
      return {
        ...result,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        fromCache: false
      };
    } catch (error) {
      console.error('Hierarchical search error:', error);
      const endTime = performance.now();
      return {
        products: [],
        totalFound: 0,
        loadTime: `${(endTime - startTime).toFixed(2)}ms`,
        fromCache: false
      };
    }
  }

  private getCategoryDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      'beer': 'Beer & Seltzers',
      'wine': 'Wine & Champagne',
      'spirits': 'Spirits & Liquor',
      'mixers': 'Mixers & Sodas',
      'snacks': 'Snacks & Food',
      'party': 'Party Supplies'
    };
    return displayNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private getProductTypeDisplayName(productType: string): string {
    const displayNames: Record<string, string> = {
      'beer and seltzers': 'Beer & Seltzers',
      'Liquor & Spirits': 'Liquor & Spirits',
      'Cocktail Mixes': 'Cocktail Mixers'
    };
    return displayNames[productType] || productType;
  }

  clearCache(): void {
    this.searchCache.clear();
    this.categoriesCache = [];
    console.log('🧹 Hierarchical search cache cleared');
  }
}

export const hierarchicalSearch = HierarchicalSearchClient.getInstance();