import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressData {
  progressType: string;
  data: any;
  pageContext?: string;
}

interface SavedCart {
  cartItems: any[];
  deliveryInfo: any;
  customerInfo: any;
  appliedDiscounts: any;
  affiliateCode?: string;
  groupOrderToken?: string;
  cartValue: number;
}

export const useProgressSaver = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('sessionId', id);
    }
    return id;
  });
  const { toast } = useToast();

  // Save general progress data
  const saveProgress = useCallback(async (progressData: ProgressData) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      const { error } = await supabase
        .from('user_session_progress')
        .upsert({
          session_id: sessionId,
          user_id: user?.id || null,
          customer_email: customerEmail,
          progress_type: progressData.progressType,
          progress_data: progressData.data,
          page_context: progressData.pageContext,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }, {
          onConflict: 'session_id,progress_type,page_context',
          ignoreDuplicates: false
        });

      if (error) throw error;

      console.log('Progress saved:', progressData.progressType);
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load progress data
  const loadProgress = useCallback(async (progressType: string, pageContext?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      let query = supabase
        .from('user_session_progress')
        .select('*')
        .eq('progress_type', progressType)
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      } else {
        query = query.eq('session_id', sessionId);
      }

      if (pageContext) {
        query = query.eq('page_context', pageContext);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.[0]?.progress_data || null;
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }, [sessionId]);

  // Save cart specifically
  const saveCart = useCallback(async (cartData: SavedCart) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      const { error } = await supabase
        .from('saved_carts')
        .upsert({
          session_id: sessionId,
          user_id: user?.id || null,
          customer_email: customerEmail,
          cart_items: cartData.cartItems,
          delivery_info: cartData.deliveryInfo,
          customer_info: cartData.customerInfo,
          applied_discounts: cartData.appliedDiscounts,
          affiliate_code: cartData.affiliateCode,
          group_order_token: cartData.groupOrderToken,
          cart_value: cartData.cartValue,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

      if (error) throw error;

      console.log('Cart saved successfully');
    } catch (error) {
      console.error('Error saving cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load saved cart
  const loadCart = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      let query = supabase
        .from('saved_carts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error loading cart:', error);
      return null;
    }
  }, [sessionId]);

  // Save order draft
  const saveOrderDraft = useCallback(async (draftData: any, checkoutStep: string, stripeSessionId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      const { error } = await supabase
        .from('order_drafts')
        .upsert({
          session_id: sessionId,
          user_id: user?.id || null,
          customer_email: customerEmail,
          draft_data: draftData,
          checkout_step: checkoutStep,
          stripe_session_id: stripeSessionId,
          total_amount: draftData.totalAmount,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

      if (error) throw error;

      console.log('Order draft saved');
    } catch (error) {
      console.error('Error saving order draft:', error);
    }
  }, [sessionId]);

  // Load order draft
  const loadOrderDraft = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      let query = supabase
        .from('order_drafts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error loading order draft:', error);
      return null;
    }
  }, [sessionId]);

  // Save user preferences
  const savePreferences = useCallback(async (preferences: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      if (!user?.id && !customerEmail) {
        console.warn('Cannot save preferences without user or email');
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id || null,
          customer_email: customerEmail,
          preferences: preferences,
        });

      if (error) throw error;

      console.log('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, []);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email || localStorage.getItem('customerEmail');

      let query = supabase
        .from('user_preferences')
        .select('*')
        .limit(1);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      } else {
        return null;
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  }, []);

  // Save app state snapshot
  const saveAppSnapshot = useCallback(async (snapshotName: string, appState: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        console.warn('Cannot save app snapshot without logged in user');
        return;
      }

      const { error } = await supabase
        .from('app_state_snapshots')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          snapshot_name: snapshotName,
          app_state: appState,
        });

      if (error) throw error;

      toast({
        title: "Progress Saved",
        description: `App state saved as "${snapshotName}"`,
      });

      console.log('App snapshot saved:', snapshotName);
    } catch (error) {
      console.error('Error saving app snapshot:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save app state",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  // Auto-save functionality
  const enableAutoSave = useCallback((progressType: string, dataGetter: () => any, interval: number = 30000) => {
    const autoSaveInterval = setInterval(() => {
      const data = dataGetter();
      if (data) {
        saveProgress({
          progressType,
          data,
          pageContext: window.location.pathname,
        });
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [saveProgress]);

  return {
    isLoading,
    sessionId,
    saveProgress,
    loadProgress,
    saveCart,
    loadCart,
    saveOrderDraft,
    loadOrderDraft,
    savePreferences,
    loadPreferences,
    saveAppSnapshot,
    enableAutoSave,
  };
};