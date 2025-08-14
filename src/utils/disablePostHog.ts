// COMPLETELY DISABLE POSTHOG TO PREVENT RATE LIMITING
// This file ensures PostHog is completely disabled across the entire app

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

console.log('🚫 PostHog COMPLETELY DISABLED - No analytics tracking');