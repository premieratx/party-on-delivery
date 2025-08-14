// LOAD SYSTEM BLOCKER FIRST - BEFORE ANYTHING ELSE
import './utils/completeSystemBlocker';

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);