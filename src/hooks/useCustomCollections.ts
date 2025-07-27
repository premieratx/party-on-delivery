import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomCollection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  product_ids: string[];
  shopify_collection_id?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomCollections() {
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('custom_collections')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setCollections(data || []);
    } catch (err) {
      console.error('Error loading custom collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  return {
    collections,
    loading,
    error,
    reload: loadCollections
  };
}