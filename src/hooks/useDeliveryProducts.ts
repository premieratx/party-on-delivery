import { useOptimizedProductLoader } from './useOptimizedProductLoader';

interface DeliveryProductsOptions {
  category?: string;
  collection_handle?: string;
  app_slug?: string;
  lightweight?: boolean;
  auto_refresh?: boolean;
}

/**
 * Hook for delivery app functionality - uses Shopify collections for tab organization
 */
export function useDeliveryProducts(options: DeliveryProductsOptions = {}) {
  const result = useOptimizedProductLoader({
    ...options,
    use_type: 'delivery',
    category: options.category,
    collection_handle: options.collection_handle
  });

  return {
    ...result,
    deliveryCollections: result.collections, // Rename for clarity
    getProductsByCollection: (collectionHandle: string) => {
      // Implementation for getting products by collection
      return result.products.filter(product => 
        product.collection_handles?.includes(collectionHandle)
      );
    }
  };
}