import React from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneCoverPage from './pages/StandaloneCoverPage';
import './index.css';

// Check if this is a cover page route and render directly
const pathname = window.location.pathname;
const isCoverPage = pathname === '/premier-concierge' || pathname.startsWith('/cover/');

if (isCoverPage) {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<StandaloneCoverPage />);
  }
} else {
  // Render the full app for everything else
  import('./App').then((AppModule) => {
    const App = AppModule.default;
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  });
}