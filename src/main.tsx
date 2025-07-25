import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadManager } from '@/utils/preloadManager'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { initializePerformanceOptimizations } from '@/utils/performanceOptimizer'
import { initializeMobileOptimizations } from '@/utils/mobileOptimizations'

// Initialize preloading and cache management
preloadManager.initialize();

// Initialize performance optimizations
initializePerformanceOptimizations();

// Initialize mobile-specific optimizations
initializeMobileOptimizations();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
