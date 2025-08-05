import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadManager } from '@/utils/preloadManager'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { initializePerformanceOptimizations } from '@/utils/performanceOptimizer'
import { initializeMobileOptimizations } from '@/utils/mobileOptimizations'
import { initializeTimezone } from './utils/timezoneManager'

// Start ultra-fast preloading immediately
import('./utils/ultraFastLoader').then(({ ultraFastLoader }) => {
  // Start aggressive preloading as soon as possible
  ultraFastLoader.preloadEverything().catch(console.warn);
});

// Start advanced cache manager
import('./utils/advancedCacheManager').then(({ advancedCacheManager }) => {
  console.log('🚀 Advanced cache manager initialized');
});

// Initialize existing preloading and cache management
preloadManager.initialize();

// Initialize performance optimizations
initializePerformanceOptimizations();

// Initialize mobile-specific optimizations
initializeMobileOptimizations();

// Initialize CST timezone for the entire app
initializeTimezone();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
