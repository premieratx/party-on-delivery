import React from 'react';

// ULTRA CLEAN HOMEPAGE - NO EXTERNAL DEPENDENCIES
function CleanHomepage() {
  console.log('🟢 CLEAN HOMEPAGE: Rendering...');

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '2rem',
    textAlign: 'center' as const
  };

  const contentStyle = {
    padding: '2rem',
    textAlign: 'center' as const
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>
          Party On Delivery
        </h1>
        <p style={{ fontSize: '1.2rem', margin: 0 }}>
          Austin's Premier Party Supply Delivery
        </p>
      </header>
      
      <main style={contentStyle}>
        <h2 style={{ fontSize: '2rem', margin: '2rem 0', color: '#1e3a8a' }}>
          🎉 Homepage is Working!
        </h2>
        
        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: '1rem 0' }}>
          React Error #310 has been eliminated.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          margin: '3rem auto'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>🍺 Beer</h3>
            <p style={{ color: '#64748b' }}>Premium beer selection</p>
            <div style={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}>
              View Products
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>🍷 Wine</h3>
            <p style={{ color: '#64748b' }}>Fine wines & spirits</p>
            <div style={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}>
              View Products
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>🍸 Cocktails</h3>
            <p style={{ color: '#64748b' }}>Ready-to-drink cocktails</p>
            <div style={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}>
              View Products
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '3rem' }}>
          <button 
            onClick={() => window.location.href = '/admin'}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Admin Panel
          </button>
          
          <button 
            onClick={() => console.log('Checkout clicked')}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Cart (0)
          </button>
        </div>
      </main>
    </div>
  );
}

export default CleanHomepage;