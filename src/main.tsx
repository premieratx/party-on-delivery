import React from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneCoverPage from './pages/StandaloneCoverPage';
import './index.css';

// Check if this is a cover page route and render directly without all the app wrapper bullshit
if (window.location.pathname === '/premier-concierge' || window.location.pathname.startsWith('/cover/')) {
  console.log('🎯 Rendering cover page directly, bypassing ALL app wrapper bullshit');
  
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<StandaloneCoverPage />);
  }
} else {
  // Render the full app for everything else
  console.log('🏠 Rendering full app with all providers');
  
  import('./App').then((AppModule) => {
    const App = AppModule.default;
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  });
}