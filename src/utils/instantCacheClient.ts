// COMPLETELY DISABLED - FORCE BUILD REFRESH v3
export const getInstantProducts = () => {
  return Promise.resolve({ products: [], collections: [] });
};

export const getAllCollectionsCached = () => {
  return Promise.resolve([]);
};

// Block any attempts to call instant cache functions
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (
      url.includes('instant-product-cache') ||
      url.includes('lightning-sync') ||
      url.includes('fetch-shopify-products') ||
      url.includes('get-all-collections') ||
      url.includes('delivery_apps') ||
      url.includes('delivery_app_variations')
    )) {
      console.log('🚫 BLOCKED preloading request:', url);
      return Promise.resolve(new Response('{"products":[],"collections":[]}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return originalFetch.apply(this, args);
  };
}

// Force build refresh: BUILD_VERSION_2025_01_14_21_00_FINAL