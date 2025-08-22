import React, { useState, useEffect } from 'react';

interface CoverPageData {
  title: string;
  subtitle: string;
  logo_url?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist?: any[];
  buttons?: any[];
  styles?: any;
  theme?: string;
}

export default function MobileCoverPage() {
  const [coverPage, setCoverPage] = useState<CoverPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get slug from URL
  const slug = window.location.pathname.replace('/', '');
  
  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Direct fetch to Supabase REST API - no dependencies
        const response = await fetch(
          `https://acmlfzfliqupwxwoefdq.supabase.co/rest/v1/cover_pages?slug=eq.${slug}&is_active=eq.true&select=*`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
              'Range': '0-0'
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoverPage(data[0]);
        } else {
          setError('Page not found');
        }
      } catch (err) {
        console.error('Error fetching cover page:', err);
        setError('Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (slug) {
      fetchCoverPage();
    } else {
      setError('No page specified');
      setIsLoading(false);
    }
  }, [slug]);
  
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  
  if (error || !coverPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  
  // Parse data safely
  const features = Array.isArray(coverPage.checklist) 
    ? coverPage.checklist 
    : (coverPage.checklist ? JSON.parse(coverPage.checklist as string || '[]') : []);
    
  const buttons = Array.isArray(coverPage.buttons) 
    ? coverPage.buttons 
    : (coverPage.buttons ? JSON.parse(coverPage.buttons as string || '[]') : []);
    
  const styles = typeof coverPage.styles === 'object' && coverPage.styles !== null
    ? coverPage.styles 
    : (coverPage.styles ? JSON.parse(coverPage.styles as string || '{}') : {});
  
  const variant = styles.variant || coverPage.theme || 'gold';
  
  // Get colors based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          accent: '#ffd700',
          text: '#ffffff'
        };
      case 'luxury':
        return {
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%)',
          accent: '#e6e6fa',
          text: '#ffffff'
        };
      default: // gold
        return {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%)',
          accent: '#ffd700',
          text: '#ffffff'
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: variantStyles.background,
      color: variantStyles.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Image/Video */}
      {coverPage.bg_video_url && (
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
        >
          <source src={coverPage.bg_video_url} type="video/mp4" />
        </video>
      )}
      
      {coverPage.bg_image_url && !coverPage.bg_video_url && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${coverPage.bg_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
      )}
      
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        {coverPage.logo_url && (
          <img
            src={coverPage.logo_url}
            alt="Logo"
            style={{
              maxWidth: '150px',
              maxHeight: '150px',
              marginBottom: '30px',
              borderRadius: '12px'
            }}
          />
        )}
        
        {/* Title */}
        <h1 style={{
          fontSize: window.innerWidth < 768 ? '32px' : '48px',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.2',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          {coverPage.title}
        </h1>
        
        {/* Subtitle */}
        {coverPage.subtitle && (
          <p style={{
            fontSize: window.innerWidth < 768 ? '18px' : '24px',
            marginBottom: '40px',
            opacity: 0.9,
            maxWidth: '600px',
            lineHeight: '1.4'
          }}>
            {coverPage.subtitle}
          </p>
        )}
        
        {/* Features */}
        {features.length > 0 && (
          <div style={{
            marginBottom: '40px',
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            maxWidth: '800px',
            width: '100%'
          }}>
            {features.map((feature: any, index: number) => (
              <div key={index} style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${variantStyles.accent}40`
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '10px'
                }}>
                  {typeof feature === 'string' ? '⭐' : feature.emoji || '⭐'}
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: variantStyles.accent
                }}>
                  {typeof feature === 'string' ? feature : feature.title || feature}
                </h3>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  lineHeight: '1.4'
                }}>
                  {typeof feature === 'string' ? 'Premium feature' : feature.description || 'Premium feature'}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Buttons */}
        {buttons.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {buttons.map((button: any, index: number) => (
              <button
                key={index}
                onClick={() => {
                  if (button.url) {
                    window.open(button.url, '_blank');
                  }
                }}
                style={{
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: window.innerWidth < 768 ? '280px' : 'auto',
                  backgroundColor: button.variant === 'outline' 
                    ? 'transparent' 
                    : variantStyles.accent,
                  color: button.variant === 'outline' 
                    ? variantStyles.accent 
                    : '#000',
                  ...(button.variant === 'outline' 
                    ? { border: `2px solid ${variantStyles.accent}` }
                    : { border: 'none' })
                }}
                onMouseOver={(e) => {
                  if (button.variant === 'outline') {
                    e.currentTarget.style.backgroundColor = variantStyles.accent;
                    e.currentTarget.style.color = '#000';
                  } else {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 25px ${variantStyles.accent}40`;
                  }
                }}
                onMouseOut={(e) => {
                  if (button.variant === 'outline') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = variantStyles.accent;
                  } else {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {button.text || button.label || 'Get Started'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}