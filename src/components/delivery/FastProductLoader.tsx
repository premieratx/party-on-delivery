import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getInstantProducts } from '@/utils/instantCacheClient';

interface FastProductLoaderProps {
  onProductsLoaded: (products: any[]) => void;
  onCollectionsLoaded: (collections: any[]) => void;
  category?: string;
}

export const FastProductLoader: React.FC<FastProductLoaderProps> = ({
  onProductsLoaded,
  onCollectionsLoaded,
  category
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataWithCache();
  }, [category]);

  const loadDataWithCache = async () => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      
      // ALWAYS use instant cache first - this should load in under 100ms
      const instant = await getInstantProducts();
      
      if (instant) {
        console.log('⚡ Ultra-fast instant cache load');
        const loadTime = performance.now() - startTime;
        console.log(`⚡ Loaded in ${loadTime}ms`);
        
        onProductsLoaded(instant.products || []);
        onCollectionsLoaded(instant.collections || []);
        setLoading(false);
        return;
      }

      // This should rarely happen - instant cache should always be available
      console.warn('📦 Instant cache miss - this should not happen often');
      
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load products. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const inferCategoryFromCollections = (collectionHandle: string): string => {
    if (collectionHandle.includes('beer') || collectionHandle.includes('tailgate')) return 'beer';
    if (collectionHandle.includes('wine') || collectionHandle.includes('champagne')) return 'wine';
    if (collectionHandle.includes('spirit') || collectionHandle.includes('whiskey') || collectionHandle.includes('vodka') || 
        collectionHandle.includes('gin') || collectionHandle.includes('rum') || collectionHandle.includes('tequila')) return 'spirits';
    if (collectionHandle.includes('cocktail') || collectionHandle.includes('ready-to-drink')) return 'cocktails';
    if (collectionHandle.includes('seltzer')) return 'seltzers';
    if (collectionHandle.includes('mixer') || collectionHandle.includes('non-alcoholic')) return 'mixers';
    if (collectionHandle.includes('party') || collectionHandle.includes('supplies') || collectionHandle.includes('decoration')) return 'party-supplies';
    return 'other';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};