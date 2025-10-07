import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StandaloneCoverPage } from '@/components/cover-pages/StandaloneCoverPage';

export const HomePage: React.FC = () => {
  const [defaultSlug, setDefaultSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDefaultCoverPage = async () => {
      try {
        console.log('🏠 Loading default homepage cover page...');
        
        // First, try to find a page marked as default homepage
        const { data: defaultPage } = await supabase
          .from('cover_pages')
          .select('slug')
          .eq('is_default_homepage', true)
          .eq('is_active', true)
          .maybeSingle();

        if (defaultPage) {
          console.log('✅ Found default homepage:', defaultPage.slug);
          setDefaultSlug(defaultPage.slug);
        } else {
          // Fallback: get the first active cover page
          console.log('⚠️ No default homepage found, finding first active cover page...');
          const { data: firstPage } = await supabase
            .from('cover_pages')
            .select('slug')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (firstPage) {
            console.log('✅ Using first active cover page:', firstPage.slug);
            setDefaultSlug(firstPage.slug);
          } else {
            console.log('❌ No active cover pages found');
          }
        }
      } catch (error) {
        console.error('❌ Error loading default cover page:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultCoverPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (defaultSlug) {
    return <StandaloneCoverPage slug={defaultSlug} />;
  }

  // If no cover pages exist, redirect to the concierge home
  return <Navigate to="/home" replace />;
};

export default HomePage;
