import { useEffect } from 'react';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';

/**
 * Hook to pre-warm the product search index on app startup
 * Ensures instant search without delays
 */
export const useProductPreloader = () => {
  useEffect(() => {
    const preloadProducts = async () => {
      try {
        console.log('🚀 Pre-warming product search index on app start...');
        
        // Trigger index warming - this will load all 1067+ products
        await optimizedUltraFastSearch.searchProductsInstant('', { limit: 1 });
        
        console.log('✅ Product search index pre-warmed and ready for instant search');
      } catch (error) {
        console.error('❌ Failed to pre-warm product index:', error);
      }
    };

    // Small delay to let the app initialize first
    const timer = setTimeout(preloadProducts, 100);
    return () => clearTimeout(timer);
  }, []);

  // Return empty object to satisfy expectations
  return {};
};