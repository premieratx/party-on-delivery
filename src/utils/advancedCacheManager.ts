// COMPLETELY DISABLED - This file was causing preloading issues
// DO NOT RESTORE - use direct database queries instead

export const advancedCacheManager = {
  preloadEverything: () => Promise.resolve(),
  loadProducts: () => Promise.resolve([]),
  clearCache: () => {},
};

console.log('🚫 AdvancedCacheManager DISABLED - No preloading');