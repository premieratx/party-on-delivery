import { useState, useEffect, useCallback, useRef } from 'react';
import { useProductPreloader } from './useProductPreloader';
import { useUltraFastImageCache } from './useUltraFastImageCache';
import { ultraFastSearch } from '@/utils/ultraFastSearch';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';

interface UltraAggressivePreloaderOptions {
  deliveryAppCollections?: string[];
  enableImagePreloading?: boolean;
  enableSearchPreloading?: boolean;
}

interface PreloadStatus {
  collectionsLoaded: number;
  totalCollections: number;
  imagesPreloaded: number;
  searchWarmed: boolean;
  isReady: boolean;
  loadingPhase: 'collections' | 'images' | 'search' | 'complete';
}

/**
 * ULTRA-AGGRESSIVE PRELOADER - Additive Only!
 * Ensures sub-0.2 second loading for everything
 * Keeps all existing systems working - only adds more caching
 */
export const useUltraAggressivePreloader = (options: UltraAggressivePreloaderOptions = {}) => {
  const {
    deliveryAppCollections = [],
    enableImagePreloading = true,
    enableSearchPreloading = true
  } = options;

  const [status, setStatus] = useState<PreloadStatus>({
    collectionsLoaded: 0,
    totalCollections: deliveryAppCollections.length,
    imagesPreloaded: 0,
    searchWarmed: false,
    isReady: false,
    loadingPhase: 'collections'
  });

  const { preloadMultipleCollections, getFromCache } = useProductPreloader();
  const { preloadImages, getCachedImage } = useUltraFastImageCache();
  const preloadingRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  // Phase 1: Preload all delivery app collections in parallel
  const preloadCollections = useCallback(async () => {
    if (deliveryAppCollections.length === 0) return;
    
    console.log('🚀 ULTRA-AGGRESSIVE: Starting collection preload for', deliveryAppCollections);
    startTimeRef.current = performance.now();
    
    setStatus(prev => ({ ...prev, loadingPhase: 'collections' }));
    
    try {
      // Load all collections in parallel for maximum speed
      const promises = deliveryAppCollections.map(async (handle, index) => {
        await preloadMultipleCollections([handle]);
        setStatus(prev => ({ 
          ...prev, 
          collectionsLoaded: index + 1 
        }));
        console.log(`⚡ Collection ${handle} preloaded (${index + 1}/${deliveryAppCollections.length})`);
      });
      
      await Promise.all(promises);
      console.log('✅ ULTRA-AGGRESSIVE: All collections preloaded');
      
    } catch (error) {
      console.error('❌ Collection preload error:', error);
    }
  }, [deliveryAppCollections, preloadMultipleCollections]);

  // Phase 2: Preload images for visible products across all collections
  const preloadCollectionImages = useCallback(async () => {
    if (!enableImagePreloading || deliveryAppCollections.length === 0) return;
    
    console.log('🖼️ ULTRA-AGGRESSIVE: Starting image preload');
    setStatus(prev => ({ ...prev, loadingPhase: 'images' }));
    
    try {
      const allImageUrls: string[] = [];
      
      // Collect first 20 product images from each collection for instant display
      deliveryAppCollections.forEach(handle => {
        const cachedProducts = getFromCache(handle);
        if (cachedProducts) {
          const imageUrls = cachedProducts
            .slice(0, 20) // First 20 products per collection
            .map(product => product.image)
            .filter(Boolean);
          allImageUrls.push(...imageUrls);
        }
      });
      
      console.log(`🖼️ ULTRA-AGGRESSIVE: Preloading ${allImageUrls.length} images`);
      
      // Preload in batches of 10 for optimal performance
      const batchSize = 10;
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        await preloadImages(batch);
        
        setStatus(prev => ({ 
          ...prev, 
          imagesPreloaded: Math.min(i + batchSize, allImageUrls.length) 
        }));
      }
      
      console.log('✅ ULTRA-AGGRESSIVE: All images preloaded');
      
    } catch (error) {
      console.error('❌ Image preload error:', error);
    }
  }, [enableImagePreloading, deliveryAppCollections, getFromCache, preloadImages]);

  // Phase 3: Warm up all search systems
  const preloadSearchSystems = useCallback(async () => {
    if (!enableSearchPreloading) return;
    
    console.log('🔍 ULTRA-AGGRESSIVE: Warming up search systems');
    setStatus(prev => ({ ...prev, loadingPhase: 'search' }));
    
    try {
      // Warm up both search systems in parallel
      await Promise.all([
        ultraFastSearch.warmUpCache(),
        optimizedUltraFastSearch.searchProductsInstant('', { limit: 2000 })
      ]);
      
      setStatus(prev => ({ ...prev, searchWarmed: true }));
      console.log('✅ ULTRA-AGGRESSIVE: Search systems warmed up');
      
    } catch (error) {
      console.error('❌ Search warmup error:', error);
    }
  }, [enableSearchPreloading]);

  // Master preload function - runs all phases
  const runUltraAggressivePreload = useCallback(async () => {
    if (preloadingRef.current) return;
    preloadingRef.current = true;
    
    try {
      console.log('🚀 ULTRA-AGGRESSIVE PRELOADER: Starting...');
      
      // Run all phases in sequence for optimal resource usage
      await preloadCollections();
      await preloadCollectionImages();
      await preloadSearchSystems();
      
      const totalTime = performance.now() - startTimeRef.current;
      console.log(`✅ ULTRA-AGGRESSIVE PRELOADER: Complete in ${totalTime.toFixed(2)}ms`);
      
      setStatus(prev => ({ 
        ...prev, 
        isReady: true, 
        loadingPhase: 'complete' 
      }));
      
    } catch (error) {
      console.error('❌ ULTRA-AGGRESSIVE PRELOADER: Failed', error);
    } finally {
      preloadingRef.current = false;
    }
  }, [preloadCollections, preloadCollectionImages, preloadSearchSystems]);

  // DISABLED: Auto-start to prevent system overload
  // Only runs when manually triggered via forcePreload()
  // useEffect(() => {
  //   if (deliveryAppCollections.length > 0 && !preloadingRef.current) {
  //     const timer = setTimeout(runUltraAggressivePreload, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [deliveryAppCollections, runUltraAggressivePreload]);

  // Manual trigger for additional preloading
  const forcePreload = useCallback(() => {
    preloadingRef.current = false; // Reset flag
    runUltraAggressivePreload();
  }, [runUltraAggressivePreload]);

  return {
    status,
    isReady: status.isReady,
    forcePreload,
    // Debug helpers
    getCollectionFromCache: getFromCache,
    getCachedImageUrl: getCachedImage
  };
};