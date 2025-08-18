import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function QuickSyncTrigger() {
  const [loading, setLoading] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const { toast } = useToast();

  const checkProductCount = async () => {
    try {
      const { count, error } = await supabase
        .from('shopify_products_cache')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        setProductCount(count || 0);
      }
    } catch (error) {
      console.error('Error checking product count:', error);
    }
  };

  const triggerUnifiedSync = async () => {
    setLoading(true);
    try {
      console.log('🚀 Triggering unified sync...');
      
      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      });

      if (error) {
        console.error('Sync error:', error);
        throw error;
      }

      console.log('✅ Sync completed:', data);
      
      toast({
        title: "Sync Complete",
        description: `Synced ${data.products_synced} products and ${data.collections_synced} collections`,
      });

      // Refresh product count
      setTimeout(checkProductCount, 1000);

    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || 'Failed to sync products',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProductCount();
    const interval = setInterval(checkProductCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 p-4 bg-card border rounded-lg shadow-lg z-50">
      <h3 className="font-semibold mb-2">Unified Product Sync</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Products in cache: {productCount}
      </p>
      <Button 
        onClick={triggerUnifiedSync} 
        disabled={loading}
        size="sm"
        variant="default"
      >
        {loading ? 'Syncing...' : 'Sync Products'}
      </Button>
    </div>
  );
}