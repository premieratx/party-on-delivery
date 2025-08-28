import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 MAIN.TSX STARTING');

const container = document.getElementById('root');
console.log('🚀 Container found:', !!container);

if (container) {
  const root = createRoot(container);
  root.render(<App />);
  console.log('🚀 REACT APP RENDERED');
} else {
  console.error('❌ NO ROOT CONTAINER');
  document.body.innerHTML = '<h1 style="color: red;">ROOT CONTAINER NOT FOUND</h1>';
}