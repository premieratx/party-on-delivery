import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  handle: string;
  variants?: any[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  products: Product[];
}

interface CachedProductData {
  collections: Collection[];
  products: Product[];
  categories: any[];
  cached_at: number;
}

export const useOptimizedProductLoader = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Use optimized instant cache endpoint
      const { data, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh }
      });

      if (cacheError) {
        console.error('Cache error:', cacheError);
        throw cacheError;
      }

      if (data?.success && data?.data) {
        const productData: CachedProductData = data.data;
        setProducts(productData.products || []);
        setCollections(productData.collections || []);
        setCategories(productData.categories || []);
      } else {
        throw new Error('Failed to load product data');
      }
    } catch (err: any) {
      console.error('Product loading error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts(false);
  }, [loadProducts]);

  return {
    products,
    collections,
    categories,
    loading,
    error,
    refreshProducts
  };
};