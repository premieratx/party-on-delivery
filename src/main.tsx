// Test 3: Test React rendering
import './index.css'
import { createRoot } from 'react-dom/client'
import React from 'react'

console.log('Main.tsx with React rendering executing');

const SimpleComponent = () => (
  <div style={{ padding: '20px' }}>
    <h1>React Rendering Test</h1>
    <p>Testing if React rendering causes the require error</p>
  </div>
);

createRoot(document.getElementById("root")!).render(<SimpleComponent />);