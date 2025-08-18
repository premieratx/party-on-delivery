import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertTriangle, Zap, Database } from 'lucide-react';

export const InstantProductLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('checking');

  const checkProductCount = async () => {
    try {
      const { count } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });
      setProductCount(count || 0);
      
      if (count && count > 0) {
        setStatus('loaded');
      } else {
        setStatus('empty');
      }
    } catch (err) {
      console.error('Error checking product count:', err);
      setStatus('error');
    }
  };

  const forceLoadProducts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus('loading');

    try {
      console.log('🚨 INSTANT: Force loading all products...');
      
      // Call emergency sync to immediately populate cache
      const { data, error: functionError } = await supabase.functions.invoke('emergency-product-sync', {
        body: { 
          forceRefresh: true,
          immediate: true
        }
      });
      
      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        setResult(data);
        setStatus('loaded');
        console.log('✅ Products loaded:', data);
        
        // Wait a moment then refresh count
        setTimeout(async () => {
          await checkProductCount();
          // Force page refresh to update all components
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data?.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Product loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProductCount();
    
    // Auto-load if empty
    const autoLoad = async () => {
      if (productCount === 0) {
        console.log('🔄 Auto-loading products because cache is empty...');
        await forceLoadProducts();
      }
    };
    
    if (productCount === 0) {
      setTimeout(autoLoad, 500);
    }
  }, [productCount]);

  const getStatusColor = () => {
    switch (status) {
      case 'loaded': return 'border-green-200 bg-green-50';
      case 'loading': return 'border-blue-200 bg-blue-50';
      case 'empty': return 'border-red-200 bg-red-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loaded': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'loading': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'empty': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card className={`w-full max-w-lg mx-auto ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Product Cache Status
        </CardTitle>
        <CardDescription>
          Products in cache: <strong>{productCount ?? 'Checking...'}</strong>
          {productCount === 0 && (
            <span className="text-red-600 font-medium"> - Cache Empty!</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'empty' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No products found in cache. This will cause search and product loading to fail.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={forceLoadProducts}
          disabled={loading}
          className="w-full"
          variant={status === 'empty' ? 'default' : 'outline'}
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading Products...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {status === 'empty' ? 'Load Products Now' : 'Refresh Products'}
            </>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Loaded {result.products_synced} products successfully! Page refreshing...
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
      </CardContent>
    </Card>
  );
};