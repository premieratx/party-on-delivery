import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  handle: string;
  variants?: any[];
  collection_handles?: string[];
  category?: string;
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

// In-memory cache and request deduplication (frontend-only)
let __memoryCache: CachedProductData | null = null;
let __memoryCacheAt = 0;
let __inflightPromise: Promise<void> | null = null;
const __CACHE_TTL_MS = 2 * 60 * 1000;

export const useOptimizedProductLoader = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    console.log('🔄 useOptimizedProductLoader: Starting product load...');
    setLoading(true);
    setError(null);

    try {
      // Try instant-product-cache first for ultra-fast loading
      console.log('📦 Trying instant cache...');
      const { data: cacheData, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: false }
      });

      console.log('📦 Cache response:', { cacheData, cacheError });

      if (!cacheError && cacheData?.success && cacheData?.data) {
        const { products: cachedProducts, collections: cachedCollections } = cacheData.data;
        
        if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
          console.log(`✅ Instant cache hit: ${cachedProducts.length} products, ${cachedCollections?.length || 0} collections`);
          setProducts(cachedProducts);
          setCollections(Array.isArray(cachedCollections) ? cachedCollections : []);
          setLoading(false);
          return;
        }
      }

      // Fallback 1: Try get-all-collections with products
      console.log('📦 Trying collections API...');
      const { data: collectionsData, error: collectionsError } = await supabase.functions.invoke('get-all-collections');
      
      console.log('📦 Collections response:', { collectionsData, collectionsError });
      
      if (!collectionsError && collectionsData?.success && collectionsData?.collections) {
        const collections = Array.isArray(collectionsData.collections) ? collectionsData.collections : [];
        const allProducts = collections.reduce((acc, collection) => {
          if (Array.isArray(collection.products)) {
            acc.push(...collection.products);
          }
          return acc;
        }, []);

        if (allProducts.length > 0) {
          console.log(`✅ Collections API: ${allProducts.length} products from ${collections.length} collections`);
          setProducts(allProducts);
          setCollections(collections);
          setLoading(false);
          return;
        }
      }

      // Fallback 2: Try optimized products endpoint
      console.log('📦 Trying optimized products...');
      const { data: optimizedData, error: optimizedError } = await supabase.functions.invoke('fetch-shopify-products-optimized', {
        body: { lightweight: true, includeImages: true, limit: 200 }
      });

      console.log('📦 Optimized response:', { optimizedData, optimizedError });

      if (!optimizedError && optimizedData?.success && optimizedData?.products) {
        const products = Array.isArray(optimizedData.products) ? optimizedData.products : [];
        console.log(`✅ Optimized API: ${products.length} products`);
        setProducts(products);
        setCollections([]);
        setLoading(false);
        return;
      }

      // Final fallback: Try direct product fetch
      console.log('📦 Trying direct product fetch...');
      const { data: directData, error: directError } = await supabase.functions.invoke('fetch-shopify-products');
      
      console.log('📦 Direct response:', { directData, directError });
      
      if (!directError && Array.isArray(directData)) {
        console.log(`✅ Direct fetch: ${directData.length} products`);
        setProducts(directData);
        setCollections([]);
        setLoading(false);
        return;
      }

      throw new Error('All product loading methods failed');

    } catch (err) {
      console.error('❌ Product loading failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load products: ${errorMessage}`);
      setProducts([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    products: Array.isArray(products) ? products : [],
    collections: Array.isArray(collections) ? collections : [],
    loading,
    error,
    refreshProducts: loadProducts,
    // Enhanced collection matching for search app categories
    getProductsByCollection: (handle: string) => {
      if (!Array.isArray(collections)) return [];
      
      // Map collection handles to search app categories
      const collectionMappings = {
        'spirits': ['spirits', 'gin-rum', 'tequila-mezcal', 'whiskey'],
        'beer': ['tailgate-beer', 'texas-beer-collection', 'beer'],
        'seltzers': ['seltzer-collection', 'seltzers'],
        'cocktails': ['cocktail-kits', 'ready-to-drink-cocktails'],
        'mixers': ['mixers-non-alcoholic', 'mixers'],
        'wine': ['champagne', 'wine'],
        'party-supplies': ['party-supplies', 'decorations']
      };
      
      const mappedHandles = collectionMappings[handle] || [handle];
      
      return collections.reduce((acc, collection) => {
        if (mappedHandles.some(h => 
          collection.handle?.toLowerCase().includes(h.toLowerCase()) ||
          h.toLowerCase().includes(collection.handle?.toLowerCase())
        )) {
          acc.push(...(Array.isArray(collection.products) ? collection.products : []));
        }
        return acc;
      }, []);
    }
  };

};