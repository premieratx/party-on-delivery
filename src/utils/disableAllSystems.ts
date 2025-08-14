// NUCLEAR OPTION - DISABLE EVERYTHING THAT CAUSES PRELOADING AND POSTHOG
// This file ensures all systems are completely disabled

// Disable all console.log preloading messages and PostHog
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args: any[]) => {
  const message = args.join(' ');
  // Block all preloading-related and PostHog console messages
  if (
    message.includes('⚡') ||
    message.includes('🚀') ||
    message.includes('✅') ||
    message.includes('Preloading') ||
    message.includes('preload') ||
    message.includes('Ultra-fast') ||
    message.includes('Collections') ||
    message.includes('Aggressive') ||
    message.includes('Initializing') ||
    message.includes('Cached products') ||
    message.includes('Failed to load app config') ||
    message.includes('Lightning') ||
    message.includes('Custom site mode') ||
    message.includes('ProductCategories: Fetching') ||
    message.includes('DeliveryCart pricing') ||
    message.includes('PostHog') ||
    message.includes('posthog') ||
    message.includes('Wake lock') ||
    message.includes('delivery apps')
  ) {
    return; // Block these messages
  }
  originalConsoleLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args.join(' ');
  // Block PostHog and preloading errors
  if (
    message.includes('PostHog') ||
    message.includes('rate limiting') ||
    message.includes('capture call is ignored') ||
    message.includes('preload') ||
    message.includes('instant app loader')
  ) {
    return; // Block these error messages
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  // Block PostHog and preloading warnings
  if (
    message.includes('PostHog') ||
    message.includes('preload') ||
    message.includes('instant app')
  ) {
    return; // Block these warning messages
  }
  originalConsoleWarn.apply(console, args);
};

// Override PostHog globally
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

// Block PostHog script loading
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
            console.log('🚫 Blocked PostHog script:', value);
            return;
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

console.log('🚫 ALL SYSTEMS COMPLETELY DISABLED - NO PRELOADING OR ANALYTICS');