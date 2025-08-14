// ULTIMATE NUCLEAR DESTRUCTION v2025_01_14_21_35 - ABSOLUTE ANNIHILATION
import './utils/completeSystemBlocker';
import './utils/disablePreloading';
import './utils/preloadingTest';

// TOTAL ANNIHILATION OF ALL PRELOADING SYSTEMS
if (typeof window !== 'undefined') {
  console.log('🚫🚫🚫 ULTIMATE NUCLEAR OPTION ACTIVATED 🚫🚫🚫');
  
  // Nuclear destruction of all preloading
  const nukeFunctions = () => {
    // Destroy preloading functions
    delete (window as any).initializePreloading;
    delete (window as any).preloadApp;
    delete (window as any).loadAppConfig;
    delete (window as any).ultraFastLoader;
    delete (window as any).instantAppLoader;
    delete (window as any).preloadManager;
    delete (window as any).preloadEverything;
    delete (window as any).preloadApps;
    
    // Override with blockers
    (window as any).initializePreloading = () => {
      console.log('🚫 NUCLEAR BLOCKED: initializePreloading');
      return Promise.resolve();
    };
    (window as any).preloadApp = () => {
      console.log('🚫 NUCLEAR BLOCKED: preloadApp');
      return Promise.resolve();
    };
    (window as any).loadAppConfig = () => {
      console.log('🚫 NUCLEAR BLOCKED: loadAppConfig');
      return Promise.resolve(null);
    };
    (window as any).ultraFastLoader = {
      preloadEverything: () => Promise.resolve(),
      loadProducts: () => Promise.resolve([])
    };
    (window as any).instantAppLoader = {
      preloadApp: () => Promise.resolve(),
      getConfig: () => Promise.resolve(null)
    };
  };
  
  // Execute immediately and every 10ms
  nukeFunctions();
  setInterval(nukeFunctions, 10);
  
  // Intercept and block ALL network requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string') {
      // Block all preloading related requests
      if (url.includes('delivery_apps') || 
          url.includes('party-planner') || 
          url.includes('premier-party-cruises') ||
          url.includes('standard-delivery') ||
          url.includes('instant-product-cache') ||
          url.includes('lightning-sync') ||
          url.includes('get-all-collections') ||
          url.includes('preload') ||
          url.includes('fetchShopifyProducts') ||
          url.includes('fetch-shopify-products')) {
        console.log('🚫🚫🚫 NUCLEAR NETWORK BLOCK:', url);
        return Promise.reject(new Error('NUCLEAR NETWORK BLOCKED: ' + url));
      }
    }
    return originalFetch.apply(this, args);
  };
  
  // Override console methods to hide preloading spam
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('Preloading') || 
        msg.includes('party-planner') || 
        msg.includes('standard-delivery') ||
        msg.includes('premier-party-cruises') ||
        msg.includes('⚡') ||
        msg.includes('🚀') ||
        msg.includes('✅ App preloaded') ||
        msg.includes('✅ Cached products')) {
      return; // Block spam
    }
    originalLog.apply(console, args);
  };
  console.error = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('party-planner') || 
        msg.includes('standard-delivery') ||
        msg.includes('premier-party-cruises') ||
        msg.includes('delivery_apps') ||
        msg.includes('preload')) {
      return; // Block error spam
    }
    originalError.apply(console, args);
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