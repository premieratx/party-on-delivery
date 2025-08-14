import React, { useState, useEffect } from 'react';
import { NetworkOptimizer, PerformanceMonitor } from '@/utils/performanceOptimizer';
import { ProductSkeleton } from './ProductSkeleton';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  enableMetrics?: boolean;
}

export function ProgressiveLoader({
  children,
  fallback,
  delay = 0,
  enableMetrics = false
}: ProgressiveLoaderProps) {
  const [isReady, setIsReady] = useState(delay === 0);
  const [startTime] = useState(() => performance.now());

  useEffect(() => {
    if (delay === 0) return;

    // Adjust delay based on network speed
    const networkDelay = NetworkOptimizer.isSlowConnection() ? delay * 1.5 : delay;
    
    const timer = setTimeout(() => {
      setIsReady(true);
      
      if (enableMetrics) {
        const loadTime = performance.now() - startTime;
        PerformanceMonitor.measureAsync('progressive-loader', async () => loadTime);
      }
    }, networkDelay);

    return () => clearTimeout(timer);
  }, [delay, startTime, enableMetrics]);

  if (!isReady) {
    return fallback ? <>{fallback}</> : <ProductSkeleton count={6} />;
  }

  return <>{children}</>;
}