import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export const ForceProductSync = () => {
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    console.log('🔄 Force sync initiated...');
    
    try {
      // First get all products using emergency sync
      const { data, error } = await supabase.functions.invoke('emergency-product-sync', {
        body: { forceRefresh: true, clearCache: true }
      });

      if (error) {
        console.error('❌ Force sync failed:', error);
        toast.error('Sync failed: ' + error.message);
        return;
      }

      console.log('✅ Emergency sync completed:', data);
      
      if (data.success && data.products_synced > 0) {
        toast.success(`Products synced! Now fixing collection order...`);
        
        // Now fix the collection ordering for key collections
        const keyCollections = [
          'tailgate-beer', 
          'seltzer-collection', 
          'cocktail-kits', 
          'spirits', 
          'mixers-non-alcoholic'
        ];
        
        console.log('🎯 Fixing collection order for key collections...');
        
        for (const collection of keyCollections) {
          try {
            const { data: orderData, error: orderError } = await supabase.functions.invoke('shopify-collection-order', {
              body: { collection_handle: collection }
            });
            
            if (orderError) {
              console.warn(`⚠️ Failed to update order for ${collection}:`, orderError);
            } else {
              console.log(`✅ Updated order for ${collection}:`, orderData);
            }
          } catch (err) {
            console.warn(`⚠️ Error updating ${collection}:`, err);
          }
        }
        
        toast.success(`Products synced with correct Shopify ordering! Refreshing...`);
        
        // Reload page to see fresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.warning(data.error || 'Sync completed with warnings');
      }

    } catch (error) {
      console.error('💥 Sync error:', error);
      toast.error('Sync failed unexpectedly');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={handleForceSync}
        disabled={syncing}
        variant="outline"
        size="sm"
        className="bg-background/80 backdrop-blur-sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Force Sync Products'}
      </Button>
    </div>
  );
};