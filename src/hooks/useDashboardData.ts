import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, isRetryableError } from '@/utils/retryWrapper';

export interface DashboardData {
  orders: any[];
  customers: any[];
  affiliateReferrals: any[];
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

      const response: any = await withRetry(async () =>
        await supabase.rpc('get_dashboard_data', {
          dashboard_type: options.type,
          user_email: options.email ?? null,
          affiliate_code: options.affiliateCode ?? null,
        }),
        { shouldRetry: isRetryableError, maxRetries: 3, initialDelay: 800 }
      );
      const rpcResult = response?.data;
      const fetchError = response?.error;

      if (fetchError) {
        throw new Error(fetchError.message || String(fetchError));
      }

      if (!rpcResult?.success) {
        throw new Error(rpcResult?.error || 'Failed to load dashboard data');
      }

      setData(rpcResult.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Dashboard data fetch error:', err);
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

// Helper hooks for specific dashboard types
export function useAdminDashboard(refreshInterval = 30000) {
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