// CLEAN MAIN ENTRY - Build: 2025_08_19_STABLE
import './utils/systemCleanup'; // Safe cleanup first
import './utils/tokenCleanup'; // Remove interfering tokens

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RobustErrorBoundary } from './components/common/RobustErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <RobustErrorBoundary>
    <App />
  </RobustErrorBoundary>
);