// NUCLEAR DESTRUCTION v2025_01_14_21_30_NO_SPINNER

if (typeof window !== 'undefined') {
  console.log('🚫 NUCLEAR SYSTEM BLOCKER ACTIVATED');
  
  // Destroy everything immediately
  const nuclearDestroy = () => {
    // Analytics destruction
    delete (window as any).posthog;
    delete (window as any).PostHog;
    delete (window as any).__posthog;
    delete (window as any).analytics;
    delete (window as any).gtag;
    
    // Preloading destruction
    delete (window as any).initializePreloading;
    delete (window as any).preloadApp;
    delete (window as any).loadAppConfig;
    delete (window as any).ultraFastLoader;
    delete (window as any).instantAppLoader;
    delete (window as any).preloadManager;
    
    // Set blockers
    (window as any).preloadingDisabled = true;
    (window as any).nuclearMode = true;
    
    // Override functions
    (window as any).initializePreloading = () => console.log('🚫 NUCLEAR BLOCKED');
    (window as any).preloadApp = () => console.log('🚫 NUCLEAR BLOCKED');
    (window as any).loadAppConfig = () => Promise.resolve(null);
  };
  
  // Execute immediately and repeatedly
  nuclearDestroy();
  setInterval(nuclearDestroy, 25); // Every 25ms
  
  // Block console spam
  const origError = console.error;
  console.error = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('PostHog') || 
        msg.includes('party-planner') || 
        msg.includes('standard-delivery') ||
        msg.includes('delivery_apps') ||
        msg.includes('preload') ||
        msg.includes('rate limit')) {
      return;
    }
    origError.apply(console, args);
  };
}

export {};