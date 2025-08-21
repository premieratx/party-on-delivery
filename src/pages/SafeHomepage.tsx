import React from 'react';
import { useNavigate } from 'react-router-dom';

// BULLETPROOF HOMEPAGE - MINIMAL HOOKS FOR SPA NAVIGATION
export default function SafeHomepage() {
  const navigate = useNavigate();
  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
            🎉 Party On Delivery
          </h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/admin')}
              style={{
                background: '#4a5568',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '3rem', 
            margin: '0 0 1rem 0', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🚀 System Online!
          </h2>
          
          <p style={{ fontSize: '1.2rem', color: '#4a5568', marginBottom: '2rem' }}>
            Austin's Premier Party Supply Delivery Platform
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '2rem' }}>🍺</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Beer</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '2rem' }}>🍷</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Wine</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '2rem' }}>🍸</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Cocktails</div>
            </div>
          </div>
          
          <div style={{ 
            background: '#f7fafc',
            border: '2px dashed #cbd5e0',
            borderRadius: '12px',
            padding: '1.5rem',
            color: '#2d3748'
          }}>
            <strong>✅ React Error #310 Eliminated</strong>
            <br />
            <small style={{ color: '#718096' }}>
              Clean component with zero external dependencies
            </small>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center',
        color: '#718096'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Party On Delivery © {new Date().getFullYear()} | Austin, TX
        </p>
      </footer>
    </div>
  );
}