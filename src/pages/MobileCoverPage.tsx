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
  
  // Get slug from URL - completely standalone
  const getSlugFromPath = () => {
    const path = window.location.pathname;
    console.log('🔍 Mobile Cover Page - Full pathname:', path);
    
    // Handle /cover/slug format
    if (path.startsWith('/cover/')) {
      const slug = path.replace('/cover/', '');
      console.log('📄 Cover route slug:', slug);
      return slug;
    }
    
    // Handle direct slug format like /premier-concierge
    const slug = path.replace(/^\//, ''); // Remove leading slash only
    console.log('📄 Direct slug for mobile:', slug);
    return slug;
  };
  
  const slug = getSlugFromPath();
  
  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        console.log('🚀 Fetching cover page for slug:', slug);
        setIsLoading(true);
        setError(null);
        
        if (!slug || slug === '') {
          console.log('❌ No slug provided');
          setError('No page specified');
          setIsLoading(false);
          return;
        }
        
        // Direct fetch to Supabase REST API - completely standalone
        const apiUrl = `https://acmlfzfliqupwxwoefdq.supabase.co/rest/v1/cover_pages?slug=eq.${slug}&is_active=eq.true&select=*`;
        console.log('📡 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data && data.length > 0) {
          console.log('✅ Cover page found:', data[0]);
          setCoverPage(data[0]);
        } else {
          console.log('❌ No cover page found for slug:', slug);
          setError('Page not found');
        }
      } catch (err) {
        console.error('💥 Error fetching cover page:', err);
        setError('Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoverPage();
  }, [slug]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-5"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error || !coverPage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="text-center p-5">
          <h1 className="text-2xl mb-4">Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <p className="text-sm mt-2 opacity-70">Slug: {slug}</p>
        </div>
      </div>
    );
  }
  
  // Parse features/checklist safely
  const parseFeatures = (checklist: any) => {
    if (!checklist) return [];
    
    if (Array.isArray(checklist)) {
      return checklist;
    }
    
    if (typeof checklist === 'string') {
      try {
        return JSON.parse(checklist);
      } catch {
        return [];
      }
    }
    
    return [];
  };
  
  // Parse buttons safely  
  const parseButtons = (buttons: any) => {
    if (!buttons) return [];
    
    if (Array.isArray(buttons)) {
      return buttons;
    }
    
    if (typeof buttons === 'string') {
      try {
        return JSON.parse(buttons);
      } catch {
        return [];
      }
    }
    
    return [];
  };
  
  // Parse styles safely
  const parseStyles = (styles: any) => {
    if (!styles) return {};
    
    if (typeof styles === 'object' && styles !== null) {
      return styles;
    }
    
    if (typeof styles === 'string') {
      try {
        return JSON.parse(styles);
      } catch {
        return {};
      }
    }
    
    return {};
  };
  
  const features = parseFeatures(coverPage.checklist);
  const buttons = parseButtons(coverPage.buttons);
  const styles = parseStyles(coverPage.styles);
  
  // Get variant styles based on theme
  const getVariantStyles = () => {
    const variant = coverPage.theme || styles.variant || 'default';
    
    switch (variant) {
      case 'luxury':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          accent: '#c9a96e',
          text: '#ffffff'
        };
      case 'vibrant':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          accent: '#ffffff',
          text: '#ffffff'
        };
      case 'minimal':
        return {
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          accent: '#2c3e50',
          text: '#2c3e50'
        };
      case 'ocean':
        return {
          background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
          accent: '#38bdf8',
          text: '#ffffff'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          accent: '#3b82f6',
          text: '#ffffff'
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: styles.backgroundColor || variantStyles.background,
      color: styles.textColor || variantStyles.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Video */}
      {coverPage.bg_video_url && (
        <video
          autoPlay
          loop
          muted
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
      
      {/* Background Image */}
      {!coverPage.bg_video_url && coverPage.bg_image_url && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${coverPage.bg_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 1
          }}
        />
      )}
      
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 2
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        {coverPage.logo_url && (
          <img
            src={coverPage.logo_url}
            alt="Logo"
            style={{
              maxWidth: '120px',
              height: 'auto',
              marginBottom: '30px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}
          />
        )}
        
        {/* Title - responsive font size */}
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {coverPage.title}
        </h1>
        
        {/* Subtitle - responsive font size */}
        {coverPage.subtitle && (
          <p style={{
            fontSize: 'clamp(18px, 4vw, 24px)',
            marginBottom: '40px',
            opacity: 0.9,
            maxWidth: '600px',
            lineHeight: '1.4',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            {coverPage.subtitle}
          </p>
        )}
        
        {/* Features - responsive grid */}
        {features.length > 0 && (
          <div style={{
            marginBottom: '40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
            gap: '20px',
            maxWidth: '800px',
            width: '100%'
          }}>
            {features.map((feature: any, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '24px',
                  marginBottom: '12px'
                }}>
                  {feature.emoji || '✓'}
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {feature.title || feature.text || feature}
                </h3>
                {feature.description && (
                  <p style={{
                    fontSize: '14px',
                    opacity: 0.8,
                    lineHeight: '1.4'
                  }}>
                    {feature.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Buttons - responsive layout */}
        {buttons.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            width: '100%'
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
                  border: button.variant === 'outline' 
                    ? `2px solid ${variantStyles.accent}` 
                    : 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '280px',
                  maxWidth: '400px',
                  backgroundColor: button.variant === 'outline' 
                    ? 'transparent' 
                    : variantStyles.accent,
                  color: button.variant === 'outline' 
                    ? variantStyles.accent 
                    : (variantStyles.accent === '#ffffff' ? '#000000' : '#ffffff'),
                  backdropFilter: button.variant === 'outline' ? 'blur(10px)' : 'none',
                  textShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  if (button.variant === 'outline') {
                    e.currentTarget.style.backgroundColor = variantStyles.accent;
                    e.currentTarget.style.color = variantStyles.accent === '#ffffff' ? '#000000' : '#ffffff';
                  } else {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (button.variant === 'outline') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = variantStyles.accent;
                  } else {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {button.text || button.label || 'Click Here'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}