import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateFlowState {
  affiliateSlug: string | null;
  coverPageId: string | null;
  sessionId: string;
  trackingStarted: boolean;
}

/**
 * Complete affiliate flow tracking hook
 * Tracks user journey from cover page through delivery app to post-checkout
 */
export function useAffiliateFlowTracking() {
  const [flowState, setFlowState] = useState<AffiliateFlowState>({
    affiliateSlug: null,
    coverPageId: null,
    sessionId: '',
    trackingStarted: false
  });

  // Generate session ID on mount
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    setFlowState(prev => ({ ...prev, sessionId }));
  }, []);

  // Start tracking from cover page
  const startAffiliateFlow = useCallback((affiliateSlug: string, coverPageId?: string) => {
    console.log('🎯 Starting affiliate flow tracking:', { affiliateSlug, coverPageId });
    
    const newState = {
      affiliateSlug,
      coverPageId: coverPageId || null,
      sessionId: flowState.sessionId,
      trackingStarted: true
    };
    
    setFlowState(newState);
    
    // Store in both session and local storage for reliability
    sessionStorage.setItem('affiliate_flow', JSON.stringify(newState));
    localStorage.setItem('affiliate_flow_backup', JSON.stringify(newState));
    
    // URL parameter tracking
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('aff', affiliateSlug);
    currentUrl.searchParams.set('sid', flowState.sessionId);
    
    // Store original referrer information
    sessionStorage.setItem('affiliate_original_url', window.location.href);
    sessionStorage.setItem('affiliate_start_time', Date.now().toString());
    
    return newState;
  }, [flowState.sessionId]);

  // Track transition to delivery app
  const trackDeliveryAppEntry = useCallback((appSlug: string) => {
    if (!flowState.trackingStarted || !flowState.affiliateSlug) {
      console.warn('⚠️ Affiliate flow not started, cannot track delivery app entry');
      return;
    }
    
    console.log('🛒 Tracking delivery app entry:', { appSlug, affiliate: flowState.affiliateSlug });
    
    // Store delivery app info for post-checkout redirect
    sessionStorage.setItem('current_delivery_app', appSlug);
    sessionStorage.setItem('affiliate_delivery_transition', JSON.stringify({
      ...flowState,
      deliveryApp: appSlug,
      entryTime: Date.now()
    }));
    
    // Ensure affiliate code persists in URL params
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has('aff')) {
      currentUrl.searchParams.set('aff', flowState.affiliateSlug);
    }
    if (!currentUrl.searchParams.has('sid')) {
      currentUrl.searchParams.set('sid', flowState.sessionId);
    }
  }, [flowState]);

  // Track order completion and create commission record
  const trackOrderCompletion = useCallback(async (orderData: {
    order_id: string;
    customer_email: string;
    subtotal: number;
    total_amount: number;
    line_items: any[];
  }) => {
    if (!flowState.trackingStarted || !flowState.affiliateSlug) {
      console.warn('⚠️ No affiliate flow to track for order completion');
      return null;
    }

    console.log('💰 Tracking order completion for affiliate:', flowState.affiliateSlug);

    try {
      const trackingData = {
        affiliate_slug: flowState.affiliateSlug,
        session_id: flowState.sessionId,
        order_data: {
          ...orderData,
          cover_page_id: flowState.coverPageId,
          delivery_app: sessionStorage.getItem('current_delivery_app'),
          tracking_url: sessionStorage.getItem('affiliate_original_url'),
          start_time: sessionStorage.getItem('affiliate_start_time')
        }
      };

      const { data, error } = await supabase.rpc('track_affiliate_order', {
        p_affiliate_slug: trackingData.affiliate_slug,
        p_session_id: trackingData.session_id,
        p_order_data: trackingData.order_data
      });

      if (error) {
        console.error('❌ Failed to track affiliate order:', error);
        return null;
      }

      console.log('✅ Affiliate order tracked successfully:', data);
      
      // Store completion info for post-checkout redirect
      sessionStorage.setItem('affiliate_order_completion', JSON.stringify({
        trackingId: data,
        affiliateSlug: flowState.affiliateSlug,
        orderId: orderData.order_id
      }));

      return data;
    } catch (error) {
      console.error('❌ Error tracking affiliate order:', error);
      return null;
    }
  }, [flowState]);

  // Get post-checkout redirect URL
  const getPostCheckoutUrl = useCallback((): string => {
    if (!flowState.affiliateSlug) {
      return '/order-complete';
    }

    // Return affiliate-specific post-checkout URL
    return `/${flowState.affiliateSlug}/post`;
  }, [flowState.affiliateSlug]);

  // Load existing flow state on mount
  useEffect(() => {
    // First try session storage
    const sessionFlow = sessionStorage.getItem('affiliate_flow');
    if (sessionFlow) {
      try {
        const parsed = JSON.parse(sessionFlow);
        setFlowState(parsed);
        return;
      } catch (e) {
        console.warn('Failed to parse session flow state');
      }
    }

    // Fallback to local storage
    const backupFlow = localStorage.getItem('affiliate_flow_backup');
    if (backupFlow) {
      try {
        const parsed = JSON.parse(backupFlow);
        setFlowState(parsed);
      } catch (e) {
        console.warn('Failed to parse backup flow state');
      }
    }

    // Check URL parameters for affiliate tracking
    const urlParams = new URLSearchParams(window.location.search);
    const affParam = urlParams.get('aff');
    const sidParam = urlParams.get('sid');
    
    if (affParam) {
      // Auto-start flow from URL parameters
      const newState = {
        affiliateSlug: affParam,
        coverPageId: null,
        sessionId: sidParam || crypto.randomUUID(),
        trackingStarted: true
      };
      setFlowState(newState);
      sessionStorage.setItem('affiliate_flow', JSON.stringify(newState));
    }
  }, []);

  // Clear flow state
  const clearAffiliateFlow = useCallback(() => {
    setFlowState({
      affiliateSlug: null,
      coverPageId: null,
      sessionId: crypto.randomUUID(),
      trackingStarted: false
    });
    
    sessionStorage.removeItem('affiliate_flow');
    sessionStorage.removeItem('affiliate_delivery_transition');
    sessionStorage.removeItem('affiliate_original_url');
    sessionStorage.removeItem('affiliate_start_time');
    sessionStorage.removeItem('current_delivery_app');
    localStorage.removeItem('affiliate_flow_backup');
  }, []);

  return {
    flowState,
    startAffiliateFlow,
    trackDeliveryAppEntry,
    trackOrderCompletion,
    getPostCheckoutUrl,
    clearAffiliateFlow,
    isTracking: flowState.trackingStarted,
    affiliateSlug: flowState.affiliateSlug
  };
}