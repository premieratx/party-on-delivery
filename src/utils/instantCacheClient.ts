// COMPLETELY DISABLED - FORCE BUILD REFRESH v2025_01_14_21_10
// NO PRELOADING - CLEAN DELIVERY APP ONLY

export const getInstantProducts = () => {
  console.log('🚫 Instant products DISABLED');
  return Promise.resolve({ products: [], collections: [] });
};

export const getAllCollectionsCached = () => {
  console.log('🚫 Collections cache DISABLED');
  return Promise.resolve([]);
};

// Force build refresh: BUILD_VERSION_2025_01_14_21_10_FINAL