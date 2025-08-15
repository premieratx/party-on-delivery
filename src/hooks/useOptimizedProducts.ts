// COMPLETE SYSTEM SHUTDOWN v2025_01_14_21_25
// ALL PRELOADING AND COLLECTIONS LOADING DISABLED

import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  handle: string;
  description?: string;
  variants?: any[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  products: Product[];
}

interface UseOptimizedProductsOptions {
  initialLimit?: number;
  loadMoreLimit?: number;
}

export function useOptimizedProducts(options: UseOptimizedProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCollections = useCallback(async () => {
    console.log('🔄 Loading collections and products...');
    setLoading(true);
    setError(null);
    
    try {
      // Use instant cache for fast loading
      const response = await fetch('/api/instant-product-cache');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setCollections(data.collections || []);
      setProducts(data.products || []);
      setHasMore(false);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    console.log('🔍 Searching products for:', query);
    return products.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [products]);

  const getProductsByCollection = useCallback(async (handle: string) => {
    console.log('📦 Getting products for collection:', handle);
    const collection = collections.find(c => c.handle === handle);
    return collection?.products || [];
  }, [collections]);

  const loadMore = useCallback(async () => {
    console.log('📄 Load more requested');
    // Implement pagination if needed
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    products,
    collections,
    loading,
    error,
    hasMore,
    loadingMore,
    fetchCollections,
    searchProducts,
    getProductsByCollection,
    loadMore,
    refetch: fetchCollections
  };
}