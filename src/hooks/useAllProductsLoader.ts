import { useState, useEffect, useCallback } from 'react';
import { ultraFastSearch } from '@/utils/ultraFastSearch';

interface Product {
  id: string;
  title: string;
  price: string | number;
  image: string;
  category: string;
  vendor: string;
  description?: string;
  variants?: any[];
  collection_handles?: string[];
  product_type?: string;
  search_category?: string;
}

/**
 * Hook to load ALL products (1000+) for universal search functionality
 * Uses ultra-fast search to get complete product catalog instead of just current collection
 */
export function useAllProductsLoader() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading ALL products for universal search...');
      
      // Call ultra-fast search with empty query to get all products
      const response = await ultraFastSearch.searchProducts('', {
        category: undefined, // No category filter = ALL products
        limit: 1000, // Get maximum products
        useCache: true
      });
      
      if (response.products && response.products.length > 0) {
        setAllProducts(response.products);
        console.log(`✅ Loaded ${response.products.length} products for universal search`);
      } else {
        console.warn('⚠️ No products returned from ultra-fast search');
        setAllProducts([]);
      }
    } catch (err) {
      console.error('❌ Error loading all products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  // Warm up cache and refresh periodically
  useEffect(() => {
    const warmUpAndRefresh = async () => {
      try {
        await ultraFastSearch.warmUpCache();
        await loadAllProducts();
      } catch (error) {
        console.warn('Failed to warm up cache:', error);
      }
    };

    // Initial warm up
    warmUpAndRefresh();

    // Refresh every 10 minutes to keep data fresh
    const interval = setInterval(warmUpAndRefresh, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadAllProducts]);

  return {
    allProducts,
    loading,
    error,
    refresh: loadAllProducts
  };
}
