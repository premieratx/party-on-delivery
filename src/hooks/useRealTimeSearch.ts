import { useState, useEffect, useCallback } from 'react';
import { SearchOptimizer } from '@/utils/searchOptimizer';
import { supabase } from '@/integrations/supabase/client';

interface SearchProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  handle?: string;
  description?: string;
  vendor?: string;
  category?: string;
  collection_handles?: string[];
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

interface UseRealTimeSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

export function useRealTimeSearch(options: UseRealTimeSearchOptions = {}) {
  const { debounceMs = 150, maxResults = 50 } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [searchIndex, setSearchIndex] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all products once for searching
  const loadAllProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 useRealTimeSearch: Loading all products for search...');
      
      const { data, error } = await supabase.functions.invoke('get-unified-products', {
        body: { 
          use_type: 'search',
          lightweight: false,
          force_refresh: false,
          limit: null // Get all products
        }
      });

      if (error) {
        console.error('Error loading products for search:', error);
        return;
      }

      if (data?.products) {
        console.log(`🔍 Loaded ${data.products.length} products for real-time search`);
        setAllProducts(data.products);
        
        // Build search index
        const index = SearchOptimizer.buildSearchIndex(data.products, 'real-time-search');
        setSearchIndex(index);
      }
    } catch (error) {
      console.error('Error in loadAllProducts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      if (searchIndex.length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        // Use hierarchical search: Product Name > Collection > Category > Product Type
        const results = SearchOptimizer.searchProductsWithHierarchy(
          searchQuery, 
          searchIndex, 
          maxResults
        );
        
        console.log(`🔍 Real-time search: Found ${results.length} products for "${searchQuery}"`);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchIndex, debounceMs, maxResults]);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    isLoading,
    updateSearchQuery,
    clearSearch,
    hasResults: searchResults.length > 0,
    totalProductsLoaded: allProducts.length
  };
}