import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { ultraFastSearch } from '@/utils/ultraFastSearch';

interface SearchProduct {
  id: string;
  title: string;
  price: number | string;
  image?: string;
  handle?: string;
  description?: string;
  vendor?: string;
  category?: string;
  collection_handles?: string[] | string;
  variants?: any[];
}

interface UseUniversalSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  useUltraFast?: boolean;
  category?: string;
}

interface UseUniversalSearchReturn {
  searchQuery: string;
  searchResults: SearchProduct[];
  isSearching: boolean;
  isLoading: boolean;
  updateSearchQuery: (query: string) => void;
  clearSearch: () => void;
  searchByCategory: (category: string) => SearchProduct[];
  searchByType: (type: string) => SearchProduct[];
}

/**
 * Universal search hook that consolidates all search functionality
 * Supports both local and ultra-fast search with consistent interface
 */
export function useUniversalSearch(
  products: SearchProduct[] = [],
  options: UseUniversalSearchOptions = {}
): UseUniversalSearchReturn {
  const { 
    debounceMs = 300, 
    maxResults = 50, 
    useUltraFast = false,
    category 
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Build search index from ALL products (not just current collection)
  const searchIndex = useMemo(() => {
    if (products.length === 0) return [];
    // Transform products to ensure price is a number
    const normalizedProducts = products.map(p => ({
      ...p,
      price: typeof p.price === 'string' ? parseFloat(p.price) || 0 : p.price
    }));
    return SearchOptimizer.buildSearchIndex(normalizedProducts, `universal-search-${category || 'all'}`);
  }, [products, category]);

  // Debounced search execution
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      let results: SearchProduct[] = [];

      if (useUltraFast) {
        // Use ultra-fast search - searches ALL products (1000+), not just collection
        const response = await ultraFastSearch.searchProducts(query, {
          category: undefined, // Remove category filter to search ALL products
          limit: maxResults
        });
        results = response.products || [];
      } else {
        // Use local search with optimization
        if (searchIndex.length > 0) {
          results = SearchOptimizer.searchProductsWithHierarchy(query, searchIndex, maxResults);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Universal search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchIndex, useUltraFast, category, maxResults]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      executeSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, executeSearch, debounceMs]);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Search by category
  const searchByCategory = useCallback((categoryFilter: string) => {
    if (searchIndex.length === 0) return [];
    
    return searchIndex
      .filter(item => item.category.includes(categoryFilter.toLowerCase()))
      .map(item => item.p)
      .slice(0, maxResults);
  }, [searchIndex, maxResults]);

  // Search by product type
  const searchByType = useCallback((type: string) => {
    if (searchIndex.length === 0) return [];
    
    return searchIndex
      .filter(item => item.productType.includes(type.toLowerCase()))
      .map(item => item.p)
      .slice(0, maxResults);
  }, [searchIndex, maxResults]);

  return {
    searchQuery,
    searchResults,
    isSearching,
    isLoading,
    updateSearchQuery,
    clearSearch,
    searchByCategory,
    searchByType
  };
}