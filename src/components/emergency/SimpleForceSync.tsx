import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function SimpleForceSync() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const forceSync = async () => {
    setLoading(true);
    try {
      console.log('🚨 SIMPLE FORCE SYNC - Starting...');
      
      // Try immediate sync first
      const { data, error } = await supabase.functions.invoke('immediate-sync');

      if (error) {
        console.error('❌ Immediate sync error:', error);
        throw error;
      }

      console.log('✅ Simple sync result:', data);
      
      toast({
        title: "🚨 SYNC COMPLETE",
        description: `Synced ${data.products_synced || data.products_count || 'products'} from Shopify`,
      });

      // Force page reload to see new products
      setTimeout(() => {
        console.log('🔄 Reloading page to show products...');
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('❌ Simple sync failed:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || 'Failed to sync products from Shopify',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed top-4 left-4 p-4 bg-red-600 text-white border rounded-lg shadow-lg z-[9999]"
      style={{ position: 'fixed', zIndex: 9999 }}
    >
      <h3 className="font-bold mb-2 text-white">🚨 FORCE SYNC</h3>
      <p className="text-sm mb-3 text-white">
        No products found. Force sync now.
      </p>
      <Button 
        onClick={forceSync} 
        disabled={loading}
        size="sm"
        variant="secondary"
        className="bg-white text-red-600 hover:bg-gray-100"
      >
        {loading ? 'SYNCING...' : 'SYNC NOW'}
      </Button>
    </div>
  );
}