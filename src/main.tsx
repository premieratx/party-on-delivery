import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

// Simple and clean entry point
const root = document.getElementById("root")!

// Try to load the app
try {
  import('./App.tsx').then(({ default: App }) => {
    createRoot(root).render(React.createElement(App))
  }).catch(error => {
    console.error('Failed to load app:', error)
    root.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>App failed to load</h1>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()">Reload</button>
      </div>
    `
  })
} catch (error) {
  console.error('Critical error:', error)
  root.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Critical Error</h1>
      <p>Error: ${error.message}</p>
      <button onclick="window.location.reload()">Reload</button>
    </div>
  `
}