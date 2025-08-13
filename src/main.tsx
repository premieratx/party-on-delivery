import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SpeedProvider } from '@/providers/SpeedProvider'
import { preloadManager } from '@/utils/preloadManager'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { initializePerformanceOptimizations } from '@/utils/performanceOptimizer'
import { initializeMobileOptimizations } from '@/utils/mobileOptimizations'
import { initializeTimezone } from './utils/timezoneManager'

// Start ultra-fast preloading immediately (skip on admin routes to avoid builder jank)
if (!window.location.pathname.startsWith('/admin')) {
  import('./utils/ultraFastLoader').then(({ ultraFastLoader }) => {
    ultraFastLoader.preloadEverything().catch(console.warn);
  });
}


// Start advanced cache manager
import('./utils/advancedCacheManager').then(({ advancedCacheManager }) => {
  console.log('🚀 Advanced cache manager initialized');
});

// Initialize existing preloading and cache management (skip on admin routes)
if (!window.location.pathname.startsWith('/admin')) {
  preloadManager.initialize();
}


// Initialize performance optimizations
initializePerformanceOptimizations();

// Initialize mobile-specific optimizations
initializeMobileOptimizations();

// Initialize CST timezone for the entire app
initializeTimezone();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <SpeedProvider>
      <App />
    </SpeedProvider>
  </ErrorBoundary>
);
