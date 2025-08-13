// Test 4: Test App import and rendering
import './index.css'
import { createRoot } from 'react-dom/client'
import React from 'react'

console.log('About to import App component...');

// This import will tell us if the error is in App.tsx or its dependencies
import App from './App'

console.log('App imported successfully, about to render...');

createRoot(document.getElementById("root")!).render(<App />);