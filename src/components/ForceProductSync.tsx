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
      const { data, error } = await supabase.functions.invoke('force-product-sync', {
        body: { force: true }
      });

      if (error) {
        console.error('❌ Force sync failed:', error);
        toast.error('Sync failed: ' + error.message);
        return;
      }

      console.log('✅ Force sync completed:', data);
      toast.success(`Products synced successfully! ${data.products_synced} products loaded.`);
      
      // Reload page to see fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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