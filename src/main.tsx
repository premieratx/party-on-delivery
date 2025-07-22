import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadManager } from '@/utils/preloadManager'

// Initialize preloading and cache management
preloadManager.initialize();

createRoot(document.getElementById("root")!).render(<App />);
