import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CoverStartScreen from '@/components/cover-pages/CoverStartScreen';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye } from 'lucide-react';

interface CoverPageData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: any; // JSON from database
  buttons: any; // JSON from database
  is_active: boolean;
  theme?: string;
  styles?: any;
}

interface StandaloneCoverPageProps {
  slug?: string; // Can be passed as prop or taken from URL params
}

const COVER_THEMES = {
  original: { name: 'Original Blue', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  gold: { name: 'Luxury Gold', background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)' },
  platinum: { name: 'Modern Platinum', background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
  ocean: { name: 'Ocean Depth', background: 'linear-gradient(135deg, #0077be 0%, #00a8cc 50%, #0083b0 100%)' },
  sunset: { name: 'Sunset Glow', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)' },
  forest: { name: 'Forest Green', background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' }
};

export const StandaloneCoverPage: React.FC<StandaloneCoverPageProps> = ({ slug: propSlug }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = propSlug || paramSlug;
  const [coverPage, setCoverPage] = useState<CoverPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCoverPage = async () => {
      if (!slug) {
        setError('No cover page slug provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading cover page with slug:', slug);
        
        const { data, error: dbError } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (dbError) {
          console.error('❌ Database error:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        if (!data) {
          console.error('❌ Cover page not found for slug:', slug);
          throw new Error(`Cover page not found: ${slug}`);
        }

        console.log('✅ Cover page loaded:', data);
        console.log('🔍 Checklist data from database:', data.checklist);
        console.log('🔍 Checklist type:', typeof data.checklist);
        setCoverPage(data);
      } catch (err: any) {
        console.error('❌ Error loading cover page:', err);
        setError(err.message || 'Failed to load cover page');
      } finally {
        setLoading(false);
      }
    };

    loadCoverPage();
  }, [slug]);

  // Convert cover page buttons to CoverStartButton format
  const convertButtons = (buttons: any[]) => {
    return buttons.map((button, index) => ({
      text: button.text || `Button ${index + 1}`,
      onClick: () => {
        if (button.type === 'url' && button.url) {
          if (button.url.startsWith('#')) {
            // Handle anchor links
            const element = document.querySelector(button.url);
            element?.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.open(button.url, '_blank', 'noopener,noreferrer');
          }
        } else if (button.type === 'concierge_app') {
          // Route to concierge home page
          window.location.href = '/home';
        } else if ((button.type === 'delivery_app' || button.assignment_type === 'delivery_app') && (button.app_slug || button.delivery_app_id)) {
          // Handle both old (delivery_app_id) and new (app_slug) data structures
          const appIdentifier = button.app_slug || button.delivery_app_id;
          window.location.href = `/app/${appIdentifier}`;
        } else if (button.type === 'checkout') {
          window.location.href = '/checkout';
        }
      },
      bgColor: button.bg_color,
      textColor: button.text_color,
      appSlug: button.app_slug || button.delivery_app_id
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cover page...</p>
        </div>
      </div>
    );
  }

  if (error || !coverPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cover Page Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The requested cover page could not be found or is not active.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Slug: <code className="bg-gray-100 px-2 py-1 rounded">{slug}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black flex items-center justify-center"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        overscrollBehavior: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        height: '100vh',
        overflow: 'hidden'
      } as React.CSSProperties}
    >
      {/* Admin Preview Badge (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
            <Eye className="w-3 h-3 mr-1" />
            Preview Mode
          </Badge>
        </div>
      )}

      {/* Centered Phone Frame */}
      <div className="relative">
        {/* Phone Frame */}
        <div 
          className="relative w-[390px] h-[844px] transition-all duration-300 shadow-2xl bg-black rounded-[2.5rem] overflow-hidden"
          style={{
            touchAction: 'none',
            userSelect: 'none',
            overscrollBehavior: 'none'
          } as React.CSSProperties}
        >
          <div 
            className="absolute inset-2 rounded-[1.5rem] overflow-hidden"
            style={{
              touchAction: 'none',
              overscrollBehavior: 'none'
            } as React.CSSProperties}
          >
            <CoverStartScreen
              appName={coverPage.title}
              title={coverPage.title}
              subtitle={coverPage.subtitle}
              logoUrl={coverPage.logo_url}
              logoHeight={coverPage.logo_height}
              backgroundImageUrl={coverPage.bg_image_url}
              backgroundVideoUrl={coverPage.bg_video_url}
              checklistItems={(() => {
                const checklist = Array.isArray(coverPage.checklist) ? coverPage.checklist : 
                  (typeof coverPage.checklist === 'string' ? JSON.parse(coverPage.checklist) : []);
                console.log('🔍 Checklist items being passed to CoverStartScreen:', checklist);
                return checklist;
              })()}
              buttons={convertButtons(Array.isArray(coverPage.buttons) ? coverPage.buttons : 
                (typeof coverPage.buttons === 'string' ? JSON.parse(coverPage.buttons) : []))}
              titleSize={coverPage.styles?.title_size}
              subtitleSize={coverPage.styles?.subtitle_size}
              checklistSize={coverPage.styles?.checklist_size}
              backgroundColor={coverPage.styles?.background_color}
              titleOffsetY={coverPage.styles?.title_offset_y}
              subtitleOffsetY={coverPage.styles?.subtitle_offset_y}
              checklistOffsetY={coverPage.styles?.checklist_offset_y}
              buttonsOffsetY={coverPage.styles?.buttons_offset_y}
              logoOffsetY={coverPage.styles?.logo_offset_y}
              logoBgColor={coverPage.styles?.logo_bg_color}
              logoBgMode={coverPage.styles?.logo_bg_mode}
              entranceAnimation={coverPage.styles?.entrance_animation}
              animationDuration={coverPage.styles?.animation_duration}
            />
          </div>
        </div>
      </div>

      {/* SEO Meta Tags - without setting document.title to avoid filename display */}
      {typeof document !== 'undefined' && (
        <>
          {coverPage.subtitle && (
            <meta name="description" content={coverPage.subtitle} />
          )}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:title" content={coverPage.title} />
          {coverPage.subtitle && (
            <meta property="og:description" content={coverPage.subtitle} />
          )}
          {coverPage.logo_url && (
            <meta property="og:image" content={coverPage.logo_url} />
          )}
        </>
      )}
    </div>
  );
};

export default StandaloneCoverPage;