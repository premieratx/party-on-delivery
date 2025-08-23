import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UNIFIED_THEMES, applyUnifiedTheme, resetUnifiedTheme } from '@/utils/unifiedThemes';

export default function CoverPage() {
  const { slug } = useParams<{ slug: string }>();
  const pageSlug = slug || 'premier-concierge';
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        console.log('📱 Loading page for slug:', pageSlug);
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', pageSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (!data) {
          console.error('❌ No page found for slug:', pageSlug);
          throw new Error(`No page found for slug: ${pageSlug}`);
        }
        
        console.log('✅ Page data loaded:', data);
        setPageData(data);

        // Apply theme when page loads
        if (data.unified_theme || data.theme) {
          const themeId = data.unified_theme || `${data.theme}_modern`;
          const theme = UNIFIED_THEMES.find(t => t.id === themeId);
          if (theme) {
            applyUnifiedTheme(theme);
          }
        }
      } catch (err: any) {
        console.error('💥 Failed to load page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();

    // Cleanup theme on unmount
    return () => {
      resetUnifiedTheme();
    };
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-yellow-800 font-medium">Loading your page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="text-center max-w-md bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Could Not Load Page</h1>
          <p className="text-red-600 mb-4">Slug: <code className="bg-red-100 px-2 py-1 rounded">{pageSlug}</code></p>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Parse JSON strings from database correctly
  const parseJsonData = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse JSON:', data);
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  };
  
  const features = parseJsonData(pageData.checklist);
  const buttons = parseJsonData(pageData.buttons);
  const title = pageData.title || 'Welcome';
  const subtitle = pageData.subtitle || '';
  const logoUrl = pageData.logo_url || '';
  
  // Parse and apply the saved styles
  const savedStyles = pageData.styles || {};
  const theme = pageData.theme || pageData.unified_theme || 'gold';
  
  console.log('🎨 STYLES DATA:');
  console.log('Theme:', theme);
  console.log('Saved styles:', savedStyles);
  
  // Apply the exact sizing from saved styles
  const logoSize = savedStyles.sizing?.logoSize || 149;
  const headlineSize = savedStyles.sizing?.headlineSize || 34;
  const subtitleSize = savedStyles.sizing?.subtitleSize || 20;
  
  // Apply positioning
  const logoVerticalPos = savedStyles.positioning?.logoVerticalPos || -20;
  const headlineVerticalPos = savedStyles.positioning?.headlineVerticalPos || -50;
  const subtitleVerticalPos = savedStyles.positioning?.subtitleVerticalPos || 0;
  const featuresVerticalPos = savedStyles.positioning?.featuresVerticalPos || -32;
  const buttonsVerticalPos = savedStyles.positioning?.buttonsVerticalPos || -50;

  // Get theme-based styling
  const currentTheme = UNIFIED_THEMES.find(t => t.id === (pageData.unified_theme || `${theme}_modern`)) || UNIFIED_THEMES[0];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.primary}15)`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
          
          {/* Logo Section */}
          {logoUrl && (
            <div 
              className="animate-fade-in"
              style={{ 
                transform: `translateY(${logoVerticalPos}px)`,
                animationDelay: '0.2s'
              }}
            >
              <div className="relative">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  style={{ 
                    width: `${logoSize}px`, 
                    height: `${logoSize}px` 
                  }}
                  className="mx-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error('Logo failed to load:', logoUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 rounded-full opacity-30 blur-xl"
                  style={{
                    background: `radial-gradient(circle, ${currentTheme.colors.primary}40, transparent 70%)`
                  }}
                />
              </div>
            </div>
          )}

          {/* Title Section */}
          <div 
            className="animate-fade-in"
            style={{ 
              transform: `translateY(${headlineVerticalPos}px)`,
              animationDelay: '0.4s'
            }}
          >
            <h1 
              className="font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-4 px-4 leading-tight"
              style={{ 
                fontSize: `${Math.max(24, headlineSize * 0.8)}px`,
                lineHeight: '1.2'
              }}
            >
              {title}
            </h1>
          </div>
          
          {/* Subtitle Section */}
          {subtitle && (
            <div 
              className="animate-fade-in"
              style={{ 
                transform: `translateY(${subtitleVerticalPos}px)`,
                animationDelay: '0.6s'
              }}
            >
              <p 
                className="text-muted-foreground mb-8 sm:mb-12 px-4 max-w-2xl mx-auto"
                style={{ 
                  fontSize: `${Math.max(16, subtitleSize * 0.9)}px`,
                  lineHeight: '1.5'
                }}
              >
                {subtitle}
              </p>
            </div>
          )}

          {/* Features Section */}
          {features.length > 0 && (
            <div 
              className="animate-fade-in space-y-4 sm:space-y-6 max-w-3xl mx-auto px-4"
              style={{ 
                transform: `translateY(${featuresVerticalPos}px)`,
                animationDelay: '0.8s'
              }}
            >
              {features.map((feature: any, index: number) => (
                <div 
                  key={index} 
                  className="bg-card/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-border/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  style={{
                    animationDelay: `${0.8 + index * 0.1}s`
                  }}
                >
                  <div className="flex items-center justify-center sm:justify-start mb-3 flex-col sm:flex-row">
                    <span className="text-3xl sm:text-4xl mb-2 sm:mb-0 sm:mr-4 drop-shadow-lg">
                      {feature.emoji || '⭐'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground text-center sm:text-left">
                      {feature.title || 'Feature'}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center sm:text-left">
                    {feature.description || ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Buttons Section */}
          {buttons.length > 0 && (
            <div 
              className="animate-fade-in flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4"
              style={{ 
                transform: `translateY(${buttonsVerticalPos}px)`,
                animationDelay: '1s'
              }}
            >
              {buttons.map((button: any, index: number) => (
                <Button
                  key={index}
                  onClick={() => {
                    try {
                      console.log('🔘 Button clicked:', button);
                      if (button.url) {
                        console.log('🔗 Opening URL:', button.url);
                        window.open(button.url, '_blank');
                      } else if (button.assignment_type === 'delivery_app') {
                        console.log('🚚 Going to delivery page');
                        window.location.href = '/delivery';
                      } else {
                        console.log('⚠️ No action defined for button');
                      }
                    } catch (err) {
                      console.error('Button click error:', err);
                    }
                  }}
                  variant={button.type === 'primary' ? 'default' : 'outline'}
                  size="lg"
                  className={`
                    min-w-[200px] text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                    ${button.type === 'primary' 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg' 
                      : 'bg-card/80 backdrop-blur-sm hover:bg-card border-2 border-primary/30 hover:border-primary/60'
                    }
                  `}
                  style={{
                    animationDelay: `${1 + index * 0.1}s`
                  }}
                >
                  {button.text || 'Button'}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
    </div>
  );
}