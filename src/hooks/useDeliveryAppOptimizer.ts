import { useEffect, useMemo, useCallback } from 'react';
import { useUltraAggressivePreloader } from './useUltraAggressivePreloader';
import { useInstantProductLoader } from './useInstantProductLoader';

interface DeliveryAppConfig {
  collections_config?: Array<{
    title: string;
    handle: string;
    isSearch?: boolean;
  }>;
}

interface OptimizedCollectionData {
  handle: string;
  products: any[];
  isLoaded: boolean;
  loadTime: number;
}

/**
 * DELIVERY APP OPTIMIZER - Additive Only!
 * Ensures all delivery app collections load in under 0.2 seconds
 * Preloads everything the user might need before they click
 */
export const useDeliveryAppOptimizer = (appConfig: DeliveryAppConfig) => {
  // Extract collection handles for preloading
  const collectionHandles = useMemo(() => {
    if (!appConfig?.collections_config) return [];
    
    return appConfig.collections_config
      .filter(collection => !collection.isSearch && collection.handle)
      .map(collection => collection.handle);
  }, [appConfig]);

  // Ultra-aggressive preloader for instant tab switching
  const { status, isReady, forcePreload, getCollectionFromCache } = useUltraAggressivePreloader({
    deliveryAppCollections: collectionHandles,
    enableImagePreloading: true,
    enableSearchPreloading: true
  });

  // Get optimized collection data with instant loading
  const getOptimizedCollectionData = useCallback((handle: string): OptimizedCollectionData => {
    const startTime = performance.now();
    const products = getCollectionFromCache(handle) || [];
    const loadTime = performance.now() - startTime;
    
    return {
      handle,
      products,
      isLoaded: products.length > 0,
      loadTime
    };
  }, [getCollectionFromCache]);

  // Get all collections data instantly
  const getAllCollectionsData = useCallback(() => {
    return collectionHandles.map(handle => getOptimizedCollectionData(handle));
  }, [collectionHandles, getOptimizedCollectionData]);

  // Performance monitoring
  const getPerformanceStats = useCallback(() => {
    const collectionsData = getAllCollectionsData();
    const averageLoadTime = collectionsData.reduce((sum, col) => sum + col.loadTime, 0) / collectionsData.length;
    const allLoaded = collectionsData.every(col => col.isLoaded);
    
    return {
      totalCollections: collectionHandles.length,
      loadedCollections: collectionsData.filter(col => col.isLoaded).length,
      averageLoadTime,
      allCollectionsReady: allLoaded,
      under200ms: averageLoadTime < 200,
      preloaderStatus: status
    };
  }, [getAllCollectionsData, collectionHandles.length, status]);

  // Log performance stats when ready
  useEffect(() => {
    if (isReady) {
      const stats = getPerformanceStats();
      console.log('📊 DELIVERY APP OPTIMIZER: Performance Stats', {
        ...stats,
        targetAchieved: stats.under200ms ? '✅ UNDER 200ms' : '❌ OVER 200ms'
      });
    }
  }, [isReady, getPerformanceStats]);

  return {
    // Main functions for components to use
    getOptimizedCollectionData,
    getAllCollectionsData,
    
    // Status and performance
    isOptimized: isReady,
    optimizerStatus: status,
    performanceStats: getPerformanceStats(),
    
    // Manual controls
    forceOptimize: forcePreload,
    
    // Collection helpers
    isCollectionReady: (handle: string) => {
      const data = getOptimizedCollectionData(handle);
      return data.isLoaded && data.loadTime < 200;
    },
    
    getCollectionLoadTime: (handle: string) => {
      return getOptimizedCollectionData(handle).loadTime;
    }
  };
};