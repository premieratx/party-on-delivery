import { useState, useEffect, useCallback } from 'react';

interface ImagePreloadOptions {
  priority?: boolean;
  fallback?: string;
}

interface ImagePreloadResult {
  loaded: boolean;
  error: boolean;
  src: string;
}

/**
 * Hook to preload images with instant loading and fallback support
 */
export const useImagePreloader = (
  imageSrc: string | undefined | null, 
  options: ImagePreloadOptions = {}
): ImagePreloadResult => {
  const [state, setState] = useState<ImagePreloadResult>({
    loaded: false,
    error: false,
    src: options.fallback || ''
  });

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setState(prev => ({ ...prev, loaded: true, error: false, src }));
        resolve();
      };
      
      img.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          loaded: false, 
          error: true, 
          src: options.fallback || prev.src 
        }));
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }, [options.fallback]);

  useEffect(() => {
    if (!imageSrc) {
      setState({
        loaded: false,
        error: false,
        src: options.fallback || ''
      });
      return;
    }

    // Reset state for new image
    setState(prev => ({ ...prev, loaded: false, error: false }));
    
    // Start preloading
    preloadImage(imageSrc).catch(console.error);
    
  }, [imageSrc, preloadImage, options.fallback]);

  return state;
};

/**
 * Hook to preload multiple images
 */
export const useMultiImagePreloader = (
  imageSrcs: (string | undefined | null)[]
): Record<string, ImagePreloadResult> => {
  const [results, setResults] = useState<Record<string, ImagePreloadResult>>({});

  useEffect(() => {
    const validSrcs = imageSrcs.filter(Boolean) as string[];
    
    validSrcs.forEach(src => {
      setResults(prev => ({
        ...prev,
        [src]: { loaded: false, error: false, src: '' }
      }));

      const img = new Image();
      
      img.onload = () => {
        setResults(prev => ({
          ...prev,
          [src]: { loaded: true, error: false, src }
        }));
      };
      
      img.onerror = () => {
        setResults(prev => ({
          ...prev,
          [src]: { loaded: false, error: true, src: '' }
        }));
      };
      
      img.src = src;
    });
  }, [imageSrcs]);

  return results;
};

/**
 * Utility function to preload critical images immediately
 */
export const preloadCriticalImages = (imageSrcs: string[]): Promise<void[]> => {
  const promises = imageSrcs.map(src => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
      img.src = src;
    });
  });

  return Promise.all(promises);
};