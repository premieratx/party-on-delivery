import { useState, useEffect, useCallback } from 'react';

interface ImageCacheEntry {
  blob: string;
  loaded: boolean;
  error: boolean;
  timestamp: number;
}

// Global image cache - persists across component mounts
const globalImageCache = new Map<string, ImageCacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500; // Maximum images to cache

export const useUltraFastImageCache = () => {
  const [cacheStats, setCacheStats] = useState({ 
    size: globalImageCache.size, 
    hits: 0, 
    misses: 0 
  });

  const preloadImage = useCallback(async (url: string): Promise<string> => {
    if (!url) return '';

    // Check cache first
    const cached = globalImageCache.get(url);
    if (cached && !cached.error && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return cached.blob;
    }

    // Clean old entries if cache is full
    if (globalImageCache.size >= MAX_CACHE_SIZE) {
      const oldEntries = Array.from(globalImageCache.entries())
        .filter(([_, entry]) => Date.now() - entry.timestamp > CACHE_DURATION)
        .slice(0, 50); // Remove 50 oldest entries
      
      oldEntries.forEach(([key]) => globalImageCache.delete(key));
    }

    try {
      // Create new cache entry
      const entry: ImageCacheEntry = {
        blob: url, // Use original URL while loading
        loaded: false,
        error: false,
        timestamp: Date.now()
      };
      
      globalImageCache.set(url, entry);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1, size: globalImageCache.size }));

      // Start preloading
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Convert to blob URL for instant loading
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                const updatedEntry: ImageCacheEntry = {
                  blob: blobUrl,
                  loaded: true,
                  error: false,
                  timestamp: Date.now()
                };
                globalImageCache.set(url, updatedEntry);
                resolve(blobUrl);
              } else {
                resolve(url);
              }
            }, 'image/webp', 0.8);
          } else {
            resolve(url);
          }
        };

        img.onerror = () => {
          const errorEntry: ImageCacheEntry = {
            blob: url,
            loaded: false,
            error: true,
            timestamp: Date.now()
          };
          globalImageCache.set(url, errorEntry);
          resolve(url);
        };

        img.src = url;
      });
    } catch (error) {
      console.warn('Image preload failed:', error);
      return url;
    }
  }, []);

  const preloadImages = useCallback(async (urls: string[]) => {
    const promises = urls.filter(Boolean).map(url => preloadImage(url));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  const getCachedImage = useCallback((url: string): string => {
    const cached = globalImageCache.get(url);
    if (cached && !cached.error && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.blob;
    }
    return url;
  }, []);

  const clearCache = useCallback(() => {
    // Clean up blob URLs
    globalImageCache.forEach(entry => {
      if (entry.blob.startsWith('blob:')) {
        URL.revokeObjectURL(entry.blob);
      }
    });
    globalImageCache.clear();
    setCacheStats({ size: 0, hits: 0, misses: 0 });
  }, []);

  return {
    preloadImage,
    preloadImages,
    getCachedImage,
    clearCache,
    cacheStats
  };
};