import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CoverPageData {
  title: string;
  subtitle?: string;
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
  
  // Get slug from URL params, default to premier-concierge
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = urlSlug || window.location.pathname.replace('/', '') || 'premier-concierge';
  
  useEffect(() => {
    const fetchCoverPage = async () => {
      try {
        console.log('🚀 STANDALONE: Starting fetch for slug:', slug);
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();
        
        console.log('📊 STANDALONE Supabase response:', { data, error });
        
        if (error) {
          console.error('❌ STANDALONE Supabase error:', error);
          throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (data) {
          console.log('✅ STANDALONE Cover page found:', data);
          setCoverPage(data);
        } else {
          console.log('❌ STANDALONE No cover page found for slug:', slug);
          setError('Page not found');
        }
      } catch (err) {
        console.error('💥 STANDALONE Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoverPage();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-2"></div>
          <p className="text-yellow-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !coverPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-800">Page Not Found</h1>
          <p className="text-red-600">The page you're looking for doesn't exist.</p>
          <p className="text-sm text-red-500 mt-2">Slug: {slug}</p>
          {error && <p className="text-sm text-red-500 mt-1">Error: {error}</p>}
        </div>
      </div>
    );
  }

  // Parse the data safely
  const features = Array.isArray(coverPage.checklist) ? coverPage.checklist : [];
  const buttons = Array.isArray(coverPage.buttons) ? coverPage.buttons : [];
  const styles = coverPage.styles || {};

  // Get theme-specific styles
  const getVariantStyles = () => {
    const variant = coverPage.theme || styles.variant || 'gold';
    
    switch (variant) {
      case 'gold':
        return {
          background: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100',
          accent: 'text-yellow-600',
          text: 'text-gray-800'
        };
      case 'blue':
        return {
          background: 'bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100', 
          accent: 'text-blue-600',
          text: 'text-gray-800'
        };
      case 'green':
        return {
          background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100',
          accent: 'text-green-600', 
          text: 'text-gray-800'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100',
          accent: 'text-yellow-600',
          text: 'text-gray-800'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className={`min-h-screen ${variantStyles.background} flex flex-col items-center justify-center p-4`}>
      {/* Background Video/Image */}
      {coverPage.bg_video_url && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={coverPage.bg_video_url} type="video/mp4" />
        </video>
      )}
      {!coverPage.bg_video_url && coverPage.bg_image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverPage.bg_image_url})` }}
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo */}
        {coverPage.logo_url && (
          <div className="mb-8">
            <img
              src={coverPage.logo_url}
              alt="Logo"
              className="mx-auto h-20 w-auto"
            />
          </div>
        )}

        {/* Title */}
        <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${variantStyles.text}`}>
          {coverPage.title}
        </h1>

        {/* Subtitle */}
        {coverPage.subtitle && (
          <p className={`text-xl md:text-2xl mb-12 ${variantStyles.text} opacity-90`}>
            {coverPage.subtitle}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="grid gap-6 md:gap-8 mb-12 max-w-3xl mx-auto">
            {features.map((feature: any, index: number) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg"
              >
                <div className="flex items-center justify-center mb-3">
                  <span className="text-3xl mr-3">{feature.emoji}</span>
                  <h3 className="text-xl font-bold text-gray-800">{feature.title}</h3>
                </div>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((button: any, index: number) => {
              const handleClick = () => {
                // Only navigate to explicit URLs - no fallback logic
                if (button.url) {
                  window.open(button.url, '_blank');
                } else {
                  console.log('Button clicked but no URL defined:', button);
                }
              };

              return (
                <button
                  key={index}
                  onClick={handleClick}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    button.type === 'primary'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {button.text}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}