import React, { useEffect, useState } from 'react';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';
import { PerformanceMonitor } from '@/utils/performanceOptimizer';

interface InstantPreloaderProps {
  children: React.ReactNode;
  enablePreloading?: boolean;
}

/**
 * Invisible preloader that warms up the search cache in the background
 * Ensures instant search results for users
 */
export const InstantPreloader: React.FC<InstantPreloaderProps> = ({
  children,
  enablePreloading = true
}) => {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (!enablePreloading) return;

    const preloadProducts = async () => {
      try {
        console.log('🚀 Starting instant preloader...');
        const startTime = performance.now();

        // Preload main product index
        await optimizedUltraFastSearch.searchProductsInstant('', { limit: 2000 });

        // Preload key collections for instant switching
        const keyCollections = [
          'tailgate-beer',
          'seltzer-collection', 
          'cocktail-kits',
          'spirits',
          'mixers-non-alcoholic'
        ];

        await optimizedUltraFastSearch.preloadCollections(keyCollections);

        // Preload common search terms
        const commonSearches = [
          'beer', 'wine', 'spirits', 'cocktail', 'mixer', 
          'coors', 'bud', 'corona', 'stella', 'modelo',
          'vodka', 'whiskey', 'tequila', 'rum', 'gin'
        ];

        for (const term of commonSearches) {
          await optimizedUltraFastSearch.searchProductsInstant(term, { limit: 20 });
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`✅ Instant preloader completed in ${duration.toFixed(2)}ms`);
        console.log('📊 Cache Stats:', optimizedUltraFastSearch.getCacheStats());

        setIsPreloaded(true);

        // Log performance metrics
        PerformanceMonitor.measure('instant-preloader', () => duration);

      } catch (error) {
        console.error('❌ Instant preloader failed:', error);
        setIsPreloaded(true); // Continue even if preloading fails
      }
    };

    preloadProducts();
  }, [enablePreloading]);

  return (
    <>
      {children}
      {enablePreloading && !isPreloaded && (
        <div style={{ display: 'none' }}>
          {/* Hidden preloader indicator for debugging */}
          <span data-testid="instant-preloader">Preloading...</span>
        </div>
      )}
    </>
  );
};