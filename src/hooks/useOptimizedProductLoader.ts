import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProductPreloader } from './useProductPreloader';
import { ultraFastSmartCache } from '@/utils/ultraFastSmartCache';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  vendor: string;
  description?: string;
  variants?: any[];
  collection_handles?: string[];
  product_type?: string; // Shopify productType for search
  search_category?: string; // Normalized category for search
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  products: Product[];
}

interface LoaderOptions {
  app_slug?: string;
  lightweight?: boolean;
  auto_refresh?: boolean;
  use_type?: 'search' | 'delivery'; // Determines filtering method
  search_category?: string; // For search functionality
  category?: string; // For delivery app tabs
  collection_handle?: string; // For delivery app tabs
}

export function useOptimizedProductLoader(options: LoaderOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastRequestRef = useRef<string>('');
  const { getFromCache, preloadCollection } = useProductPreloader();

  const { 
    app_slug, 
    lightweight = true, 
    auto_refresh = true,
    use_type = 'delivery',
    search_category,
    category,
    collection_handle
  } = options;

  const loadProducts = useCallback(async (force_refresh = false) => {
    if (!collection_handle) return;

    const requestKey = `${collection_handle}-${use_type}`;
    lastRequestRef.current = requestKey;

    console.log(`🎯 SMART LOAD: Starting load for "${collection_handle}"`);

    // Try ultra-fast smart cache first (unless forcing refresh)
    if (!force_refresh) {
      try {
        const smartCached = await ultraFastSmartCache.getProductsInstant(collection_handle);
        if (smartCached && smartCached.length > 0) {
          console.log(`⚡ ULTRA-INSTANT: Using smart cache for ${collection_handle}: ${smartCached.length} items`);
          // Convert CachedProduct to Product format
          const convertedProducts: Product[] = smartCached.map(cached => ({
            id: cached.id,
            title: cached.title,
            price: cached.price.toString(),
            image: cached.image,
            category: cached.category,
            vendor: cached.vendor,
            description: cached.description,
            variants: cached.variants,
            collection_handles: cached.collection_handles,
            product_type: cached.product_type,
            search_category: cached.search_category
          }));
          setProducts(convertedProducts);
          setLoading(false);
          setCached(true);
          return;
        }
      } catch (error) {
        console.log('Smart cache failed, trying preloader cache...');
      }
      
      // Fallback to preloader cache
      const cached = getFromCache(collection_handle);
      if (cached) {
        console.log(`⚡ INSTANT: Using preloader cache for ${collection_handle}: ${cached.length} items`);
        setProducts(cached);
        setLoading(false);
        setCached(true);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Loading products for collection: ${collection_handle} with caching`);

      // Clear products immediately to prevent mixing between collections
      setProducts([]);
      
      try {
        const loadedProducts = await preloadCollection(collection_handle);
        
        // Check if this is still the latest request
        if (lastRequestRef.current === requestKey) {
          setProducts(loadedProducts || []);
          setCollections([]); // Collections not needed for individual collection loading
          setCached(false);
          setRetryCount(0);
        }
      } catch (loadError) {
        console.error(`❌ Failed to load collection ${collection_handle}:`, loadError);
        
        // Try to use any cached data as fallback
        const fallbackCache = getFromCache(collection_handle);
        if (fallbackCache && fallbackCache.length > 0) {
          console.log(`🔄 Using fallback cache for ${collection_handle}`);
          setProducts(fallbackCache);
          setCached(true);
        } else {
          setError(`Unable to load products for ${collection_handle}. Please try again.`);
          setProducts([]);
        }
      }
    } catch (err) {
      if (lastRequestRef.current === requestKey) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setProducts([]);
        setCollections([]);
      }
    } finally {
      if (lastRequestRef.current === requestKey) {
        setLoading(false);
      }
    }
  }, [collection_handle, getFromCache, preloadCollection, use_type]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    return loadProducts(true);
  }, [loadProducts]);

  // Load products when collection_handle changes
  const hasMounted = useRef(false);
  const prevCollectionHandle = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Load products on mount or when collection_handle changes
    if (!hasMounted.current || prevCollectionHandle.current !== collection_handle) {
      hasMounted.current = true;
      prevCollectionHandle.current = collection_handle;
      console.log(`🔄 Collection changed to: ${collection_handle || 'ALL'} - loading products`);
      loadProducts();
    }
  }, [loadProducts, collection_handle]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Refreshing products due to external event');
      loadProducts(true);
    };
    
    window.addEventListener('collectionsUpdated', handleRefresh);
    window.addEventListener('forceProductRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('collectionsUpdated', handleRefresh);
      window.removeEventListener('forceProductRefresh', handleRefresh);
    };
  }, [loadProducts]);

  // Auto-refresh every 5 minutes if enabled (but not during active retry attempts)
  useEffect(() => {
    if (!auto_refresh || retryCount > 0) return;

    const interval = setInterval(() => {
      if (!loading && retryCount === 0) {
        console.log('🔄 Auto-refreshing products...');
        loadProducts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [auto_refresh, loading, loadProducts, retryCount]);

  return {
    products,
    collections,
    loading,
    error,
    cached,
    refresh,
    reload: loadProducts,
    refreshProducts: refresh // alias for backward compatibility
  };
}