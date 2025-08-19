import React from 'react';

// Ultra-simple test page to verify React is working
const SimplePage = () => {
  console.log('🏠 SIMPLE PAGE: Rendering...');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1e40af',
          marginBottom: '16px'
        }}>
          🎉 React is Working!
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '24px'
        }}>
          Simple page loaded successfully
        </p>
        <button 
          onClick={() => console.log('Button clicked!')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default SimplePage;