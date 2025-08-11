import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, isRetryableError } from '@/utils/retryWrapper';
import { useToast } from '@/hooks/use-toast';

interface DashboardSyncOptions {
  onOrderUpdate?: (order: any) => void;
  onCustomerUpdate?: (customer: any) => void;
  onAffiliateUpdate?: (affiliate: any) => void;
  dashboardType: 'admin' | 'customer' | 'affiliate';
  userEmail?: string;
  affiliateCode?: string;
}

/**
 * Hook to sync dashboard data in real-time when orders are processed
 */
export function useDashboardSync(options: DashboardSyncOptions) {
  const { toast } = useToast();
  const { onOrderUpdate, onCustomerUpdate, onAffiliateUpdate, dashboardType, userEmail, affiliateCode } = options;

  const refreshDashboardData = useCallback(async () => {
    try {
      const response: any = await withRetry(async () =>
        await supabase.rpc('get_dashboard_data', {
          dashboard_type: dashboardType,
          user_email: userEmail ?? null,
          affiliate_code: affiliateCode ?? null,
        }),
        { shouldRetry: isRetryableError, maxRetries: 3, initialDelay: 800 }
      );

      const rpcResult = response?.data;
      const error = response?.error;

      if (error) throw error;
      if (!rpcResult?.success) throw new Error(rpcResult?.error || 'Failed to refresh dashboard');

      const dashboardData = rpcResult.data;

      if (onOrderUpdate && dashboardData.orders) {
        dashboardData.orders.forEach((order: any) => onOrderUpdate(order));
      }
      if (onCustomerUpdate && dashboardData.customers) {
        dashboardData.customers.forEach((customer: any) => onCustomerUpdate(customer));
      }
      if (onAffiliateUpdate && dashboardData.affiliateReferrals) {
        dashboardData.affiliateReferrals.forEach((referral: any) => onAffiliateUpdate(referral));
      }

      return dashboardData;
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      return null;
    }
  }, [dashboardType, userEmail, affiliateCode, onOrderUpdate, onCustomerUpdate, onAffiliateUpdate]);

  useEffect(() => {
    // Set up real-time subscriptions for relevant tables
    const subscriptions: any[] = [];

    // Subscribe to customer orders changes
    const ordersChannel = supabase
      .channel('dashboard-orders-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders'
        },
        async (payload) => {
          console.log('Order change detected:', payload);
          
          // Refresh dashboard data when orders change
          await refreshDashboardData();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Order",
              description: `Order #${payload.new.order_number} has been placed.`,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();
    
    subscriptions.push(ordersChannel);

    // Subscribe to customer changes if relevant
    if (dashboardType === 'admin' || dashboardType === 'customer') {
      const customersChannel = supabase
        .channel('dashboard-customers-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customers'
          },
          async (payload) => {
            console.log('Customer change detected:', payload);
            await refreshDashboardData();
          }
        )
        .subscribe();
      
      subscriptions.push(customersChannel);
    }

    // Subscribe to affiliate referrals if relevant
    if (dashboardType === 'admin' || dashboardType === 'affiliate') {
      const referralsChannel = supabase
        .channel('dashboard-referrals-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'affiliate_referrals'
          },
          async (payload) => {
            console.log('Referral change detected:', payload);
            await refreshDashboardData();
            
            if (payload.eventType === 'INSERT' && dashboardType === 'affiliate') {
              toast({
                title: "Commission Earned!",
                description: `You earned $${payload.new.commission_amount} commission.`,
                duration: 5000,
              });
            }
          }
        )
        .subscribe();
      
      subscriptions.push(referralsChannel);
    }

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [dashboardType, userEmail, affiliateCode, refreshDashboardData, toast]);

  return { refreshDashboardData };
}