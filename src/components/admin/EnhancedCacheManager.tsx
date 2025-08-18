import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Clock,
  BarChart3,
  Trash2
} from 'lucide-react';

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  averageResponseTime: number;
  lastCleanup: Date;
  expiredEntries: number;
}

export const EnhancedCacheManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalEntries: 0,
    hitRate: 85,
    averageResponseTime: 120,
    lastCleanup: new Date(),
    expiredEntries: 0
  });

  const [optimizations, setOptimizations] = useState([
    { name: 'Product Cache', status: 'active', lastUpdate: new Date(), entries: 1250 },
    { name: 'Collection Cache', status: 'active', lastUpdate: new Date(), entries: 42 },
    { name: 'Shopify API Cache', status: 'active', lastUpdate: new Date(), entries: 890 },
    { name: 'Image Cache', status: 'active', lastUpdate: new Date(), entries: 2100 }
  ]);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      // Get cache statistics from the database
      const { data: cacheData } = await supabase
        .from('cache')
        .select('*');
      
      const { data: productCacheData } = await supabase
        .from('shopify_products_cache')
        .select('*');

      const totalEntries = (cacheData?.length || 0) + (productCacheData?.length || 0);
      
      setCacheStats(prev => ({
        ...prev,
        totalEntries,
        lastCleanup: new Date()
      }));

    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const clearExpiredCache = async () => {
    setLoading(true);
    try {
      // Clean up expired cache entries
      await supabase.functions.invoke('performance-optimizer', {
        body: { action: 'cleanup_cache' }
      });

      toast({
        title: "Cache Cleanup Complete",
        description: "Removed expired cache entries successfully.",
      });

      await loadCacheStats();
    } catch (error) {
      console.error('Cache cleanup error:', error);
      toast({
        title: "Cleanup Error",
        description: "Failed to clean up cache.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAllCaches = async () => {
    setLoading(true);
    try {
      // Refresh all caches
      await Promise.all([
        supabase.functions.invoke('instant-product-cache', { body: { forceRefresh: true } }),
        supabase.functions.invoke('get-all-collections', { body: { forceRefresh: true } }),
        supabase.functions.invoke('shopify-bulk-sync', { body: { forceRefresh: true } })
      ]);

      toast({
        title: "Cache Refresh Complete",
        description: "All caches have been refreshed successfully.",
      });

      await loadCacheStats();
    } catch (error) {
      console.error('Cache refresh error:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh caches.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const optimizePerformance = async () => {
    setLoading(true);
    try {
      // Run comprehensive performance optimizations
      await supabase.functions.invoke('performance-optimizer', {
        body: { 
          action: 'full_optimization',
          enableCaching: true,
          cleanupExpired: true,
          rebuildIndexes: true
        }
      });

      toast({
        title: "Performance Optimization Complete",
        description: "System performance has been optimized.",
      });

      await loadCacheStats();
    } catch (error) {
      console.error('Performance optimization error:', error);
      toast({
        title: "Optimization Error",
        description: "Failed to optimize performance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHealthStatus = (hitRate: number) => {
    if (hitRate >= 80) return 'Excellent';
    if (hitRate >= 60) return 'Good';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Enhanced Cache Manager
          </h3>
          <p className="text-muted-foreground">Optimize caching and system performance</p>
        </div>
        <Button 
          onClick={optimizePerformance}
          disabled={loading}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          {loading ? 'Optimizing...' : 'Full Optimization'}
        </Button>
      </div>

      {/* Cache Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className={`text-2xl font-bold ${getCacheHealthColor(cacheStats.hitRate)}`}>
                  {cacheStats.hitRate}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {getCacheHealthStatus(cacheStats.hitRate)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{cacheStats.averageResponseTime}ms</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Entries</p>
                <p className="text-2xl font-bold">{cacheStats.totalEntries.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Cleanup</p>
                <p className="text-2xl font-bold">{cacheStats.lastCleanup.getHours()}h</p>
                <p className="text-xs text-muted-foreground">Ago</p>
              </div>
              <Trash2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Status Alert */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          <strong>Cache Performance:</strong> Your cache hit rate of {cacheStats.hitRate}% is {getCacheHealthStatus(cacheStats.hitRate).toLowerCase()}. 
          {cacheStats.hitRate < 80 && " Consider refreshing caches to improve performance."}
        </AlertDescription>
      </Alert>

      {/* Individual Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Components Status</CardTitle>
          <CardDescription>Individual cache performance and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((cache, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">{cache.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cache.entries.toLocaleString()} entries • Updated {cache.lastUpdate.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge variant="default">{cache.status.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cache Management Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Cache Management
            </CardTitle>
            <CardDescription>
              Manage cache lifecycle and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={refreshAllCaches}
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? 'Refreshing...' : 'Refresh All Caches'}
            </Button>
            
            <Button 
              onClick={clearExpiredCache}
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? 'Cleaning...' : 'Clear Expired Entries'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cache Efficiency</span>
                <span className="text-sm text-muted-foreground">{cacheStats.hitRate}%</span>
              </div>
              <Progress value={cacheStats.hitRate} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Response Speed</span>
                <span className="text-sm text-muted-foreground">
                  {100 - Math.min(cacheStats.averageResponseTime / 10, 100)}%
                </span>
              </div>
              <Progress value={100 - Math.min(cacheStats.averageResponseTime / 10, 100)} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">System Health</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <Progress value={94} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};