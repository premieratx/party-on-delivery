import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const QuickSync = () => {
  const [syncing, setSyncing] = useState(false);
  
  const syncProducts = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-shopify-sync', {});
      if (error) throw error;
      console.log('Sync triggered:', data);
      // Reload page after sync
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button 
        onClick={syncProducts} 
        disabled={syncing}
        variant="outline"
        size="sm"
      >
        {syncing ? 'Syncing...' : 'Sync Products'}
      </Button>
    </div>
  );
};