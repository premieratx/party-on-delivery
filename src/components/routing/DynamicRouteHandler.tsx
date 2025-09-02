import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StandaloneCoverPage } from '@/components/cover-pages/StandaloneCoverPage';
import AdminLogin from '@/pages/AdminLogin';

export const DynamicRouteHandler: React.FC = () => {
  const location = useLocation();
  const [routeType, setRouteType] = useState<'cover' | 'admin-login' | 'notfound'>('notfound');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRouteType = async () => {
      const pathname = location.pathname.slice(1); // Remove leading slash

      // Handle admin login route
      if (pathname === 'affiliate/admin-login') {
        setRouteType('admin-login');
        setLoading(false);
        return;
      }

      // Skip root path - it should never reach this handler
      if (!pathname || pathname === '') {
        setRouteType('notfound');
        setLoading(false);
        return;
      }

      // Check if it's a cover page
      try {
        const { data: coverPageData, error } = await supabase
          .from('cover_pages')
          .select('slug, title, is_active')
          .eq('slug', pathname)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && coverPageData) {
          setRouteType('cover');
          setLoading(false);
          return;
        }

        setRouteType('notfound');
      } catch (err) {
        setRouteType('notfound');
      } finally {
        setLoading(false);
      }
    };

    determineRouteType();
  }, [location.pathname]);

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

  if (routeType === 'admin-login') {
    return <AdminLogin />;
  }

  if (routeType === 'cover') {
    const pathname = location.pathname.slice(1); // Remove leading slash
    return <StandaloneCoverPage slug={pathname} />;
  }

  // Not found
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