import { useEffect, useMemo } from 'react';
import { ImageOptimizer } from '@/utils/imageOptimizer';
import { ViewportOptimizer } from '@/utils/performanceOptimizer';

export function useImageOptimization(imageUrl: string, priority = false) {
  const isMobile = ViewportOptimizer.isMobile();
  
  const optimizedUrls = useMemo(() => {
    if (!imageUrl) return { src: '', mobile: '', tablet: '', desktop: '' };
    
    const responsive = ImageOptimizer.getResponsiveImageUrls(imageUrl);
    return {
      src: isMobile ? responsive.mobile : responsive.desktop,
      ...responsive
    };
  }, [imageUrl, isMobile]);

  // Preload priority images with faster timeout
  useEffect(() => {
    if (priority && optimizedUrls.src) {
      ImageOptimizer.preloadImage(optimizedUrls.src, 150).catch(() => {
        // Silent fail for speed
      });
    }
  }, [optimizedUrls.src, priority]);

  return optimizedUrls;
}