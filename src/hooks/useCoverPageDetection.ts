import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export const useCoverPageDetection = () => {
  const location = useLocation();
  
  const isCoverPage = useMemo(() => {
    const pathname = location.pathname;
    
    // Direct cover page routes
    if (pathname.startsWith('/cover/')) {
      return true;
    }
    
    // Single segment URLs that could be cover page slugs
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && pathname !== '/') {
      const segment = segments[0];
      // Exclude known app routes
      const knownRoutes = ['admin', 'customer', 'affiliate', 'checkout', 'success', 'search', 'app', 'delivery'];
      if (!knownRoutes.includes(segment)) {
        return true;
      }
    }
    
    return false;
  }, [location.pathname]);
  
  return { isCoverPage };
};