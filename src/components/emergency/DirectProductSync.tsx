import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

export const DirectProductSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number>(0);

  const checkProducts = async () => {
    try {
      const { count } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });
      setProductCount(count || 0);
      return count || 0;
    } catch (err) {
      console.error('Error checking products:', err);
      return 0;
    }
  };

  const syncProducts = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚨 DIRECT: Starting immediate Shopify sync...');
      
      // Call the emergency sync function
      const { data, error: syncError } = await supabase.functions.invoke('emergency-product-sync', {
        body: { forceRefresh: true }
      });

      if (syncError) {
        console.error('Sync function error:', syncError);
        throw new Error(`Sync failed: ${syncError.message}`);
      }

      if (data?.success) {
        setResult(data);
        console.log(`✅ SYNC SUCCESS: ${data.products_synced} products`);
        
        // Check new count
        const newCount = await checkProducts();
        console.log(`📊 New product count: ${newCount}`);
        
        // Refresh interface without reloading page
        if (newCount > 0) {
          console.log('✅ Products synced successfully, refreshing components');
          window.dispatchEvent(new CustomEvent('products-updated'));
        }
      } else {
        throw new Error(data?.error || 'Sync returned no data');
      }
    } catch (err) {
      console.error('Direct sync error:', err);
      setError(err instanceof Error ? err.message : 'Unknown sync error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkProducts();
    // Disabled auto-sync - using SimpleForceSync instead
  }, []);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Direct Product Sync
        </CardTitle>
        <CardDescription>
          Current products: <strong>{productCount}</strong>
          {productCount === 0 && <span className="text-red-500 ml-2">⚠️ Cache Empty!</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {productCount === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No products in cache! This will break all product loading and search.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={syncProducts}
          disabled={syncing}
          className="w-full"
          size="lg"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing Products...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {productCount === 0 ? 'Load Products Now' : 'Refresh All Products'}
            </>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ SUCCESS: Synced {result.products_synced} products! Refreshing...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ❌ Error: {error}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={checkProducts}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Product Count
        </Button>
      </CardContent>
    </Card>
  );
};