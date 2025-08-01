import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or get session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalyticsTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const referrer = document.referrer;
        const userAgent = navigator.userAgent;
        
        // Get current user email if logged in
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || null;

        // Track the page view
        await supabase.functions.invoke('track-analytics', {
          body: {
            sessionId,
            pagePath: location.pathname + location.search,
            referrer,
            userAgent,
            userEmail
          }
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    // Track page view with a small delay to ensure the page has loaded
    const timer = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};