import { useOptimizedProductLoader } from './useOptimizedProductLoader';

interface SearchProductsOptions {
  search_category?: string;
  lightweight?: boolean;
  auto_refresh?: boolean;
}

/**
 * Hook for search functionality - uses Shopify productType for categorization
 */
export function useSearchProducts(options: SearchProductsOptions = {}) {
  const result = useOptimizedProductLoader({
    ...options,
    use_type: 'search',
    search_category: options.search_category
  });

  return {
    ...result,
    searchCategories: result.collections, // Rename for clarity
    searchByType: (productType: string) => {
      // Implementation for searching by product type
      return result.products.filter(product => 
        product.product_type?.toLowerCase().includes(productType.toLowerCase())
      );
    }
  };
}