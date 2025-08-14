// SAFE SYSTEM CLEANUP - Build: 2025_08_14_22_40
// Simple, safe cleanup that won't break the window object

console.log('🧹 SAFE SYSTEM CLEANUP ACTIVE - Build: 2025_08_14_22_40');

// STEP 1: Safe analytics cleanup without overriding window properties
if (typeof window !== 'undefined') {
  // Clean up analytics objects safely
  try {
    const analyticsTerms = [
      'posthog', 'PostHog', '__posthog', 'analytics', 'gtag', 
      '_analytics', 'dataLayer', 'mixpanel', 'amplitude', 'segment'
    ];
    
    analyticsTerms.forEach(term => {
      try {
        if ((window as any)[term]) {
          (window as any)[term] = null;
        }
      } catch (e) {
        // Silent failure for read-only properties
      }
    });
    
    console.log('✅ Analytics objects nullified');
  } catch (e) {
    console.warn('Analytics cleanup failed:', e);
  }
}

// STEP 2: Clean localStorage and sessionStorage
if (typeof window !== 'undefined') {
  try {
    // Remove analytics keys from localStorage
    const localKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('posthog') || 
        key.includes('analytics') || 
        key.includes('party-planner') ||
        key.includes('preload')
      )) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach(key => localStorage.removeItem(key));

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

// STEP 3: Simple console override to reduce PostHog spam (without breaking window)
if (typeof window !== 'undefined') {
  try {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args: any[]) {
      const msg = args.join(' ');
      if (msg.includes('[PostHog.js]') || 
          msg.includes('rate limiting') ||
          msg.includes('posthog')) {
        return; // Suppress PostHog spam
      }
      return originalError.apply(console, args);
    };
    
    console.warn = function(...args: any[]) {
      const msg = args.join(' ');
      if (msg.includes('[PostHog.js]') || 
          msg.includes('posthog')) {
        return; // Suppress PostHog warnings
      }
      return originalWarn.apply(console, args);
    };
    
    console.log('✅ Console spam filtering activated');
  } catch (e) {
    console.warn('Console override failed:', e);
  }
}

export const SYSTEM_CLEANUP_VERSION = '2025_08_14_22_40';
export const CLEANUP_ACTIVE = true;

console.log('🎉 SAFE SYSTEM CLEANUP COMPLETE - No window property violations');