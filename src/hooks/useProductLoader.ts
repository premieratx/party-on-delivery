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
      
      console.log('Loading collections with forceRefresh:', forceRefresh);
      
      const { data, error } = await supabase.functions.invoke('get-all-collections', {
        body: { forceRefresh }
      });

      console.log('Collections response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Handle the response format from get-all-collections
      const collections = data?.collections || data || [];
      console.log('Processed collections:', collections.length);
      
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