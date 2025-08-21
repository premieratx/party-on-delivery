import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface CoverPageTracker {
  coverPageSlug?: string;
  freeShippingEligible: boolean;
  source: 'cover_page' | 'direct' | 'other';
}

export function useCoverPageTracking() {
  const location = useLocation();
  const [tracking, setTracking] = useState<CoverPageTracker>({
    freeShippingEligible: false,
    source: 'direct'
  });

  useEffect(() => {
    // Check if user came from a cover page with free shipping
    const freeShippingFromStorage = sessionStorage.getItem('shipping.free');
    const coverPageSlug = sessionStorage.getItem('last_cover_page_slug');
    
    if (freeShippingFromStorage === '1' && coverPageSlug) {
      setTracking({
        coverPageSlug,
        freeShippingEligible: true,
        source: 'cover_page'
      });
    } else {
      // Check URL params for cover page navigation
      const params = new URLSearchParams(location.search);
      const fromCover = params.get('from_cover');
      
      if (fromCover) {
        // Check if this cover page has free shipping enabled
        checkCoverPageFreeShipping(fromCover);
      }
    }
  }, [location]);

  const checkCoverPageFreeShipping = async (slug: string) => {
    try {
      const response = await fetch(`/api/cover-page/${slug}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.free_shipping_enabled) {
          sessionStorage.setItem('shipping.free', '1');
          sessionStorage.setItem('last_cover_page_slug', slug);
          setTracking({
            coverPageSlug: slug,
            freeShippingEligible: true,
            source: 'cover_page'
          });
        }
      }
    } catch (error) {
      console.error('Failed to check cover page free shipping:', error);
    }
  };

  const clearTracking = () => {
    sessionStorage.removeItem('shipping.free');
    sessionStorage.removeItem('last_cover_page_slug');
    setTracking({
      freeShippingEligible: false,
      source: 'direct'
    });
  };

  return {
    tracking,
    clearTracking
  };
}