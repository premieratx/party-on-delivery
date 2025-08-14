// SELF-TEST SYSTEM v2025_01_14_21_25

export const runPreloadingTest = () => {
  console.log('🧪 RUNNING PRELOADING ELIMINATION TEST...');
  
  const results = {
    windowPreloadingBlocked: false,
    fetchBlocked: false,
    collectionsDisabled: false,
    instantCacheDisabled: false,
    buildVersion: ''
  };
  
  // Test 1: Check window preloading functions are blocked
  if (typeof window !== 'undefined') {
    const hasPreloading = !!(
      (window as any).initializePreloading ||
      (window as any).preloadApp ||
      (window as any).ultraFastLoader ||
      (window as any).instantAppLoader
    );
    results.windowPreloadingBlocked = !hasPreloading || !!(window as any).preloadingDisabled;
  }
  
  // Test 2: Check if fetch is blocked for preloading URLs
  const testUrls = [
    'delivery_apps',
    'party-planner',
    'standard-delivery',
    'instant-product-cache',
    'get-all-collections'
  ];
  
  let blockedCount = 0;
  testUrls.forEach(url => {
    try {
      window.fetch(`test-${url}`).catch(() => blockedCount++);
    } catch {
      blockedCount++;
    }
  });
  results.fetchBlocked = blockedCount === testUrls.length;
  
  // Test 3: Check collections loading is disabled
  import('../utils/instantCacheClient').then(cache => {
    const products = cache.getInstantProducts();
    products.then(result => {
      results.collectionsDisabled = result.products.length === 0;
    });
  });
  
  results.buildVersion = '2025_01_14_21_25_NUCLEAR';
  
  console.log('🧪 PRELOADING TEST RESULTS:', results);
  
  const success = Object.values(results).every(val => val === true || val === '2025_01_14_21_25_NUCLEAR');
  
  if (success) {
    console.log('✅ ALL PRELOADING SUCCESSFULLY ELIMINATED!');
  } else {
    console.error('❌ PRELOADING STILL DETECTED:', results);
  }
  
  return results;
};

// Auto-run test
if (typeof window !== 'undefined') {
  setTimeout(runPreloadingTest, 1000);
}

export default runPreloadingTest;