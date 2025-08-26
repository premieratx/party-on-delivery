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
  
  console.log('🔍 Features from database:', features);
  console.log('🔍 Features type:', typeof features);
  
  // Parse YOUR EXACT SAVED STYLES
  const savedStyles = pageData.styles || {};
  const theme = pageData.theme || pageData.unified_theme || 'gold';
  
  console.log('🎨 USING YOUR EXACT SAVED STYLES:');
  console.log('Theme:', theme);
  console.log('Saved styles:', savedStyles);
  console.log('🔍 Raw checklist from pageData:', pageData.checklist);
  console.log('🔍 Parsed features array:', features);
  
  // Apply YOUR EXACT SIZING from saved styles
  const logoSize = pageData.logo_height || savedStyles.title_size || 120;
  const headlineSize = savedStyles.title_size || 32;
  const subtitleSize = savedStyles.subtitle_size || 16;
  
  // Apply YOUR EXACT POSITIONING - using correct field names from editor
  const logoVerticalPos = savedStyles.logo_offset_y || savedStyles.positioning?.logoVerticalPos || -80;
  const headlineVerticalPos = savedStyles.title_offset_y || savedStyles.positioning?.headlineVerticalPos || -50;
  const subtitleVerticalPos = savedStyles.subtitle_offset_y || savedStyles.positioning?.subtitleVerticalPos || -30;
  const featuresVerticalPos = savedStyles.checklist_offset_y || savedStyles.positioning?.featuresVerticalPos || 0;
  const buttonsVerticalPos = savedStyles.buttons_offset_y || savedStyles.positioning?.buttonsVerticalPos || 50;

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
        {/* Content - Responsive Layout that fits screen */}
        <div className="relative z-10 flex min-h-screen flex-col justify-between items-center px-6 py-8 md:py-4">
          
          {/* TOP SECTION: Logo + Title */}
          <div 
            className="flex-shrink-0 text-center w-full"
            style={{ transform: `translateY(${logoVerticalPos}px)` }}
          >
            {/* Logo with responsive sizing */}
            {logoUrl && (
              <div className="mb-6 md:mb-4">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="mx-auto object-contain"
                  style={{ 
                    width: `${logoSize}px`, 
                    height: `${logoSize}px`,
                    maxWidth: '120px',
                    maxHeight: '120px'
                  }}
                  onError={(e) => {
                    console.error('Logo failed to load:', logoUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title with responsive styling */}
            <div style={{ transform: `translateY(${headlineVerticalPos}px)` }}>
              <h1 
                className="font-bold mb-4 px-4 leading-tight"
                style={{ 
                  color: themeColors.primary || '#F5B800',
                  fontSize: `${headlineSize}px`
                }}
              >
                {title}
              </h1>
            </div>
            
            {/* Subtitle with responsive styling */}
            {subtitle && (
              <div style={{ transform: `translateY(${subtitleVerticalPos}px)` }}>
                <p 
                  className="text-white/80 mb-6 px-4 leading-relaxed"
                  style={{ fontSize: `${subtitleSize}px` }}
                >
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* MIDDLE SECTION: Features (compact layout) */}
          {features.length > 0 && (
            <div 
              className="flex-1 px-2 my-6 w-full max-w-sm"
              style={{ transform: `translateY(${featuresVerticalPos}px)` }}
            >
              <div className="space-y-4">
                {features.slice(0, 3).map((feature: any, index: number) => {
                  // Handle both string and object formats
                  const featureText = typeof feature === 'string' ? feature : (feature.title || feature.text || 'Feature');
                  const featureEmoji = (typeof feature === 'object' && feature.emoji) || '⭐';
                  
                  console.log(`🔍 Rendering feature ${index}:`, featureText);
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-4">{featureEmoji}</span>
                        <h3 className="text-base font-bold text-white">{featureText}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: Buttons (always visible) */}
          {buttons.length > 0 && (
            <div 
              className="flex-shrink-0 flex flex-col gap-4 w-full max-w-sm"
              style={{ transform: `translateY(${buttonsVerticalPos}px)` }}
            >
              {buttons.slice(0, 2).map((button: any, index: number) => (
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
                  className="w-full text-lg font-semibold h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
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