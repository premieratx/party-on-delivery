import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const QuickSync = () => {
  const [syncing, setSyncing] = useState(false);
  
  const syncProducts = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting product sync...');
      const { data, error } = await supabase.functions.invoke('trigger-shopify-sync', {});
      if (error) {
        console.error('Sync error:', error);
        throw error;
      }
      console.log('✅ Sync completed:', data);
      // Reload page after successful sync
      setTimeout(() => {
        console.log('🔄 Reloading page to show new products...');
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error('❌ Sync failed:', err);
      alert('Sync failed: ' + err.message);
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