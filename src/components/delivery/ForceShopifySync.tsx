import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ForceShopifySync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  const triggerSync = async () => {
    try {
      setSyncing(true);
      console.log('🔄 Forcing fresh Shopify sync with proper ordering...');
      
      // Trigger unified sync to get fresh data with proper ordering
      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        console.log(`✅ Shopify sync completed: ${data.products_count} products, ${data.collections_count} collections`);
        setLastSync(new Date());
        
        // Trigger collection order sync for specific collections
        const collections = [
          'spirits', 'tailgate-beer', 'seltzer-collection', 'cocktail-kits',
          'mixers-non-alcoholic', 'party-supplies', 'champagne', 'disco-collection'
        ];
        
        for (const collection of collections) {
          try {
            const { data: orderData } = await supabase.functions.invoke('shopify-collection-order', {
              body: { collection_handle: collection }
            });
            
            if (orderData?.success) {
              console.log(`✅ Updated order for ${collection}: ${orderData.products_updated} products`);
            }
          } catch (orderError) {
            console.warn(`⚠️ Failed to update order for ${collection}:`, orderError);
          }
        }
        
        toast({
          title: 'Shopify Sync Complete',
          description: `Updated ${data.products_count} products with proper Shopify ordering`,
        });
        
        // Dispatch custom event to refresh product components
        window.dispatchEvent(new CustomEvent('forceProductRefresh'));
        
        // Force page reload to see new data with fixed collection_handles
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (err) {
      console.error('❌ Shopify sync error:', err);
      toast({
        title: 'Sync Failed',
        description: err instanceof Error ? err.message : 'Failed to sync with Shopify',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
      <div className="flex-1">
        <h3 className="font-medium">Shopify Collection Sync</h3>
        <p className="text-sm text-muted-foreground">
          Force refresh all products with proper Shopify collection ordering
        </p>
        {lastSync && (
          <p className="text-xs text-muted-foreground mt-1">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <Button
        onClick={triggerSync}
        disabled={syncing}
        size="sm"
        className="gap-2"
      >
        {syncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Force Sync
          </>
        )}
      </Button>
    </div>
  );
};