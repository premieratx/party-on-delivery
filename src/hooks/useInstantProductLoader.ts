import { useState, useEffect, useCallback, useRef } from 'react';
import { useProductPreloader } from './useProductPreloader';
import { useUltraFastImageCache } from './useUltraFastImageCache';

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
  product_type?: string;
  search_category?: string;
}

export const useInstantProductLoader = (collectionHandle: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  
  const { preloadCollection, getFromCache } = useProductPreloader();
  const { preloadImages, getCachedImage } = useUltraFastImageCache();
  const lastCollectionRef = useRef<string>('');

  const loadProductsInstantly = useCallback(async () => {
    if (!collectionHandle || collectionHandle === lastCollectionRef.current) return;
    
    lastCollectionRef.current = collectionHandle;
    setLoading(true);
    setError(null);
    setImagesReady(false);

    try {
      console.log(`⚡ INSTANT LOAD: ${collectionHandle}`);
      
      // Try cache first for instant display
      const cachedProducts = getFromCache(collectionHandle);
      if (cachedProducts && cachedProducts.length > 0) {
        console.log(`⚡ CACHE HIT: ${cachedProducts.length} products`);
        
        // Apply cached images immediately
        const productsWithCachedImages = cachedProducts.map(product => ({
          ...product,
          image: getCachedImage(product.image)
        }));
        
        setProducts(productsWithCachedImages);
        setLoading(false);
        setImagesReady(true);
        
        // Background preload any missing images
        const imageUrls = cachedProducts.map(p => p.image).filter(Boolean);
        preloadImages(imageUrls).then(() => {
          // Update with fresh cached images
          const updatedProducts = cachedProducts.map(product => ({
            ...product,
            image: getCachedImage(product.image)
          }));
          setProducts(updatedProducts);
        });
        
        return;
      }

      // Load fresh data
      console.log(`⚡ FRESH LOAD: ${collectionHandle}`);
      const freshProducts = await preloadCollection(collectionHandle);
      
      if (lastCollectionRef.current !== collectionHandle) return; // Prevent race conditions
      
      setProducts(freshProducts);
      setLoading(false);
      
      // Preload all images for instant future access
      const imageUrls = freshProducts.map(p => p.image).filter(Boolean);
      console.log(`⚡ PRELOADING ${imageUrls.length} images`);
      
      await preloadImages(imageUrls);
      
      if (lastCollectionRef.current === collectionHandle) {
        // Update with cached images
        const productsWithCachedImages = freshProducts.map(product => ({
          ...product,
          image: getCachedImage(product.image)
        }));
        setProducts(productsWithCachedImages);
        setImagesReady(true);
        console.log(`⚡ IMAGES READY: ${collectionHandle}`);
      }
      
    } catch (err) {
      if (lastCollectionRef.current === collectionHandle) {
        console.error('⚡ INSTANT LOAD ERROR:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setLoading(false);
      }
    }
  }, [collectionHandle, preloadCollection, getFromCache, getCachedImage, preloadImages]);

  useEffect(() => {
    loadProductsInstantly();
  }, [loadProductsInstantly]);

  const refresh = useCallback(() => {
    lastCollectionRef.current = ''; // Reset to force reload
    loadProductsInstantly();
  }, [loadProductsInstantly]);

  return {
    products,
    loading,
    error,
    imagesReady,
    refresh,
    totalProducts: products.length
  };
};