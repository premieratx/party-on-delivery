// COMPLETE PRELOADING DISABLER
// This file ensures all preloading systems are completely disabled

// Disable all console.log preloading messages and PostHog
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  const message = args.join(' ');
  // Block all preloading-related and PostHog console messages
  if (
    message.includes('⚡') ||
    message.includes('🚀 Preloading') ||
    message.includes('✅ App preloaded') ||
    message.includes('Ultra-fast load') ||
    message.includes('Collections preloaded') ||
    message.includes('Aggressive preloading') ||
    message.includes('Initializing instant app loader') ||
    message.includes('Cached products for') ||
    message.includes('Failed to load app config') ||
    message.includes('Lightning-fast') ||
    message.includes('Custom site mode') ||
    message.includes('ProductCategories: Fetching') ||
    message.includes('DeliveryCart pricing') ||
    message.includes('PostHog') ||
    message.includes('posthog')
  ) {
    return; // Block these messages
  }
  originalConsoleLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  // Block PostHog rate limiting errors
  if (
    message.includes('PostHog') ||
    message.includes('rate limiting') ||
    message.includes('capture call is ignored')
  ) {
    return; // Block these error messages
  }
  originalConsoleError.apply(console, args);
};

// Override any remaining preloading functions globally
(window as any).instantAppLoader = {
  preloadApp: () => Promise.resolve(),
  getAppConfig: () => null,
  clearCache: () => {},
};

(window as any).ultraFastLoader = {
  preloadEverything: () => Promise.resolve(),
  loadProducts: () => Promise.resolve([]),
  clearCache: () => {},
};

(window as any).performanceManager = {
  optimizeApp: () => Promise.resolve(),
  optimizeAppSwitching: () => Promise.resolve(),
  clearCache: () => {},
};

(window as any).preloadManager = {
  initialize: () => Promise.resolve(),
  preloadApp: () => Promise.resolve(),
  clearCache: () => {},
};

console.log('🚫 ALL PRELOADING SYSTEMS COMPLETELY DISABLED');