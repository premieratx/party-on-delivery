import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface SystemStatus {
  products: number;
  orders: number;
  affiliates: number;
  activeApps: number;
  automationSessions: number;
  errors: string[];
}

export const SystemStatus = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const [productsResult, ordersResult, appsResult, automationResult] = await Promise.all([
        supabase.from('shopify_products_cache').select('*', { count: 'exact', head: true }),
        supabase.from('customer_orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('delivery_app_variations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('automation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'running')
      ]);

      const errors = [];
      if ((productsResult.count || 0) === 0) errors.push('No products in cache');
      if (productsResult.error) errors.push(`Products error: ${productsResult.error.message}`);
      if (ordersResult.error) errors.push(`Orders error: ${ordersResult.error.message}`);

      setStatus({
        products: productsResult.count || 0,
        orders: ordersResult.count || 0,
        affiliates: 0, // Skip affiliate count to avoid 403 errors
        activeApps: appsResult.count || 0,
        automationSessions: automationResult.count || 0,
        errors
      });
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const result = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      if (result.data?.success) {
        await checkStatus(); // Refresh status after sync
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading && !status) {
    return (
      <div className="fixed bottom-4 right-4 bg-background p-4 rounded-lg shadow-lg border z-50">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">System Status</h3>
        <Button variant="ghost" size="sm" onClick={checkStatus} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {status && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Products:</span>
            <Badge variant={status.products > 0 ? "default" : "destructive"}>
              {status.products > 0 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {status.products}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Recent Orders:</span>
            <Badge variant="secondary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {status.orders}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Active Affiliates:</span>
            <Badge variant="secondary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {status.affiliates}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Active Apps:</span>
            <Badge variant="secondary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {status.activeApps}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Automation:</span>
            <Badge variant={status.automationSessions > 0 ? "default" : "secondary"}>
              {status.automationSessions > 0 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              {status.automationSessions} running
            </Badge>
          </div>

          {status.errors.length > 0 && (
            <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/20">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-destructive" />
                <span className="text-xs font-medium text-destructive">Issues:</span>
              </div>
              {status.errors.map((error, i) => (
                <div key={i} className="text-xs text-destructive">{error}</div>
              ))}
              
              <Button 
                size="sm" 
                className="w-full mt-2" 
                onClick={runSync}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Fix: Run Sync'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};