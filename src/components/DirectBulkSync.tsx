import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const DirectBulkSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [productCount, setProductCount] = useState(0);

  // Check product count on load
  useEffect(() => {
    const checkProducts = async () => {
      const { data, error } = await supabase
        .from('shopify_products_cache')
        .select('id', { count: 'exact' });
      
      if (data) {
        setProductCount(data.length);
        console.log('📊 Current product count in cache:', data.length);
      }
      if (error) {
        console.error('❌ Error checking products:', error);
      }
    };
    
    checkProducts();
  }, [result]);

  const runBulkSync = async () => {
    setSyncing(true);
    setResult(null);
    
    try {
      console.log('🚀 Starting direct bulk sync...');
      
      // Call the bulk sync function directly
      const { data, error } = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        console.error('❌ Bulk sync error:', error);
        setResult({ success: false, error: error.message });
      } else {
        console.log('✅ Bulk sync completed:', data);
        setResult(data);
        
        // Recheck product count after sync
        setTimeout(async () => {
          const { data: products } = await supabase
            .from('shopify_products_cache')
            .select('id', { count: 'exact' });
          
          if (products) {
            setProductCount(products.length);
            console.log('📊 Products after sync:', products.length);
          }
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      setResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-xs">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm">Direct Bulk Sync</h3>
        
        <div className="text-xs text-muted-foreground">
          Products in cache: {productCount}
        </div>
        
        <Button 
          onClick={runBulkSync} 
          disabled={syncing}
          variant="outline"
          size="sm"
        >
          {syncing ? 'Syncing...' : 'Run Bulk Sync'}
        </Button>
        
        {result && (
          <div className="text-xs">
            <div className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </div>
            {result.productCount && (
              <div className="text-muted-foreground">
                Products: {result.productCount}
              </div>
            )}
            {result.error && (
              <div className="text-red-600 text-wrap break-all">
                {result.error}
              </div>
            )}
            {result.message && (
              <div className="text-muted-foreground text-wrap">
                {result.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};