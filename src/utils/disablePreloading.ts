// COMPLETE PRELOADING DISABLER v2025_01_14_21_20
// This file exists solely to force a new build and disable all preloading

console.log('🚫 ALL PRELOADING DISABLED - Build v2025_01_14_21_20');

// Block any attempts to initialize preloading
if (typeof window !== 'undefined') {
  (window as any).preloadingDisabled = true;
  (window as any).initializePreloading = () => {
    console.log('🚫 Preloading blocked');
  };
  (window as any).preloadApp = () => {
    console.log('🚫 App preloading blocked');
  };
  (window as any).loadAppConfig = () => {
    console.log('🚫 App config loading blocked');
    return Promise.resolve(null);
  };
}

export const PRELOADING_DISABLED = true;
export const BUILD_VERSION = '2025_01_14_21_30_NO_SPINNER';