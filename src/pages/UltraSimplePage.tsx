export default function UltraSimplePage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui'
    }}>
      <header style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
            🎉 Party On Delivery
          </h1>
          <button 
            onClick={() => window.location.href = '/admin'}
            style={{
              background: '#4a5568',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        </div>
      </header>

      <main style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <h2 style={{ 
            fontSize: '3rem',
            margin: '0 0 1rem 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#667eea'
          }}>
            Austin's Premier Party Delivery
          </h2>
          
          <p style={{ fontSize: '1.2rem', color: '#4a5568', marginBottom: '2rem' }}>
            Get your party essentials delivered in 30 minutes
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
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2rem' }}>🍺</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Beer & Wine</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2rem' }}>🍸</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Cocktails</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2rem' }}>🎈</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Party Supplies</div>
            </div>
          </div>
          
          <button 
            onClick={() => alert('Coming soon!')}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Start Your Order
          </button>
        </div>
      </main>

      <footer style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '1rem',
        textAlign: 'center',
        color: '#718096'
      }}>
        <p style={{ margin: 0 }}>
          Party On Delivery © 2024 | Austin, TX
        </p>
      </footer>
    </div>
  );
}