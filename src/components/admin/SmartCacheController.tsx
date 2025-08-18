import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Database, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

interface CacheStats {
  total_products: number;
  total_collections: number;
  last_updated: string | null;
  cache_age_minutes: number | null;
  categories: Record<string, number>;
}

export const SmartCacheController: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('smart-cache-manager', {
        body: { action: 'stats' }
      });

      if (error) throw error;

      setStats(data?.stats || null);
    } catch (error) {
      console.error('Error loading cache stats:', error);
      toast.error('Failed to load cache statistics');
    } finally {
      setLoading(false);
    }
  };

  const triggerBulkSync = async () => {
    try {
      setSyncing(true);
      toast.info('Starting bulk product sync...');
      
      const { data, error } = await supabase.functions.invoke('bulk-product-sync', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Bulk sync completed! ${data?.stats?.total_products || 0} products cached`);
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error during bulk sync:', error);
      toast.error('Bulk sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const refreshCache = async () => {
    try {
      setLoading(true);
      toast.info('Refreshing cache...');
      
      const { data, error } = await supabase.functions.invoke('smart-cache-manager', {
        body: { action: 'refresh' }
      });

      if (error) throw error;

      toast.success('Cache refreshed successfully');
      await loadStats();
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast.error('Cache refresh failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getCacheStatus = () => {
    if (!stats) return { status: 'unknown', color: 'secondary' };
    
    if (stats.total_products === 0) {
      return { status: 'empty', color: 'destructive' };
    }
    
    if (!stats.cache_age_minutes) {
      return { status: 'fresh', color: 'default' };
    }
    
    if (stats.cache_age_minutes < 15) {
      return { status: 'fresh', color: 'default' };
    } else if (stats.cache_age_minutes < 60) {
      return { status: 'aging', color: 'secondary' };
    } else {
      return { status: 'stale', color: 'destructive' };
    }
  };

  const { status, color } = getCacheStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Smart Cache Controller
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cache Status:</span>
            <Badge variant={color as any}>
              {status === 'empty' && 'Cache Empty'}
              {status === 'fresh' && 'Fresh'}
              {status === 'aging' && 'Aging'}
              {status === 'stale' && 'Stale'}
              {status === 'unknown' && 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total_products}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total_collections}</div>
              <div className="text-xs text-muted-foreground">Collections</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {stats.cache_age_minutes !== null ? `${stats.cache_age_minutes}m` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Cache Age</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <span className="text-xl mx-auto mb-1 block">📊</span>
              <div className="text-2xl font-bold">{Object.keys(stats.categories).length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {stats && Object.keys(stats.categories).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Category Breakdown:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.categories).map(([category, count]) => (
                <Badge key={category} variant="outline">
                  {category}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={triggerBulkSync}
            disabled={syncing || loading}
            className="flex-1"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Full Sync from Shopify
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={refreshCache}
            disabled={loading || syncing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Quick Refresh
          </Button>
        </div>

        {/* Last Updated */}
        {stats?.last_updated && (
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(stats.last_updated).toLocaleString()}
          </div>
        )}

        {/* Empty State Action */}
        {stats?.total_products === 0 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              No products in cache. Run a full sync to populate the cache.
            </p>
            <Button onClick={triggerBulkSync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Initialize Cache'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};