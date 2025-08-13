// Polyfill for require if needed
if (typeof window !== 'undefined' && !window.require) {
  (window as any).require = function() {
    throw new Error('require() is not available in browser environment');
  };
}

import { createRoot } from 'react-dom/client'
import TestSimple from './TestSimple'
import './index.css'

createRoot(document.getElementById("root")!).render(<TestSimple />)