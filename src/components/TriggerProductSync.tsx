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
      
      const { data, error } = await supabase.functions.invoke('trigger-shopify-sync', {
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
    <div className="bg-background border rounded-lg shadow-lg max-w-xs">
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1">Product Sync</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Sync products from Shopify
        </p>
        <Button 
          onClick={triggerSync} 
          disabled={loading}
          size="sm"
          className="w-full text-xs"
        >
          {loading ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
    </div>
  );
};