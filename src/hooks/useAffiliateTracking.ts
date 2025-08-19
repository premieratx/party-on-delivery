import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface AffiliateTrackingState {
  affiliateSlug: string | null;
  coverPageId: string | null;
  sessionId: string;
  isTracking: boolean;
}

export const useAffiliateTracking = () => {
  const [searchParams] = useSearchParams();
  const [trackingState, setTrackingState] = useState<AffiliateTrackingState>({
    affiliateSlug: null,
    coverPageId: null,
    sessionId: '',
    isTracking: false
  });

  // Generate session ID once on mount
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    setTrackingState(prev => ({ ...prev, sessionId }));
  }, []);

  // Load tracking from URL params or session storage
  useEffect(() => {
    const affiliateFromUrl = searchParams.get('aff');
    const sessionFromUrl = searchParams.get('sid');
    
    // Try to load from session storage first
    const storedTracking = sessionStorage.getItem('affiliate-tracking');
    let tracking = null;
    
    if (storedTracking) {
      try {
        tracking = JSON.parse(storedTracking);
      } catch (e) {
        console.warn('Failed to parse stored affiliate tracking');
      }
    }
    
    // Use URL params if available, otherwise use stored data
    if (affiliateFromUrl || tracking) {
      const newState = {
        affiliateSlug: affiliateFromUrl || tracking?.affiliateSlug || null,
        coverPageId: tracking?.coverPageId || null,
        sessionId: sessionFromUrl || tracking?.sessionId || trackingState.sessionId,
        isTracking: true
      };
      
      setTrackingState(newState);
      
      // Store in session storage
      sessionStorage.setItem('affiliate-tracking', JSON.stringify(newState));
      
      // Also store in localStorage for cross-tab persistence
      localStorage.setItem('affiliate-flow-state', JSON.stringify(newState));
    }
  }, [searchParams]);

  const startTracking = (affiliateSlug: string, coverPageId?: string) => {
    const newState = {
      affiliateSlug,
      coverPageId: coverPageId || null,
      sessionId: trackingState.sessionId,
      isTracking: true
    };
    
    setTrackingState(newState);
    
    // Store in both session and local storage
    sessionStorage.setItem('affiliate-tracking', JSON.stringify(newState));
    localStorage.setItem('affiliate-flow-state', JSON.stringify(newState));
    
    console.log('🔗 Started affiliate tracking:', newState);
  };

  const updateCoverPage = (coverPageId: string) => {
    const newState = { ...trackingState, coverPageId };
    setTrackingState(newState);
    sessionStorage.setItem('affiliate-tracking', JSON.stringify(newState));
    localStorage.setItem('affiliate-flow-state', JSON.stringify(newState));
  };

  const trackDeliveryApp = (appSlug: string) => {
    if (trackingState.isTracking) {
      const deliveryAppData = {
        appSlug,
        enteredAt: new Date().toISOString(),
        affiliateSlug: trackingState.affiliateSlug,
        sessionId: trackingState.sessionId
      };
      
      sessionStorage.setItem('affiliate-delivery-app', JSON.stringify(deliveryAppData));
      console.log('🚚 Tracked delivery app entry:', deliveryAppData);
    }
  };

  const getTrackingForOrder = () => {
    if (!trackingState.isTracking) return null;
    
    return {
      affiliate_slug: trackingState.affiliateSlug,
      cover_page_id: trackingState.coverPageId,
      session_id: trackingState.sessionId,
      delivery_app_data: JSON.parse(sessionStorage.getItem('affiliate-delivery-app') || '{}')
    };
  };

  const clearTracking = () => {
    setTrackingState({
      affiliateSlug: null,
      coverPageId: null,
      sessionId: trackingState.sessionId, // Keep session ID
      isTracking: false
    });
    
    sessionStorage.removeItem('affiliate-tracking');
    sessionStorage.removeItem('affiliate-delivery-app');
    localStorage.removeItem('affiliate-flow-state');
  };

  return {
    trackingState,
    startTracking,
    updateCoverPage,
    trackDeliveryApp,
    getTrackingForOrder,
    clearTracking,
    isTracking: trackingState.isTracking
  };
};