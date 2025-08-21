import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlowData {
  coverPageId?: string;
  coverPageSlug?: string;
  affiliateCode?: string;
  deliveryAppSlug?: string;
  markupPercentage?: number;
  markupDollarAmount?: number;
  freeShipping?: boolean;
  prefillData?: {
    address?: string;
    date?: string;
    time?: string;
  };
  sessionId: string;
  startTime: number;
  lastActivity: number;
}

interface TrackingEvent {
  type: 'cover_page_view' | 'button_click' | 'delivery_app_enter' | 'checkout_start' | 'order_complete';
  timestamp: number;
  data?: any;
}

const FLOW_STORAGE_KEY = 'partyondelivery_flow_tracking';
const EVENTS_STORAGE_KEY = 'partyondelivery_flow_events';

export function useDataFlowTracking() {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);

  // Initialize session
  useEffect(() => {
    const sessionId = generateSessionId();
    const existing = getStoredFlowData();
    
    if (existing && existing.sessionId) {
      // Continue existing session
      setFlowData(existing);
      setEvents(getStoredEvents());
    } else {
      // Start new session
      const newFlowData: FlowData = {
        sessionId,
        startTime: Date.now(),
        lastActivity: Date.now()
      };
      setFlowData(newFlowData);
      storeFlowData(newFlowData);
    }
  }, []);

  const generateSessionId = (): string => {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getStoredFlowData = (): FlowData | null => {
    try {
      const stored = sessionStorage.getItem(FLOW_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to parse flow data:', error);
      return null;
    }
  };

  const storeFlowData = (data: FlowData) => {
    try {
      const updatedData = { ...data, lastActivity: Date.now() };
      sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(updatedData));
      setFlowData(updatedData);
    } catch (error) {
      console.error('Failed to store flow data:', error);
    }
  };

  const getStoredEvents = (): TrackingEvent[] => {
    try {
      const stored = sessionStorage.getItem(EVENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to parse events:', error);
      return [];
    }
  };

  const storeEvents = (newEvents: TrackingEvent[]) => {
    try {
      sessionStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Failed to store events:', error);
    }
  };

  const trackEvent = useCallback((type: TrackingEvent['type'], data?: any) => {
    const event: TrackingEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    const updatedEvents = [...events, event];
    storeEvents(updatedEvents);

    // Only log critical events, not every single tracking call
    if (type === 'order_complete' || type === 'checkout_start') {
      console.log(`🔍 Data Flow Tracking - ${type}:`, { event, flowData });
    }
  }, [events, flowData]);

  const initializeCoverPageFlow = useCallback((coverPageId: string, coverPageSlug: string, affiliateCode?: string) => {
    if (!flowData) return;

    const updated: FlowData = {
      ...flowData,
      coverPageId,
      coverPageSlug,
      affiliateCode,
      lastActivity: Date.now()
    };

    storeFlowData(updated);
    trackEvent('cover_page_view', { coverPageId, coverPageSlug, affiliateCode });
  }, [flowData, trackEvent]);

  const trackButtonClick = useCallback((buttonData: any) => {
    if (!flowData) return;

    const updated: FlowData = {
      ...flowData,
      deliveryAppSlug: buttonData.delivery_app_slug,
      markupPercentage: buttonData.markup_percentage,
      markupDollarAmount: buttonData.markup_dollar_amount,
      freeShipping: buttonData.special_action === 'free_delivery',
      prefillData: buttonData.prefill_data,
      lastActivity: Date.now()
    };

    storeFlowData(updated);
    trackEvent('button_click', buttonData);

    // Store specific values for checkout system
    if (updated.markupPercentage) {
      sessionStorage.setItem('pricing.markupPercent', updated.markupPercentage.toString());
    }
    if (updated.markupDollarAmount) {
      sessionStorage.setItem('pricing.markupDollar', updated.markupDollarAmount.toString());
    }
    if (updated.freeShipping) {
      sessionStorage.setItem('delivery.freeShipping', 'true');
    }
    if (updated.prefillData) {
      sessionStorage.setItem('delivery.prefill', JSON.stringify(updated.prefillData));
    }
  }, [flowData, trackEvent]);

  const trackDeliveryAppEntry = useCallback((appSlug: string) => {
    trackEvent('delivery_app_enter', { appSlug });
  }, [trackEvent]);

  const trackCheckoutStart = useCallback((checkoutData: any) => {
    trackEvent('checkout_start', checkoutData);
  }, [trackEvent]);

  const trackOrderComplete = useCallback(async (orderData: any) => {
    if (!flowData) return;

    trackEvent('order_complete', orderData);

    // Save complete flow data to database
    try {
      // First get affiliate ID from affiliate code
      let affiliateId = null;
      if (flowData.affiliateCode) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('affiliate_code', flowData.affiliateCode)
          .maybeSingle();
        
        affiliateId = affiliate?.id;
      }

      if (affiliateId) {
        const flowSummary = {
          affiliate_id: affiliateId,
          affiliate_slug: flowData.affiliateCode,
          session_id: flowData.sessionId,
          cover_page_id: flowData.coverPageId,
          delivery_app_slug: flowData.deliveryAppSlug,
          order_id: orderData.order_id,
          customer_email: orderData.customer_email,
          subtotal: orderData.subtotal,
          commission_amount: flowData.markupPercentage ? 
            (orderData.subtotal * (flowData.markupPercentage / 100)) : 
            flowData.markupDollarAmount || 0,
          commission_rate: flowData.markupPercentage || 0,
          tracking_url_params: JSON.parse(JSON.stringify({
            session_id: flowData.sessionId,
            cover_page_slug: flowData.coverPageSlug,
            delivery_app_slug: flowData.deliveryAppSlug,
            markup_percentage: flowData.markupPercentage,
            markup_dollar_amount: flowData.markupDollarAmount,
            event_count: events.length,
            order_total: orderData.subtotal
          }))
        };

        await supabase
          .from('affiliate_order_tracking')
          .insert(flowSummary);

        console.log('✅ Flow data saved to database:', flowSummary);
      } else {
        console.log('📊 Flow completed without affiliate tracking:', { flowData, orderData });
      }
    } catch (error) {
      console.error('❌ Failed to save flow data:', error);
    }
  }, [flowData, events, trackEvent]);

  const clearFlow = useCallback(() => {
    sessionStorage.removeItem(FLOW_STORAGE_KEY);
    sessionStorage.removeItem(EVENTS_STORAGE_KEY);
    sessionStorage.removeItem('pricing.markupPercent');
    sessionStorage.removeItem('pricing.markupDollar');
    sessionStorage.removeItem('delivery.freeShipping');
    sessionStorage.removeItem('delivery.prefill');
    setFlowData(null);
    setEvents([]);
  }, []);

  const getFlowSummary = useCallback(() => {
    return {
      flowData,
      events,
      isComplete: events.some(e => e.type === 'order_complete'),
      hasErrors: events.length > 0 && !events.some(e => e.type === 'order_complete'),
      duration: flowData ? Date.now() - flowData.startTime : 0
    };
  }, [flowData, events]);

  const validateFlow = useCallback(() => {
    const validation = {
      hasSession: !!flowData?.sessionId,
      hasCoverPage: !!flowData?.coverPageId,
      hasDeliveryApp: !!flowData?.deliveryAppSlug,
      hasTracking: events.length > 0,
      isHealthy: true
    };

    validation.isHealthy = validation.hasSession && validation.hasTracking;
    
    // Only log validation failures, not successes
    if (!validation.isHealthy) {
      console.warn('🚨 Data Flow Validation Failed:', validation);
    }

    return validation;
  }, [flowData, events]);

  return {
    flowData,
    events,
    initializeCoverPageFlow,
    trackButtonClick,
    trackDeliveryAppEntry,
    trackCheckoutStart,
    trackOrderComplete,
    clearFlow,
    getFlowSummary,
    validateFlow,
    trackEvent
  };
}