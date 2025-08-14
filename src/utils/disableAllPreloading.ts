// COMPLETE PRELOADING DISABLER
// This file ensures all preloading systems are completely disabled

// Disable all console.log preloading messages
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const message = args.join(' ');
  // Block all preloading-related console messages
  if (
    message.includes('⚡') ||
    message.includes('🚀 Preloading') ||
    message.includes('✅ App preloaded') ||
    message.includes('Ultra-fast load') ||
    message.includes('Collections preloaded') ||
    message.includes('Aggressive preloading') ||
    message.includes('Initializing instant app loader') ||
    message.includes('Cached products for') ||
    message.includes('Failed to load app config')
  ) {
    return; // Block these messages
  }
  originalConsoleLog.apply(console, args);
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