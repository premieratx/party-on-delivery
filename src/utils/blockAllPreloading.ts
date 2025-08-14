// ULTIMATE PRELOADING BLOCKER - STOPS EVERYTHING
// This file completely blocks all preloading systems and PostHog

// Block all console output that we don't want
const blockedTerms = [
  '⚡', '🚀', '✅', 'Preloading', 'preload', 'Ultra-fast', 'Collections',
  'Aggressive', 'Initializing', 'instant app loader', 'Cached products',
  'Failed to load app config', 'Lightning', 'Custom site mode',
  'ProductCategories: Fetching', 'DeliveryCart pricing', 'PostHog', 'posthog',
  'Wake lock', 'delivery apps', 'premier-party-cruises', 'standard-delivery',
  'party-planner', 'capture call is ignored', 'rate limiting'
];

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args: any[]) => {
  const message = args.join(' ');
  if (blockedTerms.some(term => message.includes(term))) {
    return; // Block this message
  }
  originalConsoleLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (blockedTerms.some(term => message.includes(term))) {
    return; // Block this error
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  if (blockedTerms.some(term => message.includes(term))) {
    return; // Block this warning
  }
  originalConsoleWarn.apply(console, args);
};

// Override PostHog completely
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

// Override all preloading functions globally
(window as any).instantAppLoader = {
  preloadApp: () => Promise.resolve(),
  getAppConfig: () => null,
  clearCache: () => {},
  loadAppConfig: () => Promise.resolve(null),
  initializePreloading: () => Promise.resolve(),
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

// Block ALL requests to delivery_apps for preloading
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string') {
    if (url.includes('delivery_apps?select=*&slug=eq.premier-party-cruises') ||
        url.includes('delivery_apps?select=*&slug=eq.standard-delivery') ||
        url.includes('delivery_apps?select=*&slug=eq.party-planner')) {
      return Promise.resolve(new Response('{"error": "blocked"}', { status: 404 }));
    }
  }
  return originalFetch.apply(this, args);
};

console.log('🚫 ALL PRELOADING AND POSTHOG COMPLETELY BLOCKED');