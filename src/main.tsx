// Test 2: Add React imports
import './index.css'
import { createRoot } from 'react-dom/client'
import React from 'react'

console.log('Main.tsx with React imports executing');

document.getElementById("root")!.innerHTML = `
  <div style="padding: 20px;">
    <h1>React Import Test</h1>
    <p>Testing if React imports cause the require error</p>
  </div>
`;