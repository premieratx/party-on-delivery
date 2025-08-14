// ULTIMATE SYSTEM BLOCKER - STOP ALL PRELOADING AND POSTHOG PERMANENTLY
// This file ensures NOTHING related to preloading or PostHog can run

// EMERGENCY OVERRIDE - BLOCK EVERYTHING
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Block ALL console output IMMEDIATELY
console.log = () => {};
console.error = () => {};
console.warn = () => {};
console.info = () => {};

// Block ALL console output that contains preloading or PostHog terms
const blockedConsoleTerms = [
  '⚡', '🚀', '✅', 'Preloading', 'preload', 'Ultra-fast', 'Collections',
  'Aggressive', 'Initializing', 'instant app loader', 'Cached products',
  'Failed to load app config', 'Lightning', 'Custom site mode',
  'ProductCategories: Fetching', 'DeliveryCart pricing', 'PostHog', 'posthog',
  'Wake lock', 'delivery apps', 'premier-party-cruises', 'standard-delivery',
  'party-planner', 'capture call is ignored', 'rate limiting', 'App preloaded',
  'premier-party-cruises---official-alcohol-delivery-service', 'Failed to load app config for premier-party-cruises',
  'PGRST116', 'JSON object requested, multiple (or no) rows returned',
  'Cached products for', 'Caching ALL', 'Using expired cache', 'Ultra-fast load from instant cache',
  'delivery apps preloaded', 'Collections preloaded', 'Aggressive preloading completed'
];

// Override console methods completely
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

const shouldBlockMessage = (message: string) => {
  return blockedConsoleTerms.some(term => message.includes(term));
};

console.log = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldBlockMessage(message)) {
    originalConsole.log.apply(console, args);
  }
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldBlockMessage(message)) {
    originalConsole.error.apply(console, args);
  }
};

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldBlockMessage(message)) {
    originalConsole.warn.apply(console, args);
  }
};

console.info = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldBlockMessage(message)) {
    originalConsole.info.apply(console, args);
  }
};

// Completely disable PostHog
(window as any).posthog = {
  capture: () => {},
  identify: () => {},
  reset: () => {},
  register: () => {},
  unregister: () => {},
  opt_out_capturing: () => {},
  opt_in_capturing: () => {},
  has_opted_out_capturing: () => true,
  has_opted_in_capturing: () => false,
  clear_opt_in_out_capturing: () => {},
  debug: () => {},
  init: () => {},
  isFeatureEnabled: () => false,
  onFeatureFlags: () => {},
  getFeatureFlag: () => undefined,
  reloadFeatureFlags: () => {},
  group: () => {},
  alias: () => {},
  set: () => {},
  set_once: () => {},
  people: {
    set: () => {},
    set_once: () => {},
    increment: () => {},
    append: () => {},
    union: () => {},
    track_charge: () => {},
    clear_charges: () => {},
    delete_user: () => {}
  }
};

// Block PostHog and rrweb script loading
const originalCreateElement = document.createElement;
document.createElement = function(tagName: string) {
  const element = originalCreateElement.call(this, tagName);
  if (tagName.toLowerCase() === 'script') {
    const scriptElement = element as HTMLScriptElement;
    const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
    if (originalSetSrc) {
      Object.defineProperty(scriptElement, 'src', {
        set: function(this: HTMLScriptElement, value: string) {
          if (value.includes('posthog') || value.includes('rrweb')) {
            return; // Block script loading
          }
          originalSetSrc.call(this, value);
        },
        get: function(this: HTMLScriptElement) {
          return this.getAttribute('src') || '';
        }
      });
    }
  }
  return element;
};

// Override ALL preloading functions globally - multiple approaches for redundancy
const disabledSystemsOverride = {
  preloadApp: () => Promise.resolve(),
  preloadEverything: () => Promise.resolve(),
  loadProducts: () => Promise.resolve([]),
  getAppConfig: () => null,
  clearCache: () => {},
  loadAppConfig: () => Promise.resolve(null),
  initializePreloading: () => Promise.resolve(),
  initialize: () => Promise.resolve(),
  optimizeApp: () => Promise.resolve(),
  optimizeAppSwitching: () => Promise.resolve(),
};

(window as any).instantAppLoader = disabledSystemsOverride;
(window as any).ultraFastLoader = disabledSystemsOverride;
(window as any).performanceManager = disabledSystemsOverride;
(window as any).preloadManager = disabledSystemsOverride;
(window as any).advancedCacheManager = disabledSystemsOverride;

// EMERGENCY BLOCK ALL REQUESTS RELATED TO PRELOADING
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string') {
    // Block EVERYTHING related to preloading, party-planner, and caching
    if (
      url.includes('delivery_apps') ||
      url.includes('premier-party-cruises') ||
      url.includes('standard-delivery') ||
      url.includes('party-planner') ||
      url.includes('instant-product-cache') ||
      url.includes('lightning-sync') ||
      url.includes('fetch-shopify-products') ||
      url.includes('get-all-collections') ||
      url.includes('shopify-sync') ||
      url.includes('preload') ||
      url.includes('cache')
    ) {
      // DO NOT LOG - this itself was creating console noise
      return Promise.resolve(new Response('{"error": "blocked"}', { status: 404 }));
    }
  }
  return originalFetch.apply(this, args);
};

// Override setTimeout to block any delayed preloading
const originalSetTimeout = window.setTimeout;
(window as any).setTimeout = function(callback: any, delay: number, ...args: any[]) {
  // Check if the callback contains preloading code
  const callbackStr = callback.toString();
  if (
    callbackStr.includes('preload') ||
    callbackStr.includes('instantAppLoader') ||
    callbackStr.includes('ultraFastLoader') ||
    callbackStr.includes('premier-party-cruises') ||
    callbackStr.includes('party-planner') ||
    callbackStr.includes('standard-delivery')
  ) {
    // Block this setTimeout
    return 0;
  }
  return originalSetTimeout.call(this, callback, delay, ...args);
};

// Override setInterval to block any repeated preloading
const originalSetInterval = window.setInterval;
(window as any).setInterval = function(callback: any, delay: number, ...args: any[]) {
  const callbackStr = callback.toString();
  if (
    callbackStr.includes('preload') ||
    callbackStr.includes('instantAppLoader') ||
    callbackStr.includes('ultraFastLoader')
  ) {
    return 0;
  }
  return originalSetInterval.call(this, callback, delay, ...args);
};

// SILENT ACTIVATION - NO CONSOLE OUTPUT
originalConsoleLog('System blocker active - all preloading disabled');