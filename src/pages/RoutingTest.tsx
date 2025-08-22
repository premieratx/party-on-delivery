import React from 'react';

export default function RoutingTest() {
  const currentPath = window.location.pathname;
  const currentURL = window.location.href;
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>ROUTING DEBUG</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Current URL:</strong> {currentURL}</p>
        <p><strong>Current Path:</strong> {currentPath}</p>
        <p><strong>Time:</strong> {new Date().toISOString()}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Links:</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/basic" style={{ color: 'blue' }}>Go to /basic</a>
          <a href="/test-cover" style={{ color: 'blue' }}>Go to /test-cover</a>
          <a href="/premier-concierge" style={{ color: 'blue' }}>Go to /premier-concierge</a>
        </div>
      </div>
      
      <div>
        <h2>Expected Routes:</h2>
        <ul>
          <li>/basic - Basic cover page</li>
          <li>/test-cover - Database test</li>
          <li>/premier-concierge - Cover page slug</li>
        </ul>
      </div>
    </div>
  );
}