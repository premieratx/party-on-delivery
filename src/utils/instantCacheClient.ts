// COMPLETE SYSTEM SHUTDOWN v2025_01_14_21_25
// ALL PRELOADING DISABLED

export const getInstantProducts = () => {
  console.log('🚫 Instant products DISABLED');
  return Promise.resolve({ products: [], collections: [] });
};

export const getAllCollectionsCached = () => {
  console.log('🚫 Collections cache DISABLED');
  return Promise.resolve([]);
};

// Force disable all cache functions
export const getCachedCollections = () => Promise.resolve([]);
export const setCachedCollections = () => {};
export const clearCachedCollections = () => {};

// Build version to force cache invalidation
export const BUILD_VERSION = '2025_01_14_21_25_NUCLEAR';