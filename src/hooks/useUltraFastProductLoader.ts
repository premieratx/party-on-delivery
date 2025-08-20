import { useState, useEffect, useCallback } from 'react';
import { ultraFastSearch } from '@/utils/ultraFastSearch';

interface UltraFastLoaderState {
  products: any[];
  loading: boolean;
  error: string | null;
  searchResults: any[];
  lastSearchTime: number;
}

// Global state to share across components for instant loading
let globalProductState: UltraFastLoaderState = {
  products: [],
  loading: false,
  error: null,
  searchResults: [],
  lastSearchTime: 0
};

let isGloballyWarmedUp = false;

export const useUltraFastProductLoader = () => {
  const [state, setState] = useState<UltraFastLoaderState>(globalProductState);

  // Load all products instantly on first use
  const loadAllProducts = useCallback(async () => {
    if (globalProductState.products.length > 0 && !state.loading) {
      console.log('⚡ Products already loaded globally');
      return globalProductState.products;
    }

    console.log('🚀 Loading all products with ultra-fast cache...');
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    globalProductState.loading = true;

    try {
      // Warm up cache if not done yet
      if (!isGloballyWarmedUp) {
        await ultraFastSearch.warmUpCache();
        isGloballyWarmedUp = true;
      }

      // Get all products
      const products = await ultraFastSearch.getAllProducts();
      
      console.log(`✅ Loaded ${products.length} products in ultra-fast mode`);
      
      // Update global state
      globalProductState = {
        ...globalProductState,
        products,
        loading: false,
        error: null
      };

      setState(globalProductState);
      return products;

    } catch (error) {
      console.error('❌ Failed to load products:', error);
      
      const errorState = {
        ...globalProductState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load products'
      };
      
      globalProductState = errorState;
      setState(errorState);
      
      return [];
    }
  }, [state.loading]);

  // Ultra-fast search with <250ms target
  const searchProducts = useCallback(async (query: string, options: {
    limit?: number;
    useCache?: boolean;
  } = {}): Promise<any[]> => {
    const startTime = performance.now();
    
    if (!query.trim()) {
      return globalProductState.products;
    }

    try {
      console.log(`🔍 ULTRA-FAST SEARCH: "${query}"`);
      
      const result = await ultraFastSearch.searchProducts(query, {
        limit: options.limit || 100,
        useCache: options.useCache !== false
      });

      const duration = performance.now() - startTime;
      console.log(`⚡ SEARCH COMPLETED: "${query}" - ${result.products.length} results in ${duration.toFixed(2)}ms (${result.fromCache ? 'cached' : 'fresh'})`);

      // Update search results in global state
      globalProductState.searchResults = result.products;
      globalProductState.lastSearchTime = Date.now();
      
      setState({ ...globalProductState });
      
      return result.products;

    } catch (error) {
      console.error('❌ Ultra-fast search error:', error);
      return [];
    }
  }, []);

  // Get cached search results
  const getCachedSearchResults = useCallback((query: string): any[] | null => {
    if (Date.now() - globalProductState.lastSearchTime > 30000) {
      return null; // Cache expired
    }
    return globalProductState.searchResults;
  }, []);

  // Preload collections instantly
  const preloadCollections = useCallback(async (collectionHandles: string[]) => {
    if (collectionHandles.length === 0) return;

    console.log('⚡ Preloading collections:', collectionHandles);
    
    try {
      // Warm up cache for all collections
      await ultraFastSearch.warmUpCache();
      
      // Collections are already loaded in the main product index
      console.log('✅ Collections preloaded via ultra-fast search');
      
    } catch (error) {
      console.error('❌ Failed to preload collections:', error);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (globalProductState.products.length === 0 && !globalProductState.loading) {
      loadAllProducts();
    } else {
      setState(globalProductState);
    }
  }, [loadAllProducts]);

  return {
    products: state.products,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    loadAllProducts,
    searchProducts,
    getCachedSearchResults,
    preloadCollections,
    getCacheStats: () => ultraFastSearch.getCacheStats()
  };
};