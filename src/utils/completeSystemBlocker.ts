// FORCE CLEAN BUILD - REMOVE ALL POSTHOG AND PRELOADING
// Build timestamp: 2025_01_14_20_41_FINAL

// Block everything immediately
if (typeof window !== 'undefined') {
  // Disable all PostHog
  (window as any).posthog = undefined;
  (window as any).PostHog = undefined;
  
  // Disable analytics
  (window as any).analytics = undefined;
  (window as any).gtag = undefined;
  
  // Block preloading console messages
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('⚡') || msg.includes('🚀') || msg.includes('✅') || 
        msg.includes('Preloading') || msg.includes('PostHog') || 
        msg.includes('delivery apps') || msg.includes('instant')) {
      return;
    }
    originalLog.apply(console, args);
  };
  
  console.error = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('PostHog') || msg.includes('capture call')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export {};