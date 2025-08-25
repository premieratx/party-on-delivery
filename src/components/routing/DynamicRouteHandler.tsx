import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StandaloneCoverPage } from '@/components/cover-pages/StandaloneCoverPage';
import DynamicHomepage from '@/pages/DynamicHomepage';

export const DynamicRouteHandler: React.FC = () => {
  const location = useLocation();
  const [routeType, setRouteType] = useState<'cover' | 'homepage' | 'notfound'>('notfound');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRouteType = async () => {
      const pathname = location.pathname.slice(1); // Remove leading slash
      console.log('🔍 DYNAMIC ROUTE HANDLER - Processing pathname:', pathname);
      console.log('🔍 Full location object:', location);

      if (!pathname || pathname === '') {
        console.log('✅ Root path detected - using homepage');
        setRouteType('homepage');
        setLoading(false);
        return;
      }

      // Check if it's a cover page first
      try {
        console.log('🔍 Querying database for cover page with slug:', pathname);
        
        const { data: coverPageData, error } = await supabase
          .from('cover_pages')
          .select('slug, title, is_active')
          .eq('slug', pathname)
          .eq('is_active', true)
          .maybeSingle();

        console.log('📊 Database query result:', { 
          data: coverPageData, 
          error,
          searchedSlug: pathname 
        });

        if (!error && coverPageData) {
          console.log(`✅ SUCCESS: Found active cover page "${coverPageData.title}" for slug:`, pathname);
          setRouteType('cover');
          setLoading(false);
          return;
        }

        console.log('❌ No active cover page found for slug:', pathname);
        setRouteType('notfound');
      } catch (err) {
        console.error('❌ Database error while checking cover page:', err);
        setRouteType('notfound');
      } finally {
        setLoading(false);
      }
    };

    determineRouteType();
  }, [location.pathname]);

  console.log('🎯 Route Handler State:', {
    pathname: location.pathname,
    routeType,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (routeType === 'cover') {
    const pathname = location.pathname.slice(1); // Remove leading slash
    console.log('🎯 Rendering StandaloneCoverPage for slug:', pathname);
    return <StandaloneCoverPage slug={pathname} />;
  }

  if (routeType === 'homepage') {
    console.log('🏠 Rendering DynamicHomepage');
    return <DynamicHomepage />;
  }

  // Not found
  console.log('❌ Rendering 404 page for:', location.pathname);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page "{location.pathname}" could not be found.
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