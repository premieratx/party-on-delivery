import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: dashboardData, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: { 
          type: dashboardType,
          email: userEmail,
          affiliateCode: affiliateCode
        }
      });

      if (error) throw error;
      if (dashboardData.error) throw new Error(dashboardData.error);

      // Trigger appropriate update callbacks
      if (onOrderUpdate && dashboardData.data.orders) {
        dashboardData.data.orders.forEach((order: any) => onOrderUpdate(order));
      }
      if (onCustomerUpdate && dashboardData.data.customers) {
        dashboardData.data.customers.forEach((customer: any) => onCustomerUpdate(customer));
      }
      if (onAffiliateUpdate && dashboardData.data.affiliateReferrals) {
        dashboardData.data.affiliateReferrals.forEach((referral: any) => onAffiliateUpdate(referral));
      }

      return dashboardData.data;
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