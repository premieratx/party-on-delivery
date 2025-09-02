import React, { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ADMIN PERFORMANCE FIX
 * 
 * This component addresses the core performance issues:
 * 1. Edge function cold starts
 * 2. Excessive re-renders
 * 3. Memory leaks from uncleared intervals
 * 4. Redundant API calls
 */

interface AdminPerformanceFixProps {
  children: React.ReactNode;
}

export const AdminPerformanceFix: React.FC<AdminPerformanceFixProps> = ({ children }) => {
  const performanceRef = useRef({
    isWarmedUp: false,
    lastWarmup: 0,
    intervals: new Set<NodeJS.Timeout>()
  });

  // Optimized function warming - only when needed
  const warmUpFunctions = useCallback(async () => {
    const now = Date.now();
    const WARMUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    if (performanceRef.current.isWarmedUp && 
        now - performanceRef.current.lastWarmup < WARMUP_INTERVAL) {
      return; // Skip if recently warmed
    }

    try {
      console.log('🔥 Performance: Warming critical functions...');
      
      // Only warm the essential functions
      await Promise.allSettled([
        supabase.functions.invoke('get-dashboard-data', { 
          body: { type: 'admin', quick: true } 
        }),
        supabase.functions.invoke('get-all-collections', { 
          body: { quick: true } 
        })
      ]);
      
      performanceRef.current.isWarmedUp = true;
      performanceRef.current.lastWarmup = now;
      console.log('✅ Performance: Functions warmed successfully');
      
    } catch (error) {
      console.warn('⚠️ Performance: Warmup failed, continuing normally:', error);
    }
  }, []);

  // Memory leak prevention
  useEffect(() => {
    // Clear any existing intervals
    performanceRef.current.intervals.forEach(clearInterval);
    performanceRef.current.intervals.clear();

    // Warm up immediately
    warmUpFunctions();

    // Set up periodic warmup (less frequent) - DISABLED TO PREVENT PAGE RELOADING
    // const warmupInterval = setInterval(warmUpFunctions, 10 * 60 * 1000); // 10 minutes - DISABLED
    // performanceRef.current.intervals.add(warmupInterval); // DISABLED

    return () => {
      // Cleanup all intervals
      performanceRef.current.intervals.forEach(clearInterval);
      performanceRef.current.intervals.clear();
    };
  }, [warmUpFunctions]);

  return <>{children}</>;
};

/**
 * HOC to prevent excessive re-renders in admin components
 */
export const withAdminOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  displayName = 'OptimizedAdminComponent'
) => {
  const OptimizedComponent = React.memo((props: P) => {
    return <Component {...props} />;
  });

  OptimizedComponent.displayName = displayName;
  return OptimizedComponent;
};

/**
 * Hook for optimized data loading
 */
export const useOptimizedDataLoad = () => {
  const loadingRef = useRef(false);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  const loadData = useCallback(async (
    key: string,
    loadFn: () => Promise<any>,
    cacheTime = 2 * 60 * 1000 // 2 minutes
  ) => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      console.log('🚦 Performance: Skipping duplicate load for', key);
      return;
    }

    // Check cache
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      console.log('⚡ Performance: Using cached data for', key);
      return cached.data;
    }

    try {
      loadingRef.current = true;
      const data = await loadFn();
      
      // Cache the result
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  return { loadData };
};

export default AdminPerformanceFix;