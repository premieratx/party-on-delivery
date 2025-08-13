import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SpeedProvider } from '@/providers/SpeedProvider'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <SpeedProvider>
      <App />
    </SpeedProvider>
  </ErrorBoundary>
);
