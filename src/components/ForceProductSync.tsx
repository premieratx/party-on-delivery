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
      // Use emergency sync function instead of unified sync to avoid rate limiting
      const { data, error } = await supabase.functions.invoke('emergency-product-sync', {
        body: { forceRefresh: true, clearCache: true }
      });

      if (error) {
        console.error('❌ Force sync failed:', error);
        toast.error('Sync failed: ' + error.message);
        return;
      }

      console.log('✅ Force sync completed:', data);
      
      if (data.success) {
        toast.success(`Products synced successfully! ${data.products_synced || 0} products loaded.`);
        
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