import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PhoneFrameLayout } from '@/components/layout/PhoneFrameLayout';
import { TEMPLATE_VARIANTS } from '@/components/templates/CoverPageTemplates';

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
      } catch (err: any) {
        console.error('💥 Failed to load page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-destructive/5 p-4">
        <div className="text-center max-w-md bg-card rounded-lg p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">Could Not Load Page</h1>
          <p className="text-muted-foreground mb-4">Slug: <code className="bg-muted px-2 py-1 rounded">{pageSlug}</code></p>
          {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded">{error}</p>}
          <Button onClick={() => window.location.reload()} variant="destructive" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Parse JSON strings from database - YOUR EXACT SAVED DATA
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
  
  // Parse YOUR EXACT SAVED STYLES
  const savedStyles = pageData.styles || {};
  const theme = pageData.theme || pageData.unified_theme || 'gold';
  
  console.log('🎨 USING YOUR EXACT SAVED STYLES:');
  console.log('Theme:', theme);
  console.log('Saved styles:', savedStyles);
  
  // Apply YOUR EXACT SIZING from saved styles
  const logoSize = savedStyles.sizing?.logoSize || 149;
  const headlineSize = savedStyles.sizing?.headlineSize || 34;
  const subtitleSize = savedStyles.sizing?.subtitleSize || 20;
  
  // Apply YOUR EXACT POSITIONING
  const logoVerticalPos = savedStyles.positioning?.logoVerticalPos || -20;
  const headlineVerticalPos = savedStyles.positioning?.headlineVerticalPos || -50;
  const subtitleVerticalPos = savedStyles.positioning?.subtitleVerticalPos || 0;
  const featuresVerticalPos = savedStyles.positioning?.featuresVerticalPos || -32;
  const buttonsVerticalPos = savedStyles.positioning?.buttonsVerticalPos || -50;

  // Get YOUR EXACT SAVED THEME VARIANT
  const themeVariant = TEMPLATE_VARIANTS[theme as keyof typeof TEMPLATE_VARIANTS] || TEMPLATE_VARIANTS.gold;
  const themeColors = savedStyles.customColors || themeVariant.styles.customColors;

  return (
    <PhoneFrameLayout>
      {/* Background with theme colors */}
      <div 
        className="relative h-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${themeColors.primary}20, ${themeColors.secondary}15, ${themeColors.accent}10)`
        }}
      >
        {/* Content - Phone Frame Optimized Layout */}
        <div className="relative z-10 flex h-full flex-col justify-center items-center px-6 py-4">
          
          {/* TOP SECTION: Logo + Title */}
          <div className="flex-shrink-0 text-center w-full">
            {/* Logo with YOUR EXACT positioning and sizing */}
            {logoUrl && (
              <div 
                className="mb-4"
                style={{ transform: `translateY(${logoVerticalPos * 0.3}px)` }}
              >
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  style={{ 
                    width: `${Math.min(logoSize, 100)}px`, 
                    height: `${Math.min(logoSize, 100)}px` 
                  }}
                  className="mx-auto object-contain"
                  onError={(e) => {
                    console.error('Logo failed to load:', logoUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title with YOUR EXACT styling */}
            <div style={{ transform: `translateY(${headlineVerticalPos * 0.2}px)` }}>
              <h1 
                className="font-bold mb-2 px-4 leading-tight"
                style={{ 
                  fontSize: `${Math.min(headlineSize, 24)}px`,
                  color: themeColors.primary || '#F5B800'
                }}
              >
                {title}
              </h1>
            </div>
            
            {/* Subtitle with YOUR EXACT styling */}
            {subtitle && (
              <div style={{ transform: `translateY(${subtitleVerticalPos * 0.2}px)` }}>
                <p 
                  className="text-white/80 mb-4 px-4"
                  style={{ 
                    fontSize: `${Math.min(subtitleSize, 14)}px`,
                    lineHeight: '1.4'
                  }}
                >
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* MIDDLE SECTION: Features (scrollable if needed) */}
          {features.length > 0 && (
            <div 
              className="flex-1 overflow-y-auto px-2 my-4 w-full"
              style={{ transform: `translateY(${featuresVerticalPos * 0.2}px)` }}
            >
              <div className="space-y-3">
                {features.slice(0, 4).map((feature: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-3">{feature.emoji || '⭐'}</span>
                      <h3 className="text-sm font-bold text-white">{feature.title || 'Feature'}</h3>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed pl-8">
                      {feature.description || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: Buttons (always visible) */}
          {buttons.length > 0 && (
            <div 
              className="flex-shrink-0 flex flex-col gap-3 w-full"
              style={{ transform: `translateY(${buttonsVerticalPos * 0.2}px)` }}
            >
              {buttons.slice(0, 3).map((button: any, index: number) => (
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
                  className="w-full text-base font-semibold h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{
                    backgroundColor: button.type === 'primary' ? (themeColors.primary || '#F5B800') : 'transparent',
                    borderColor: button.type !== 'primary' ? (themeColors.primary || '#F5B800') : undefined,
                    color: button.type === 'primary' ? '#000000' : (themeColors.primary || '#F5B800')
                  }}
                >
                  {button.text || 'Button'}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PhoneFrameLayout>
  );
}