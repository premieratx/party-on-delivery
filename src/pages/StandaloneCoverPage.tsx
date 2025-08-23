import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function StandaloneCoverPage() {
  const slug = window.location.pathname.replace('/', '') || 'premier-concierge';
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        console.log('📱 Loading page for slug:', slug);
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (!data) {
          console.error('❌ No page found for slug:', slug);
          throw new Error(`No page found for slug: ${slug}`);
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
  }, [slug]);

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
          <p className="text-red-600 mb-4">Slug: <code className="bg-red-100 px-2 py-1 rounded">{slug}</code></p>
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

  const features = pageData.checklist || [];
  const buttons = pageData.buttons || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto text-center py-8 sm:py-12">
        
        {/* Logo */}
        {pageData.logo_url && (
          <div className="mb-8">
            <img 
              src={pageData.logo_url} 
              alt="Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto object-contain"
            />
          </div>
        )}

        {/* Title & Subtitle */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 px-4">
          {pageData.title}
        </h1>
        {pageData.subtitle && (
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 sm:mb-12 px-4">
            {pageData.subtitle}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="grid gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
            {features.map((feature: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-2xl sm:text-3xl mr-3">{feature.emoji}</span>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            {buttons.map((button: any, index: number) => (
              <button
                key={index}
                onClick={() => {
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
                }}
                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 ${
                  button.type === 'primary'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-yellow-400 shadow-lg'
                }`}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}