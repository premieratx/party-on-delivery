import { useEffect, useCallback } from 'react';
import { 
  initializePerformanceOptimizations, 
  MemoryManager,
  ViewportOptimizer,
  TouchOptimizer 
} from '@/utils/performanceOptimizer';

export function usePerformanceOptimization() {
  useEffect(() => {
    initializePerformanceOptimizations();
  }, []);

  const optimizeElement = useCallback((element: HTMLElement) => {
    if (ViewportOptimizer.isMobile) {
      TouchOptimizer.optimizeTouch();
    }
  }, []);

  const scheduleCleanup = useCallback((cleanupFn: () => void) => {
    MemoryManager.addCleanup(cleanupFn);
  }, []);

  return {
    optimizeElement,
    scheduleCleanup,
    isMobile: ViewportOptimizer.isMobile,
    isTablet: ViewportOptimizer.isTablet,
    isDesktop: ViewportOptimizer.isDesktop
  };
}