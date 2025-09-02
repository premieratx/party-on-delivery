import { useState, useEffect, useCallback } from 'react';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';

interface UseRealTimeSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

export function useRealTimeSearch(options: UseRealTimeSearchOptions = {}) {
  const { debounceMs = 300, maxResults = 50 } = options;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Real-time search for:', query);
      const response = await optimizedUltraFastSearch.searchProductsInstant(query, { limit: maxResults });
      console.log('✅ Search results:', response.products.length);
      setSearchResults(response.products);
      setHasResults(response.products.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setHasResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [maxResults]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs, performSearch]);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasResults(false);
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    hasResults,
    updateSearchQuery,
    clearSearch
  };
}