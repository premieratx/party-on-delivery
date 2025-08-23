import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CoverPageData {
  title: string;
  subtitle: string;
  logo_url?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist?: any;
  buttons?: any;
  styles?: any;
  theme?: string;
}

export default function StandaloneCoverPage() {
  const [coverPage, setCoverPage] = useState<CoverPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Force slug to premier-concierge for mobile
  const slug = 'premier-concierge';
  
  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        console.log('🚀 STANDALONE: Starting fetch for slug:', slug);
        console.log('🌐 STANDALONE: Current URL:', window.location.href);
        setIsLoading(true);
        setError(null);
        
        // Use Supabase client instead of direct fetch
        console.log('📡 STANDALONE: Using Supabase client to fetch...');
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true);
        
        console.log('📊 STANDALONE Supabase response:', { data, error });
        
        if (error) {
          console.error('❌ STANDALONE Supabase error:', error);
          throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (data && data.length > 0) {
          console.log('✅ STANDALONE Cover page found:', data[0]);
          setCoverPage(data[0]);
        } else {
          console.log('❌ STANDALONE No cover page found for slug:', slug);
          console.log('❌ STANDALONE Data was:', JSON.stringify(data));
          setError('Page not found');
        }
      } catch (err) {
        console.error('💥 STANDALONE Error details:', err);
        console.error('💥 STANDALONE Error message:', err?.message);
        console.error('💥 STANDALONE Error stack:', err?.stack);
        setError(`Failed to load page: ${err?.message}`);
      } finally {
        console.log('🏁 STANDALONE Setting loading to false');
        setIsLoading(false);
      }
    };
    
    fetchCoverPage();
  }, []);
  
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p>Loading...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }
  
  if (error || !coverPage) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Slug: {slug}</p>
        </div>
      </div>
    );
  }
  
  // Parse features/checklist safely
  const parseFeatures = (checklist: any) => {
    if (!checklist) return [];
    if (Array.isArray(checklist)) return checklist;
    if (typeof checklist === 'string') {
      try { return JSON.parse(checklist); } catch { return []; }
    }
    return [];
  };
  
  // Parse buttons safely  
  const parseButtons = (buttons: any) => {
    if (!buttons) return [];
    if (Array.isArray(buttons)) return buttons;
    if (typeof buttons === 'string') {
      try { return JSON.parse(buttons); } catch { return []; }
    }
    return [];
  };
  
  // Parse styles safely
  const parseStyles = (styles: any) => {
    if (!styles) return {};
    if (typeof styles === 'object' && styles !== null) return styles;
    if (typeof styles === 'string') {
      try { return JSON.parse(styles); } catch { return {}; }
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
        
        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {coverPage.title}
        </h1>
        
        {/* Subtitle */}
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
        
        {/* Features */}
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
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>
                  {feature.emoji || '✓'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {feature.title || feature.text || feature}
                </h3>
                {feature.description && (
                  <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.4' }}>
                    {feature.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Buttons */}
        {buttons.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
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