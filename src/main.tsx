// FINAL BUILD - COMPLETE DESTRUCTION v2025_01_14_21_20
import './utils/completeSystemBlocker';
import './utils/disablePreloading';

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);