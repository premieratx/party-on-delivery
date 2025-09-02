import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  orders: any[];
  customers: any[];
  affiliateReferrals: any[];
  abandonedOrders?: any[];
  totalRevenue: number;
  totalOrders: number;
  pendingCommissions: number;
  recentActivity: any[];
}

interface UseDashboardDataOptions {
  type: 'admin' | 'customer' | 'affiliate';
  email?: string;
  affiliateCode?: string;
  refreshInterval?: number; // in milliseconds
}

export function useDashboardData(options: UseDashboardDataOptions) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data via edge function...');

      // Use the edge function exclusively to avoid RLS issues
      const { data: response, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: {
          type: options.type,
          email: options.email ?? null,
          affiliateCode: options.affiliateCode ?? null,
          includeAbandonedOrders: options.type === 'admin' // Always include abandoned orders for admin dashboard
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || String(error));
      }

      if (!response?.success) {
        console.error('Dashboard data fetch failed:', response?.error);
        throw new Error(response?.error || 'Failed to load dashboard data');
      }

      console.log('✅ Dashboard data loaded successfully:', response.data);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Dashboard data fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [options.type, options.email, options.affiliateCode]);

  // Auto-refresh if interval is specified
  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(fetchData, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.refreshInterval]);

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Helper hooks for specific dashboard types - DISABLED AUTO-REFRESH FOR ADMIN
export function useAdminDashboard(refreshInterval = 0) {
  return useDashboardData({ type: 'admin', refreshInterval });
}

export function useCustomerDashboard(email: string, refreshInterval = 60000) {
  return useDashboardData({ type: 'customer', email, refreshInterval });
}

export function useAffiliateDashboard(email?: string, affiliateCode?: string, refreshInterval = 30000) {
  return useDashboardData({ 
    type: 'affiliate', 
    email, 
    affiliateCode, 
    refreshInterval 
  });
}