import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export const useCoverPageDetection = () => {
  const location = useLocation();
  
  
  const isCoverPage = useMemo(() => {
    const pathname = location.pathname;
    console.log('🕵️ Cover page detection for:', pathname);
    
    // Direct cover page routes
    if (pathname.startsWith('/cover/')) {
      console.log('✅ Detected as cover page (direct route)');
      return true;
    }
    
    // Single segment URLs that could be cover page slugs
    const segments = pathname.split('/').filter(Boolean);
    // console.log('📍 Path segments:', segments);
    
    if (segments.length === 1 && pathname !== '/') {
      const segment = segments[0];
      // Exclude known app routes
      const knownRoutes = ['admin', 'customer', 'affiliate', 'checkout', 'success', 'search', 'app', 'delivery'];
      const isKnownRoute = knownRoutes.includes(segment);
      // console.log('🔍 Single segment check:', { segment, isKnownRoute });
      
      if (!isKnownRoute) {
        console.log('✅ Detected as cover page (single segment)');
        return true;
      }
    }
    
    console.log('❌ Not a cover page');
    return false;
  }, [location.pathname]);
  
  return { isCoverPage };
};