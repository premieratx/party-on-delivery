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
    console.log('🚫 Collections loading DISABLED - no preloading');
    setCollections([]);
    setProducts([]);
    setLoading(false);
    setError(null);
    setHasMore(false);
  }, []);

  const searchProducts = useCallback(async () => {
    console.log('🚫 Product search DISABLED');
    return [];
  }, []);

  const getProductsByCollection = useCallback(async () => {
    console.log('🚫 Products by collection DISABLED');
    return [];
  }, []);

  const loadMore = useCallback(async () => {
    console.log('🚫 Load more DISABLED');
  }, []);

  useEffect(() => {
    // Do nothing - all loading disabled
    setError('Collections loading disabled to prevent preloading issues');
  }, []);

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