import React from "react";

const App = () => {
  console.log('🚀 BASIC APP LOADED');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'black', marginBottom: '16px' }}>
          HOMEPAGE FIXED!
        </h1>
        <p style={{ fontSize: '18px', color: 'gray' }}>
          Basic app is working
        </p>
        <a 
          href="/app/delivery" 
          style={{
            display: 'inline-block',
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          Go to Delivery App
        </a>
      </div>
    </div>
  );
};

export default App;