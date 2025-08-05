import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    try {
      setLoading(true);
      
      // Try instant cache first
      const { data: instantData } = await supabase.functions.invoke('instant-product-cache');
      
      if (instantData?.success && instantData?.data) {
        console.log('⚡ Using instant cache for fast loading');
        onProductsLoaded(instantData.data.products || []);
        onCollectionsLoaded(instantData.data.collections || []);
        setLoading(false);
        return;
      }

      // Fallback to regular collection loading
      console.log('📦 Loading from collections API');
      const { data: collectionsData, error } = await supabase.functions.invoke('get-all-collections');
      
      if (error) throw error;
      
      if (collectionsData?.collections) {
        onCollectionsLoaded(collectionsData.collections);
        
        // Extract all products from collections
        const allProducts = collectionsData.collections.reduce((acc: any[], collection: any) => {
          if (collection.products) {
            acc.push(...collection.products.map((p: any) => ({
              ...p,
              category: inferCategoryFromCollections(collection.handle)
            })));
          }
          return acc;
        }, []);
        
        onProductsLoaded(allProducts);
      }
      
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