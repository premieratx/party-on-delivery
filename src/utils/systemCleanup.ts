// FINAL SYSTEM CLEANUP - Build: 2025_08_14_22_35
// Complete elimination of PostHog, analytics, and party planner references

console.log('🧹 FINAL SYSTEM CLEANUP ACTIVE - Build: 2025_08_14_22_35');

// STEP 1: Block ALL analytics and tracking globally
if (typeof window !== 'undefined') {
  // Nuclear analytics destruction
  const analyticsTerms = [
    'posthog', 'PostHog', '__posthog', 'analytics', 'gtag', 
    '_analytics', 'dataLayer', 'mixpanel', 'amplitude', 'segment'
  ];
  
  analyticsTerms.forEach(term => {
    try {
      delete (window as any)[term];
      (window as any)[term] = null;
    } catch (e) {
      // Silent failure
    }
  });

  // Block analytics script injection
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName: string) {
    const element = originalCreateElement.call(this, tagName);
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'src' && (
          value.includes('posthog') || 
          value.includes('analytics') ||
          value.includes('gtag') ||
          value.includes('mixpanel')
        )) {
          console.log('🚫 Blocked analytics script:', value);
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    return element;
  };

  console.log('✅ Analytics blocking system activated');
}

// STEP 2: Clean localStorage and sessionStorage
if (typeof window !== 'undefined') {
  try {
    // Remove analytics keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('posthog') || 
        key.includes('analytics') || 
        key.includes('party-planner') ||
        key.includes('preload')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clean sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('posthog') || 
        key.includes('analytics') || 
        key.includes('party-planner')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    console.log('✅ Storage cleanup completed');
  } catch (e) {
    console.warn('Storage cleanup failed:', e);
  }
}

// STEP 3: Override fetch for analytics URLs
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Block analytics URLs
    if (url.includes('posthog') || 
        url.includes('analytics') || 
        url.includes('mixpanel') ||
        url.includes('segment.io')) {
      console.log('🚫 Blocked analytics request:', url);
      return Promise.reject(new Error('Analytics blocked by system cleanup'));
    }
    
    return originalFetch.call(this, input, init);
  };
  
  console.log('✅ Fetch blocking system activated');
}

// STEP 4: Clean up any remaining timers
if (typeof window !== 'undefined') {
  // Override setInterval to prevent analytics timers
  const originalSetInterval = window.setInterval;
  window.setInterval = function(callback: TimerHandler, delay?: number, ...args: any[]) {
    const callbackStr = callback.toString();
    if (callbackStr.includes('posthog') || 
        callbackStr.includes('analytics') ||
        callbackStr.includes('tracking')) {
      console.log('🚫 Blocked analytics timer');
      return 0; // Return fake timer ID
    }
    return originalSetInterval.call(this, callback, delay, ...args);
  } as typeof setInterval;
  
  console.log('✅ Timer blocking system activated');
}

export const SYSTEM_CLEANUP_VERSION = '2025_08_14_22_35';
export const CLEANUP_ACTIVE = true;

console.log('🎉 SYSTEM CLEANUP COMPLETE - All analytics and preloading eliminated');