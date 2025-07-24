import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadManager } from '@/utils/preloadManager'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Initialize preloading and cache management
preloadManager.initialize();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
