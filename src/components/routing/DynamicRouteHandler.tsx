import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StandaloneCoverPage } from '@/components/cover-pages/StandaloneCoverPage';
import DynamicHomepage from '@/pages/DynamicHomepage';

export const DynamicRouteHandler: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [routeType, setRouteType] = useState<'cover' | 'homepage' | 'notfound'>('notfound');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRouteType = async () => {
      if (!slug) {
        // Root path - use homepage
        setRouteType('homepage');
        setLoading(false);
        return;
      }

      // Check if it's a cover page first
      try {
        console.log('🔍 Checking if slug is a cover page:', slug);
        
        const { data: coverPageData, error } = await supabase
          .from('cover_pages')
          .select('slug')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && coverPageData) {
          console.log('✅ Found cover page for slug:', slug);
          setRouteType('cover');
          setLoading(false);
          return;
        }

        console.log('❌ No cover page found for slug:', slug);
        setRouteType('notfound');
      } catch (err) {
        console.error('❌ Error checking cover page:', err);
        setRouteType('notfound');
      } finally {
        setLoading(false);
      }
    };

    determineRouteType();
  }, [slug, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (routeType === 'cover' && slug) {
    // Render the cover page with the slug
    return <StandaloneCoverPage />;
  }

  if (routeType === 'homepage') {
    return <DynamicHomepage />;
  }

  // Not found
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page "{slug}" could not be found.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};