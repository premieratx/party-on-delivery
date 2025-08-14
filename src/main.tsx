// NUCLEAR OPTION v2025_01_14_21_30 - DESTROY ALL PRELOADING
import './utils/completeSystemBlocker';
import './utils/disablePreloading';
import './utils/preloadingTest';

// OVERRIDE WINDOW PRELOADING IMMEDIATELY
if (typeof window !== 'undefined') {
  // Destroy all preloading functions
  (window as any).initializePreloading = () => console.log('🚫 BLOCKED');
  (window as any).preloadApp = () => console.log('🚫 BLOCKED');
  (window as any).loadAppConfig = () => Promise.resolve(null);
  (window as any).ultraFastLoader = null;
  (window as any).instantAppLoader = null;
  (window as any).preloadManager = null;
  
  // Block network requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (
      url.includes('delivery_apps') ||
      url.includes('party-planner') ||
      url.includes('standard-delivery') ||
      url.includes('instant-product-cache') ||
      url.includes('lightning-sync') ||
      url.includes('get-all-collections')
    )) {
      console.log('🚫 NUCLEAR BLOCK:', url);
      return Promise.reject(new Error('NUCLEAR BLOCKED'));
    }
    return originalFetch.apply(this, args);
  };
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);