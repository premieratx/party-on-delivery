import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export const ForceCollectionOrderSync = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncCollectionOrder = async () => {
    setSyncing(true);
    console.log('🔄 Starting Shopify collection order sync...');
    
    try {
      // First sync tailgate-beer specifically
      console.log('📦 Syncing tailgate-beer collection order...');
      const { data: tailgateData, error: tailgateError } = await supabase.functions.invoke('shopify-collection-order', {
        body: { collection_handle: 'tailgate-beer' }
      });
      
      if (tailgateError) {
        console.error('❌ Tailgate beer sync failed:', tailgateError);
        throw tailgateError;
      }
      
      console.log('✅ Tailgate beer collection synced:', tailgateData);

      // Then do a full unified sync to update all collections
      console.log('🔄 Starting full Shopify sync...');
      const { data: syncData, error: syncError } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      });
      
      if (syncError) {
        console.error('❌ Full sync failed:', syncError);
        throw syncError;
      }
      
      console.log('✅ Full Shopify sync completed:', syncData);
      
      // Clear any cached data
      localStorage.removeItem('products-cache');
      localStorage.removeItem('collections-cache');
      
      toast({
        title: "Sync Completed", 
        description: `Updated tailgate-beer and all collections with exact Shopify order`,
        variant: "default"
      });

      // Force page reload to show updated order
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || 'Failed to sync collection order',
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={syncCollectionOrder}
      disabled={syncing}
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync Shopify Order'}
    </Button>
  );
};