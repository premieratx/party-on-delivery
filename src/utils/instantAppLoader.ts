// COMPLETELY DISABLED - This file was causing preloading issues
// DO NOT RESTORE - use direct database queries instead

export const instantAppLoader = {
  preloadApp: () => Promise.resolve(),
  getAppConfig: () => null,
  clearCache: () => {},
};

console.log('🚫 InstantAppLoader DISABLED - No preloading');