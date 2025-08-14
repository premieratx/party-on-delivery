// COMPLETELY DISABLED - This file was causing party-planner preloading issues
// DO NOT RESTORE - use direct database queries instead

export const preloadManager = {
  initialize: () => Promise.resolve(),
  preloadApp: () => Promise.resolve(),
  clearCache: () => {},
};

console.log('🚫 PreloadManager DISABLED - No preloading');