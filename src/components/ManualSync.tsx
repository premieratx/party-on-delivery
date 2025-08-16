import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ManualSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [caching, setCaching] = useState(false);
  const { toast } = useToast();
  
  const testInstantCache = async () => {
    setCaching(true);
    try {
      console.log('🧪 Testing instant cache...');
      
      const { data, error } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        console.error('Cache test failed:', error);
        toast({
          title: 'Cache Test Failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('✅ Cache test result:', data);
      
      if (data?.success && data?.data) {
        const productCount = data.data.products?.length || 0;
        const collectionCount = data.data.collections?.length || 0;
        
        toast({
          title: 'Cache Test Success!',
          description: `Found ${productCount} products in ${collectionCount} collections`,
        });
      } else {
        toast({
          title: 'Cache Test Warning',
          description: 'No product data returned',
          variant: 'destructive'
        });
      }
      
    } catch (err: any) {
      console.error('❌ Cache test error:', err);
      toast({
        title: 'Cache Test Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setCaching(false);
    }
  };

  const forceBulkSync = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting forced bulk sync...');
      
      // Step 1: Shopify bulk sync
      const { data: bulkData, error: bulkError } = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      if (bulkError) {
        throw new Error(`Bulk sync failed: ${bulkError.message}`);
      }
      
      console.log('✅ Bulk sync result:', bulkData);
      
      // Step 2: Test cache immediately
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const { data: cacheData, error: cacheError } = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: true }
      });
      
      if (cacheError) {
        throw new Error(`Cache refresh failed: ${cacheError.message}`);
      }
      
      const productCount = cacheData?.data?.products?.length || 0;
      const collectionCount = cacheData?.data?.collections?.length || 0;
      
      toast({
        title: 'Sync Complete!',
        description: `Synced ${productCount} products in ${collectionCount} collections`,
      });
      
      // Reload page after successful sync
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      toast({
        title: 'Sync Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2">
      <Button 
        onClick={testInstantCache} 
        disabled={caching}
        variant="outline"
        size="sm"
        className="bg-background/90 backdrop-blur-sm"
      >
        {caching ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Database className="w-4 h-4 mr-2" />
        )}
        Test Cache
      </Button>
      
      <Button 
        onClick={forceBulkSync} 
        disabled={syncing}
        variant="outline"
        size="sm"
        className="bg-background/90 backdrop-blur-sm"
      >
        {syncing ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )}
        Force Sync
      </Button>
    </div>
  );
};