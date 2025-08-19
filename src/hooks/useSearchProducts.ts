import { useOptimizedProductLoader } from './useOptimizedProductLoader';
import { SearchOptimizer } from '@/utils/searchOptimizer';

interface SearchProductsOptions {
  search_category?: string;
  lightweight?: boolean;
  auto_refresh?: boolean;
}

/**
 * Hook for search functionality with priority scoring: Name > Category > Collection > Product Type
 */
export function useSearchProducts(options: SearchProductsOptions = {}) {
  const result = useOptimizedProductLoader({
    ...options,
    use_type: 'search',
    search_category: options.search_category
  });

  // Build search index when products are available
  const searchIndex = result.products.length > 0 
    ? SearchOptimizer.buildSearchIndex(result.products, `search-${options.search_category || 'all'}`)
    : [];

  return {
    ...result,
    searchCategories: result.collections, // Rename for clarity
    searchProducts: (query: string, limit = 50) => {
      if (!query.trim() || searchIndex.length === 0) return [];
      return SearchOptimizer.searchProducts(query, searchIndex, limit);
    },
    searchByType: (productType: string) => {
      // Implementation for searching by product type using the search index
      return searchIndex
        .filter(item => item.productType.includes(productType.toLowerCase()))
        .map(item => item.p);
    },
    searchByCategory: (category: string) => {
      // Implementation for searching by category
      return searchIndex
        .filter(item => item.category.includes(category.toLowerCase()))
        .map(item => item.p);
    }
  };
}