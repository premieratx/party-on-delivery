import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

export const ForceProductSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  const checkProductCount = async () => {
    try {
      const { count } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });
      setProductCount(count || 0);
    } catch (err) {
      console.error('Error checking product count:', err);
    }
  };

  React.useEffect(() => {
    checkProductCount();
  }, []);

  const handleForceSync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚨 Starting FORCE product sync for all 1000+ products...');
      
      // First clear any existing cache
      console.log('🗑️ Clearing old cache...');
      
      // Call emergency sync to force reload all products
      const { data, error: functionError } = await supabase.functions.invoke('emergency-product-sync', {
        body: { 
          forceRefresh: true,
          clearCache: true 
        }
      });
      
      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        setResult(data);
        await checkProductCount(); // Refresh count
        console.log('✅ Force sync completed:', data);
        
        // Also clear any local storage caches
        localStorage.removeItem('instant_products_cache_v3');
        localStorage.removeItem('instant_products_cache_v3_expiry');
        
        // Refresh the page after successful sync
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data?.error || 'Force sync failed');
      }
    } catch (err) {
      console.error('Force sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to force sync products');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Force Product Sync
        </CardTitle>
        <CardDescription>
          Force sync all 1000+ products from Shopify to fix loading issues across all delivery apps.
          <br />
          Current products in cache: <strong>{productCount || 0}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleForceSync}
            disabled={syncing}
            className="flex-1"
            variant="default"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Force Syncing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Force Sync All Products
              </>
            )}
          </Button>
          
          <Button 
            onClick={checkProductCount}
            variant="outline"
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Successfully synced {result.products_synced} products! Page will refresh automatically.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {productCount !== null && productCount < 100 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Only {productCount} products in cache. Expected 1000+. Please force sync.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};