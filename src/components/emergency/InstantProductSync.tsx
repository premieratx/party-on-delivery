import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function InstantProductSync() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerSync = async () => {
    setLoading(true);
    try {
      console.log('🚀 Triggering unified Shopify sync...');
      
      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Sync result:', data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data.products_synced} products and ${data.collections_synced} collections`,
      });

    } catch (error) {
      console.error('❌ Sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || 'Failed to sync products',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Instant Product Sync</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Trigger unified Shopify sync for both search (productType) and delivery (collections)
      </p>
      <Button 
        onClick={triggerSync} 
        disabled={loading}
        variant="default"
      >
        {loading ? 'Syncing...' : 'Sync Now'}
      </Button>
    </div>
  );
}