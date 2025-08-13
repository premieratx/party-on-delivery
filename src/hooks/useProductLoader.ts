import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: number;
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

interface ProductLoaderState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

export const useProductLoader = () => {
  const [state, setState] = useState<ProductLoaderState>({
    collections: [],
    loading: true,
    error: null
  });

  const loadCollections = useCallback(async (forceRefresh = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh }
      });

      if (error) throw error;

      const collections = data?.collections || [];
      setState({
        collections,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Failed to load collections:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load products'
      }));
    }
  }, []);

  const refreshCollections = useCallback(() => {
    loadCollections(true);
  }, [loadCollections]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return {
    collections: state.collections,
    loading: state.loading,
    error: state.error,
    refreshCollections
  };
};