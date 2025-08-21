// BULLETPROOF MAIN ENTRY - Build: 2025_08_19_FINAL
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import console cleanup utilities
import './utils/console-cleanup'

// Clear any cached references
if (typeof window !== 'undefined') {
  // Force clear any cached modules
  delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  // Clear any lovable tokens
  const url = new URL(window.location.href);
  if (url.searchParams.has('__lovable_token')) {
    url.searchParams.delete('__lovable_token');
    window.history.replaceState({}, '', url.toString());
  }
}

createRoot(document.getElementById("root")!).render(<App />);