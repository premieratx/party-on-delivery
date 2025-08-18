import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TriggerProductSync = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerSync = async () => {
    setLoading(true);
    try {
      console.log('🚀 Triggering product sync...');
      
      const { data, error } = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });

      if (error) {
        console.error('Sync error:', error);
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Sync response:', data);
      
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${data?.productCount || 0} products`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      toast({
        title: "Sync Error",
        description: error.message || 'Failed to sync products',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h3 className="font-semibold mb-2">Product Sync Control</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Sync all products from Shopify to the database
      </p>
      <Button 
        onClick={triggerSync} 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Syncing Products...' : 'Sync Products Now'}
      </Button>
    </div>
  );
};