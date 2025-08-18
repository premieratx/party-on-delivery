import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function EmergencyForceSync() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const forceSync = async () => {
    setLoading(true);
    try {
      console.log('🚨 IMMEDIATE SYNC - Starting...');
      
      // Try immediate sync first (no auth required)
      const { data, error } = await supabase.functions.invoke('immediate-sync');

      if (error) {
        console.error('❌ Immediate sync error:', error);
        throw error;
      }

      console.log('✅ Immediate sync result:', data);
      
      toast({
        title: "🚨 IMMEDIATE SYNC COMPLETE",
        description: `Synced ${data.products_synced || data.products_count} products from Shopify`,
      });

      // Force page reload to see new products
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Immediate sync failed:', error);
      toast({
        variant: "destructive",
        title: "Immediate Sync Failed",
        description: error.message || 'Failed to sync products from Shopify',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 p-4 bg-destructive text-destructive-foreground border rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">🚨 EMERGENCY SYNC</h3>
      <p className="text-sm mb-3">
        Force sync from Shopify NOW
      </p>
      <Button 
        onClick={forceSync} 
        disabled={loading}
        size="sm"
        variant="secondary"
      >
        {loading ? 'SYNCING...' : 'FORCE SYNC NOW'}
      </Button>
    </div>
  );
}