import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Package, Zap } from 'lucide-react';

export function ShopifyForceSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { toast } = useToast();

  const forceSync = async () => {
    setSyncing(true);
    try {
      console.log('🚀 FORCE SYNC: Starting unified Shopify sync...');
      
      // Trigger unified Shopify sync
      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      });

      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }

      console.log('✅ Sync result:', data);
      
      // Clear browser caches
      localStorage.removeItem('products-cache');
      localStorage.removeItem('collections-cache');
      
      toast({
        title: "🚀 Sync Complete",
        description: `Synced ${data.products_synced || 'all'} products and ${data.collections_synced || 'all'} collections from Shopify`,
      });

      setLastSync(new Date().toLocaleString());

      // Force page reload to show updated products
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || 'Failed to sync products from Shopify',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Shopify Product Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Force refresh all product data, collections, and ordering from Shopify. 
          This will update products that have been changed in your Shopify store.
        </p>
        
        {lastSync && (
          <p className="text-xs text-muted-foreground">
            Last sync: {lastSync}
          </p>
        )}
        
        <Button 
          onClick={forceSync} 
          disabled={syncing}
          className="w-full"
          size="lg"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Force Sync Shopify Products
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}