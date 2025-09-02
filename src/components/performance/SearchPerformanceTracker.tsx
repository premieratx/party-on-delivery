import React, { useEffect } from 'react';
import { searchPerformanceOptimizer } from '@/utils/searchPerformanceOptimizer';

interface SearchPerformanceTrackerProps {
  children: React.ReactNode;
  enableReporting?: boolean;
  reportInterval?: number; // minutes
}

/**
 * Performance tracker that monitors search performance and reports metrics
 */
export const SearchPerformanceTracker: React.FC<SearchPerformanceTrackerProps> = ({
  children,
  enableReporting = false,
  reportInterval = 5
}) => {
  useEffect(() => {
    if (!enableReporting) return;

    const interval = setInterval(() => {
      searchPerformanceOptimizer.generatePerformanceReport();
    }, reportInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [enableReporting, reportInterval]);

  useEffect(() => {
    // Initial performance check
    if (enableReporting) {
      console.log('🚀 Search Performance Tracker initialized');
    }
  }, [enableReporting]);

  return <>{children}</>;
};