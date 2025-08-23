import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function StandaloneCoverPage() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = urlSlug || window.location.pathname.replace('/', '') || 'premier-concierge';
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        console.log('Loading page for slug:', slug);
        
        const { data, error } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
        console.log('Page data loaded:', data);
        setPageData(data);
      } catch (err) {
        console.error('Failed to load page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="mb-4">Could not load page: {slug}</p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  const features = pageData.checklist || [];
  const buttons = pageData.buttons || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto text-center py-12">
        
        {/* Logo */}
        {pageData.logo_url && (
          <div className="mb-8">
            <img 
              src={pageData.logo_url} 
              alt="Logo" 
              className="w-32 h-32 mx-auto object-contain"
            />
          </div>
        )}

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          {pageData.title}
        </h1>
        {pageData.subtitle && (
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            {pageData.subtitle}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="grid gap-6 mb-12 max-w-3xl mx-auto">
            {features.map((feature: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-3xl mr-3">{feature.emoji}</span>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((button: any, index: number) => (
              <button
                key={index}
                onClick={() => {
                  if (button.url) {
                    window.open(button.url, '_blank');
                  } else if (button.assignment_type === 'delivery_app') {
                    window.location.href = '/delivery';
                  }
                }}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  button.type === 'primary'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300'
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