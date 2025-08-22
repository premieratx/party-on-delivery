import React from 'react';

export default function BasicCoverPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 50px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#1f2937'
        }}>
          Premier Concierge
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#6b7280', 
          marginBottom: '30px' 
        }}>
          You're Set for The Weekend
        </p>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px', padding: '15px', background: '#f3f4f6', borderRadius: '10px' }}>
            ⭐ Austin's Go-To Beverage Delivery
          </div>
          <div style={{ marginBottom: '15px', padding: '15px', background: '#f3f4f6', borderRadius: '10px' }}>
            🚀 Same-Day Cocktail Kit Delivery
          </div>
          <div style={{ marginBottom: '15px', padding: '15px', background: '#f3f4f6', borderRadius: '10px' }}>
            💎 Trip Planning Consultation Included!
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => window.open('/checkout', '_blank')}
          >
            Direct-to-Boat Delivery
          </button>
          
          <button 
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => window.open('/checkout', '_blank')}
          >
            Airbnb Delivery & Concierge
          </button>
        </div>
      </div>
    </div>
  );
}