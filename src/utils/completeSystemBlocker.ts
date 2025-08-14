// FINAL DESTRUCTION - NO PRELOADING v2025_01_14_21_15

if (typeof window !== 'undefined') {
  // Kill PostHog permanently
  (window as any).posthog = null;
  (window as any).PostHog = null;
  (window as any).analytics = null;
  (window as any).gtag = null;
  
  // Block console spam
  const origError = console.error;
  console.error = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('PostHog') || msg.includes('capture call') || msg.includes('rate limit')) {
      return;
    }
    origError.apply(console, args);
  };
}

export {};